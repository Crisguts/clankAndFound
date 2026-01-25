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
const { analyzeImage } = require("../services/gemini");
const supabase = require("../services/supabase");
const { findMatchesForInquiry } = require("../services/matching");

// Configure Multer (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// POST /inquiry - User submits a lost item
router.post("/inquiry", upload.single("image"), async (req, res) => {
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

module.exports = router;
