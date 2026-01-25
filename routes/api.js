const express = require("express");
const router = express.Router();

// Example API route
router.get("/hello", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

// Example POST route
router.post("/data", (req, res) => {
  const { data } = req.body;
  res.json({ received: data, timestamp: new Date() });
});

const multer = require("multer");
const {
  analyzeImage,
  generateMatchQuestions,
  generateRefinementQuestions,
  refineMatchesWithAnswers,
} = require("../services/gemini");
const supabase = require("../services/supabase");
const {
  findMatchesForInquiry,
  findMatchesForInventoryItem,
} = require("../services/matching");
const {
  sendUserFoundNotification,
  sendAdminNotification,
} = require("../services/email");

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

const rateLimit = require("../middleware/rateLimit");
const {
  verifyToken,
  requireAssistant,
  optionalAuth,
} = require("../middleware/auth");

// POST /inquiry - User submits a lost item (image and/or text)
router.post(
  "/inquiry",
  rateLimit,
  optionalAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { description: textDescription } = req.body;
      const hasImage = !!req.file;
      const hasText = !!textDescription && textDescription.trim();

      // Require at least one of image or text
      if (!hasImage && !hasText) {
        return res.status(400).json({
          error: "Either an image or text description is required",
        });
      }

      let analysis = null;
      let imageUrl = null;
      let finalDescription = textDescription || "";

      // If image provided, analyze with Gemini and upload
      if (hasImage) {
        console.log("Analyzing image with Gemini...");
        // Pass user's text description as context to improve Gemini's analysis
        analysis = await analyzeImage(
          req.file.buffer,
          req.file.mimetype,
          hasText ? textDescription : null,
        );
        console.log("Gemini Analysis:", analysis);

        // Upload Image to Supabase Storage
        const fileExt = req.file.mimetype.split("/")[1];
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (uploadError) {
          console.error("Supabase Upload Error:", uploadError);
          return res.status(500).json({
            error: "Failed to upload image",
            details: uploadError,
          });
        }

        // Get Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(fileName);
        imageUrl = publicUrl;

        // Use Gemini description if no text provided, or combine both
        if (!hasText) {
          finalDescription = analysis.detailed_description;
        } else {
          finalDescription = `${textDescription}. AI Analysis: ${analysis.detailed_description}`;
        }
      }

      // Attach user_id if authenticated
      const userId = req.user?.id || null;

      // Save to database
      const { data: insertData, error: insertError } = await supabase
        .from("inquiries")
        .insert([
          {
            user_id: userId,
            image_url: imageUrl,
            description: finalDescription,
            gemini_data: analysis,
            status: "submitted",
          },
        ])
        .select();

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        return res.status(500).json({ error: "Failed to save inquiry" });
      }

      const inquiry = insertData[0];

      // Trigger matching process
      const keywords =
        analysis?.keywords || analysis?.short_description || finalDescription;

      await findMatchesForInquiry(inquiry.id, keywords);

      // Fetch the generated matches
      const { data: matches } = await supabase
        .from("matches")
        .select(
          `
        *,
        inventory:inventory(*)
      `,
        )
        .eq("inquiry_id", inquiry.id)
        .order("score", { ascending: false });

      // Send admin notification
      try {
        await sendAdminNotification({
          description: finalDescription,
          inquiry_id: inquiry.id,
          user_email: req.user?.email || "Anonymous",
        });
        console.log("Admin notification sent");
      } catch (emailErr) {
        console.error("Failed to send admin notification:", emailErr);
      }

      res.status(200).json({
        message: "Inquiry received",
        data: inquiry,
        matches: matches || [],
        analysis,
      });
    } catch (error) {
      console.error("Error processing inquiry:", error);
      res.status(500).json({
        error: error.message || "Internal Server Error",
      });
    }
  },
);

// POST /inventory - Anyone can submit a found item
router.post(
  "/inventory",
  rateLimit,
  optionalAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      // Similar logic, might be just text or also image.
      // Assuming image is optional or required. Let's assume required for now.
      if (!req.file) {
        return res.status(400).json({ error: "Image is required" });
      }

      const analysis = await analyzeImage(req.file.buffer, req.file.mimetype);

      const funcFileExt = req.file.mimetype.split("/")[1];
      const fileName = `inventory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${funcFileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("items") // Admin's found items
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        return res
          .status(500)
          .json({ error: "Failed to upload image", details: uploadError });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("items").getPublicUrl(fileName);

      const { data: insertData, error: insertError } = await supabase
        .from("inventory")
        .insert([
          {
            image_url: publicUrl,
            description: analysis.detailed_description,
            gemini_data: analysis,
            status: "active",
          },
        ])
        .select();

      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        return res.status(500).json({
          error: "Failed to save inventory item",
          details: insertError,
        });
      }

      res
        .status(200)
        .json({ message: "Item added to inventory", data: insertData[0] });

      // Trigger matching against existing inquiries
      const inventoryItem = insertData[0];
      const keywords =
        analysis.keywords ||
        analysis.short_description ||
        analysis.detailed_description;
      await findMatchesForInventoryItem(inventoryItem.id, keywords);
    } catch (error) {
      console.error("Error adding to inventory:", error);
      res.status(500).json({
        error: error.message || "Internal Server Error",
      });
    }
  },
);

// GET /api/inventory - Browse and search inventory
router.get("/inventory", verifyToken, requireAssistant, async (req, res) => {
  try {
    const { search, status = "active", limit = 50, offset = 0 } = req.query;

    if (search) {
      // Use full-text search RPC function
      const { data, error } = await supabase.rpc("match_inventory", {
        query_text: search,
        match_threshold: 0.01, // Low threshold to return more results
        match_count: parseInt(limit),
      });

      if (error) throw error;

      // Filter by status if provided
      const filteredData = status
        ? data.filter((item) => item.status === status)
        : data;

      res.status(200).json({
        message: "Inventory items retrieved successfully",
        data: filteredData || [],
        count: filteredData.length,
      });
    } else {
      // Regular browse with pagination
      const { data, error, count } = await supabase
        .from("inventory")
        .select("*", { count: "exact" })
        .eq("status", status)
        .order("created_at", { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) throw error;

      res.status(200).json({
        message: "Inventory items retrieved successfully",
        data: data || [],
        count: count || 0,
      });
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/inventory/:id - Edit inventory item
router.patch(
  "/inventory/:id",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { description, status, location_found } = req.body;

      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid inventory ID format" });
      }

      // Validate status if provided
      if (status && !["active", "claimed", "archived"].includes(status)) {
        return res.status(400).json({
          error: "Invalid status. Must be 'active', 'claimed', or 'archived'",
        });
      }

      // Build update object
      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (location_found !== undefined)
        updateData.location_found = location_found;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      // Fetch current item to verify it exists
      const { data: item, error: fetchError } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      // Update item
      const { data: updatedItem, error: updateError } = await supabase
        .from("inventory")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        message: "Inventory item updated successfully",
        data: updatedItem,
      });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// DELETE /api/inventory/:id - Delete or archive item
router.delete(
  "/inventory/:id",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid inventory ID format" });
      }

      // Check if item exists
      const { data: item, error: fetchError } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      if (permanent === "true" || permanent === true) {
        // Hard delete
        const { error: deleteError } = await supabase
          .from("inventory")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        res.status(200).json({
          message: "Inventory item permanently deleted",
          data: { id, deleted: true },
        });
      } else {
        // Soft delete (archive)
        const { data: archivedItem, error: updateError } = await supabase
          .from("inventory")
          .update({ status: "archived" })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        res.status(200).json({
          message: "Inventory item archived successfully",
          data: archivedItem,
        });
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// GET /api/inventory/:id/matches - Get matches for inventory item
router.get(
  "/inventory/:id/matches",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid inventory ID format" });
      }

      // Verify inventory item exists
      const { data: item, error: itemError } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", id)
        .single();

      if (itemError || !item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      // Fetch matches with inquiry details
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(
          `
        *,
        inquiry:inquiries(*)
      `,
        )
        .eq("inventory_id", id)
        .order("score", { ascending: false });

      if (matchesError) throw matchesError;

      res.status(200).json({
        message: "Matches retrieved successfully",
        data: item,
        matches: matches || [],
      });
    } catch (error) {
      console.error("Error fetching inventory matches:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// GET /api/matches - List all matches (for assistant review)
router.get("/matches", verifyToken, requireAssistant, async (req, res) => {
  try {
    const { status = "pending", limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from("matches")
      .select(
        `
        *,
        inquiry:inquiries(*),
        inventory:inventory(*)
      `,
        { count: "exact" },
      )
      .eq("status", status)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.status(200).json({
      message: "Matches retrieved successfully",
      data: data || [],
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches/inquiry/:inquiryId - Get matches for specific inquiry
router.get("/matches/inquiry/:inquiryId", async (req, res) => {
  try {
    const { inquiryId } = req.params;

    // Validate UUID format
    if (
      !inquiryId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      return res.status(400).json({ error: "Invalid inquiry ID format" });
    }

    // Fetch inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Fetch matches with inventory details
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        *,
        inventory:inventory(*)
      `,
      )
      .eq("inquiry_id", inquiryId)
      .order("score", { ascending: false });

    if (matchesError) throw matchesError;

    res.status(200).json({
      message: "Matches retrieved successfully",
      inquiry,
      matches: matches || [],
    });
  } catch (error) {
    console.error("Error fetching matches for inquiry:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/match/:id - Update match status (approve/reject)
router.patch("/match/:id", verifyToken, requireAssistant, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Validate status
    if (!status || !["confirmed", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'confirmed' or 'rejected'",
      });
    }

    // Validate UUID format
    if (
      !id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      return res.status(400).json({ error: "Invalid match ID format" });
    }

    // Fetch current match to get inquiry_id
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Update match status
    const updateData = { status };
    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If confirmed, update inquiry status to 'matched' and send email
    if (status === "confirmed") {
      // Update inquiry status
      const { data: inquiry } = await supabase
        .from("inquiries")
        .update({ status: "matched" })
        .eq("id", match.inquiry_id)
        .select(`*, profiles:user_id(email)`)
        .single();

      // Send email notification if user has email
      if (inquiry?.profiles?.email) {
        try {
          // Fetch inventory item details for the email
          const { data: inventoryItem } = await supabase
            .from("inventory")
            .select("description, location_found")
            .eq("id", match.inventory_id)
            .single();

          await sendUserFoundNotification(inquiry.profiles.email, {
            item_description: inquiry.description,
            matched_item: inventoryItem?.description || "Found item",
            location:
              inventoryItem?.location_found || "Contact admin for details",
            inquiry_id: inquiry.id,
          });
          console.log(`Email notification sent to ${inquiry.profiles.email}`);
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the request if email fails
        }
      }
    }

    res.status(200).json({
      message: `Match ${status} successfully`,
      data: updatedMatch,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiries - List all inquiries with match counts
router.get("/inquiries", verifyToken, requireAssistant, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = supabase
      .from("inquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }

    // Add text search on description
    if (search) {
      query = query.ilike("description", `%${search}%`);
    }

    const { data: inquiries, error, count } = await query;

    if (error) throw error;

    // Enrich with match counts
    const enrichedInquiries = await Promise.all(
      (inquiries || []).map(async (inquiry) => {
        const { count: pendingCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("inquiry_id", inquiry.id)
          .eq("status", "pending");

        const { count: confirmedCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("inquiry_id", inquiry.id)
          .eq("status", "confirmed");

        return {
          ...inquiry,
          match_counts: {
            pending: pendingCount || 0,
            confirmed: confirmedCount || 0,
          },
        };
      }),
    );

    res.status(200).json({
      message: "Inquiries retrieved successfully",
      data: enrichedInquiries,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inquiry/:id - Get single inquiry details
router.get("/inquiry/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (
      !id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      return res.status(400).json({ error: "Invalid inquiry ID format" });
    }

    // Fetch inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Fetch associated matches with inventory details
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        *,
        inventory:inventory(*)
      `,
      )
      .eq("inquiry_id", id)
      .order("score", { ascending: false });

    if (matchesError) throw matchesError;

    res.status(200).json({
      message: "Inquiry retrieved successfully",
      data: inquiry,
      matches: matches || [],
    });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/inquiry/:id - Update inquiry status
router.patch("/inquiry/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Validate UUID format
    if (
      !id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    ) {
      return res.status(400).json({ error: "Invalid inquiry ID format" });
    }

    // Validate status if provided
    const validStatuses = ["submitted", "under_review", "matched", "resolved"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Update
    const { data, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "Inquiry updated successfully",
      data,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inquiry/:id/rematch - Manually trigger matching for an inquiry
router.post(
  "/inquiry/:id/rematch",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid inquiry ID format" });
      }

      // Fetch inquiry to get description/keywords
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("id", id)
        .single();

      if (inquiryError || !inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Determine search string
      const keywords =
        inquiry.gemini_data?.keywords ||
        inquiry.gemini_data?.short_description ||
        inquiry.description;

      // Trigger matching
      console.log(`[Rematch] Manually triggering match for inquiry ${id}`);
      await findMatchesForInquiry(inquiry.id, keywords);

      // Fetch new matches
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(
          `
        *,
        inventory:inventory(*)
      `,
        )
        .eq("inquiry_id", id)
        .order("score", { ascending: false });

      if (matchesError) throw matchesError;

      res.status(200).json({
        message: "Rematch completed successfully",
        inquiry,
        matches: matches || [],
      });
    } catch (error) {
      console.error("Error triggering rematch:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// POST /api/inquiry/:id/rematch - Trigger re-matching
router.post(
  "/inquiry/:id/rematch",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid inquiry ID format" });
      }

      // Fetch inquiry with gemini_data for keywords
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("id", id)
        .single();

      if (inquiryError || !inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Extract keywords from gemini_data or description
      const keywords =
        inquiry.gemini_data?.keywords ||
        inquiry.gemini_data?.short_description ||
        inquiry.description;

      // Trigger matching
      await findMatchesForInquiry(id, keywords);

      // Fetch new matches
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("inquiry_id", id)
        .order("score", { ascending: false });

      res.status(200).json({
        message: "Re-matching completed",
        matches_found: matches?.length || 0,
        matches: matches || [],
      });
    } catch (error) {
      console.error("Error re-matching inquiry:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// GET /api/inquiry/:id/questions - Generate refinement questions for matches
router.get("/inquiry/:id/questions", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("description")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Fetch top pending matches (limit 5-10)
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        id,
        inventory:inventory(id, description)
      `,
      )
      .eq("inquiry_id", id)
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(8);

    if (matchesError) throw matchesError;

    if (matches.length < 2) {
      return res
        .status(400)
        .json({ error: "Not enough matches to need refinement" });
    }

    const candidateItems = matches.map((m) => m.inventory);

    // Generate questions
    const { questions } = await generateRefinementQuestions(
      inquiry.description,
      candidateItems,
    );

    res.status(200).json({
      message: "Questions generated",
      questions,
    });
  } catch (error) {
    console.error("Error generating refinement questions:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inquiry/:id/refine - Submit answers and re-rank matches
router.post("/inquiry/:id/refine", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // [{ question, answer }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers array is required" });
    }

    // Fetch inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("description")
      .eq("id", id)
      .single();

    if (inquiryError || !inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Fetch top pending matches again to ensure we have the same set
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        id,
        inventory:inventory(id, description)
      `,
      )
      .eq("inquiry_id", id)
      .eq("status", "pending")
      .order("score", { ascending: false })
      .limit(8);

    if (matchesError) throw matchesError;

    const candidateItems = matches.map((m) => ({
      match_id: m.id,
      ...m.inventory,
    }));

    // Get re-evaluation from AI
    const analysis = await refineMatchesWithAnswers(
      inquiry.description,
      answers,
      candidateItems,
    );

    // Update scores in database
    const updates = [];
    if (analysis.rethinks) {
      for (const update of analysis.rethinks) {
        // Map back inventory id to match id
        // The prompt asked for "candidate_id" which we passed as inventory ID usually,
        // but let's be careful. `candidateItems` has `id` (inventory id).
        // The `rethinks` should return the ID we passed in.

        const match = candidateItems.find((c) => c.id === update.id);
        if (match) {
          const { error } = await supabase
            .from("matches")
            .update({
              score: update.new_score / 100, // API returns 0-100, DB usually 0.0-1.0
              admin_notes: `AI Refinement: ${update.reasoning}`,
            })
            .eq("id", match.match_id); // Use the match_id, not inventory_id

          if (error) console.error("Failed to update match score", error);
          else updates.push({ id: match.match_id, ...update });
        }
      }
    }

    res.status(200).json({
      message: "Matches refined",
      updates,
    });
  } catch (error) {
    console.error("Error refining matches:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats - Dashboard statistics
router.get("/stats", verifyToken, requireAssistant, async (req, res) => {
  try {
    // Get inquiry counts by status
    const { count: submittedInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted");

    const { count: underReviewInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "under_review");

    const { count: matchedInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "matched");

    const { count: resolvedInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    // Get inventory counts by status
    const { count: activeInventory } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: claimedInventory } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("status", "claimed");

    // Get pending matches count
    const { count: pendingMatches } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get today's inquiries
    const today = new Date().toISOString().split("T")[0];
    const { count: todayInquiries } = await supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    res.status(200).json({
      message: "Statistics retrieved successfully",
      data: {
        inquiries: {
          submitted: submittedInquiries || 0,
          under_review: underReviewInquiries || 0,
          matched: matchedInquiries || 0,
          resolved: resolvedInquiries || 0,
          today: todayInquiries || 0,
        },
        inventory: {
          active: activeInventory || 0,
          claimed: claimedInventory || 0,
        },
        matches: {
          pending_review: pendingMatches || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/matches/:id/questions - Generate follow-up questions
router.get(
  "/matches/:id/questions",
  verifyToken,
  requireAssistant,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID
      if (
        !id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return res.status(400).json({ error: "Invalid match ID format" });
      }

      // Fetch match with related inquiry and inventory descriptions
      const { data: match, error: fetchError } = await supabase
        .from("matches")
        .select(
          `
        *,
        inquiry:inquiries(description),
        inventory:inventory(description)
      `,
        )
        .eq("id", id)
        .single();

      if (fetchError || !match) {
        return res.status(404).json({ error: "Match not found" });
      }

      const { questions } = await generateMatchQuestions(
        match.inquiry.description,
        match.inventory.description,
      );

      res.status(200).json({
        message: "Questions generated successfully",
        questions,
      });
    } catch (error) {
      console.error("Error generating match questions:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// USER PROFILE ENDPOINTS (/my/*)
// ============================================

// GET /my/inquiries - Get user's own inquiries
router.get("/my/inquiries", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /my/matches - Get confirmed matches for user's inquiries
router.get("/my/matches", verifyToken, async (req, res) => {
  try {
    // First get user's inquiry IDs
    const { data: inquiries, error: inqError } = await supabase
      .from("inquiries")
      .select("id")
      .eq("user_id", req.user.id);

    if (inqError) throw inqError;

    const inquiryIds = inquiries.map((i) => i.id);

    if (inquiryIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Get confirmed matches for those inquiries
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select(
        `
        *,
        inquiry:inquiries(id, description, image_url, created_at),
        inventory:inventory(id, description, image_url, location_found)
      `,
      )
      .in("inquiry_id", inquiryIds)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    if (matchError) throw matchError;

    res.status(200).json({ data: matches });
  } catch (error) {
    console.error("Error fetching user matches:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /my/matches/:id/claim - User claims the matched item
router.patch("/my/matches/:id/claim", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify match belongs to user's inquiry
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select(`*, inquiry:inquiries(user_id)`)
      .eq("id", id)
      .single();

    if (fetchError || !match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.inquiry.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to claim this match" });
    }

    // Update inquiry status to resolved
    const { error: inqError } = await supabase
      .from("inquiries")
      .update({ status: "resolved" })
      .eq("id", match.inquiry_id);

    if (inqError) throw inqError;

    // Update inventory item as claimed
    const { error: invError } = await supabase
      .from("inventory")
      .update({ status: "claimed" })
      .eq("id", match.inventory_id);

    if (invError) throw invError;

    res.status(200).json({
      message:
        "Item claimed successfully! Visit the lost & found office to pick it up.",
      data: {
        match_id: id,
        inquiry_id: match.inquiry_id,
        inventory_id: match.inventory_id,
      },
    });
  } catch (error) {
    console.error("Error claiming match:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
