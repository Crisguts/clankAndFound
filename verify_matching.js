require("dotenv").config();
const supabase = require("./services/supabase");
const { findMatchesForInquiry } = require("./services/matching");

async function testMatching() {
  console.log("--- Starting Matching Verification ---");

  // 1. Create a dummy FOUND item (Inventory)
  // "Red Canon Camera"
  const uniqueId = Math.random().toString(36).substr(2, 5);
  const inventoryDesc = `Found a red Canon EOS camera with a black lens cap in the cafeteria. ID: ${uniqueId}`;

  console.log(`1. Creating Inventory Item: "${inventoryDesc}"`);
  const { data: invData, error: invError } = await supabase
    .from("inventory")
    .insert([
      {
        description: inventoryDesc,
        status: "active",
        // image_url: ... (optional)
      },
    ])
    .select()
    .single();

  if (invError) {
    console.error("Failed to create inventory item:", invError);
    return;
  }
  console.log("   -> Inventory Item Created:", invData.id);

  // 2. Create a dummy LOST item (Inquiry)
  // "Lost Canon Camera"
  const inquiryDesc = `I lost my Canon camera. It is red.`;
  const keywords = "Canon, camera, red"; // Simulate Gemini keywords

  console.log(
    `2. Creating Inquiry: "${inquiryDesc}" with keywords: "${keywords}"`,
  );
  const { data: inqData, error: inqError } = await supabase
    .from("inquiries")
    .insert([
      {
        description: inquiryDesc,
        status: "submitted",
        gemini_data: { keywords: keywords },
      },
    ])
    .select()
    .single();

  if (inqError) {
    console.error("Failed to create inquiry:", inqError);
    return;
  }
  console.log("   -> Inquiry Created:", inqData.id);

  // 3. Trigger Matching Manually (calling the service function directly for test)
  console.log("3. Triggering Match Logic...");
  await findMatchesForInquiry(inqData.id, keywords);

  // 4. Verify Match
  console.log("4. Verifying Match Execution...");

  // Give DB a moment? No, await should handle it.

  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("inquiry_id", inqData.id);

  if (matchError) {
    console.error("Error fetching matches:", matchError);
  } else {
    console.log(`   -> Found ${matches.length} matches for this inquiry.`);
    if (matches.length > 0) {
      console.log("   SUCCESS! Matches found:", matches);
      const verified = matches.some((m) => m.inventory_id === invData.id);
      if (verified) {
        console.log("   ✅ Specific inventory item was correctly matched!");
      } else {
        console.log(
          "   ⚠️ Match found but not the one we just created? (Possible if other items exist)",
        );
      }
    } else {
      console.log(
        "   ❌ No matches found. Text search might need tuning or index update delay.",
      );
    }
  }

  // Cleanup (Optional)
  // await supabase.from('inventory').delete().eq('id', invData.id);
  // await supabase.from('inquiries').delete().eq('id', inqData.id);
}

testMatching();
