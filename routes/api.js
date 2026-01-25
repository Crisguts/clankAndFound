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
const { analyzeImage, generateMatchQuestions } = require("../services/gemini");
const supabase = require("../services/supabase");
const { findMatchesForInquiry } = require("../services/matching");

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

const rateLimit = require("../middleware/rateLimit");

// POST /inquiry - User submits a lost item
router.post("/inquiry", rateLimit, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    console.log("Analyzing image...");
    // 1. Analyze with Gemini
    const analysis = await analyzeImage(req.file.buffer, req.file.mimetype);
    console.log("Gemini Analysis:", analysis);

    // 2. Upload Image to Supabase Storage
    const funcFileExt = req.file.mimetype.split("/")[1];
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${funcFileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images") // User's lost item images
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return res
        .status(500)
        .json({ error: "Failed to upload image", details: uploadError });
    }

    // Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fileName);

    // 3. Save flattened data to DB
    // Using "extracted_data" column for JSON, or mapping fields if table has them.
    // Based on PRD/Tasks, we probably save the whole analysis or specific fields.
    // Assuming table 'inquiries' has fields for json data.

    const { data: insertData, error: insertError } = await supabase
      .from("inquiries")
      .insert([
        {
          image_url: publicUrl,
          description: analysis.detailed_description, // or short_description
          gemini_data: analysis, // Storing full JSON
          status: "submitted",
        },
      ])
      .select();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return res.status(500).json({ error: "Failed to save inquiry" });
    }

    res
      .status(200)
      .json({ message: "Inquiry received", data: insertData[0], analysis });

    // Trigger matching process asynchronously
    if (insertData && insertData[0]) {
      const keywords =
        analysis.keywords ||
        analysis.short_description ||
        analysis.detailed_description;
      // We don't await this to keep response fast, or we do await to ensure it works?
      // For this task, let's await to see logs in console easily, or just fire and forget.
      // User said "go slowly", so let's await it to be sure.
      await findMatchesForInquiry(insertData[0].id, keywords);
    }
  } catch (error) {
    console.error("Error processing inquiry:", error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
      stack: error.stack,
    });
  }
});

// POST /inventory - Admin adds found item
router.post("/inventory", upload.single("image"), async (req, res) => {
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
      return res
        .status(500)
        .json({ error: "Failed to save inventory item", details: insertError });
    }

    res
      .status(200)
      .json({ message: "Item added to inventory", data: insertData[0] });
  } catch (error) {
    console.error("Error adding to inventory:", error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
      stack: error.stack,
    });
  }
});

// GET /api/inventory - Browse and search inventory
router.get("/inventory", async (req, res) => {
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
router.patch("/inventory/:id", async (req, res) => {
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
});

// DELETE /api/inventory/:id - Delete or archive item
router.delete("/inventory/:id", async (req, res) => {
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
});

// GET /api/inventory/:id/matches - Get matches for inventory item
router.get("/inventory/:id/matches", async (req, res) => {
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
});

// GET /api/matches - List all matches (for assistant review)
router.get("/matches", async (req, res) => {
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
router.patch("/match/:id", async (req, res) => {
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

    // If confirmed, update inquiry status to 'matched'
    if (status === "confirmed") {
      await supabase
        .from("inquiries")
        .update({ status: "matched" })
        .eq("id", match.inquiry_id);
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
router.get("/inquiries", async (req, res) => {
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Verify inquiry exists
    const { data: inquiry, error: fetchError } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Update inquiry
    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      message: "Inquiry updated successfully",
      data: updatedInquiry,
    });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inquiry/:id/rematch - Trigger re-matching
router.post("/inquiry/:id/rematch", async (req, res) => {
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
});

// GET /api/stats - Dashboard statistics
router.get("/stats", async (req, res) => {
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
router.get("/matches/:id/questions", async (req, res) => {
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
});

module.exports = router;
