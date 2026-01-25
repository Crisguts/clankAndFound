const { verifyMatch } = require("./gemini");
const supabase = require("./supabase");

/**
 * Finds potential matches for a new inquiry by searching the inventory.
 * Called when a user reports a LOST item.
 */
async function findMatchesForInquiry(inquiryId, searchString) {
  console.log(`[Matching] Starting match for Inquiry ID: ${inquiryId}`);

  if (!searchString?.trim()) {
    console.log("[Matching] No search string provided. Skipping.");
    return;
  }

  const formattedQuery = searchString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k)
    .join(" OR ");

  console.log(`[Matching] Searching inventory with query: "${formattedQuery}"`);

  // Search Inventory using RPC
  const { data: potentialMatches, error: searchError } = await supabase.rpc(
    "match_inventory",
    { query_text: formattedQuery, match_threshold: 0.01, match_count: 5 }
  );

  if (searchError) {
    console.error("[Matching] Supabase Search Error:", searchError);
    return;
  }

  console.log(`[Matching] Found ${potentialMatches?.length || 0} potential matches.`);

  if (!potentialMatches || potentialMatches.length === 0) return;

  // Verify with Gemini and create match records
  const matchRecords = [];
  for (const item of potentialMatches) {
    try {
      console.log(`[Matching] Verifying inventory ${item.id}...`);
      const verification = await verifyMatch(searchString, item.description);

      const score = verification.is_match
        ? Math.max(item.rank, verification.confidence)
        : item.rank * 0.1;

      matchRecords.push({
        inquiry_id: inquiryId,
        inventory_id: item.id,
        status: "pending",
        score,
        admin_notes: `AI: ${verification.reasoning} (${verification.confidence})`,
      });
    } catch (err) {
      console.error(`[Matching] Gemini failed for ${item.id}:`, err);
      matchRecords.push({
        inquiry_id: inquiryId,
        inventory_id: item.id,
        status: "pending",
        score: item.rank,
        admin_notes: "Auto-matched. AI verification failed.",
      });
    }
  }

  // Insert valid matches
  const validMatches = matchRecords.filter((m) => m.score >= 0.5);
  if (validMatches.length > 0) {
    const { error } = await supabase.from("matches").insert(validMatches);
    if (error) console.error("[Matching] Insert error:", error);
    else console.log(`[Matching] Created ${validMatches.length} matches.`);
  } else {
    console.log("[Matching] No matches above threshold.");
  }
}

/**
 * Finds potential matches for a new inventory item by searching existing inquiries.
 * Called when assistant adds a FOUND item.
 */
async function findMatchesForInventoryItem(inventoryId, searchString) {
  console.log(`[Matching] Starting reverse match for Inventory ID: ${inventoryId}`);

  if (!searchString?.trim()) {
    console.log("[Matching] No search string provided. Skipping.");
    return;
  }

  // Get all open inquiries
  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select("*")
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[Matching] Error fetching inquiries:", error);
    return;
  }

  console.log(`[Matching] Checking ${inquiries?.length || 0} open inquiries.`);
  if (!inquiries || inquiries.length === 0) return;

  // Verify each inquiry with Gemini
  const matchRecords = [];
  for (const inquiry of inquiries) {
    try {
      console.log(`[Matching] Verifying inquiry ${inquiry.id}...`);
      const verification = await verifyMatch(searchString, inquiry.description);

      if (verification.is_match && verification.confidence >= 0.5) {
        matchRecords.push({
          inquiry_id: inquiry.id,
          inventory_id: inventoryId,
          status: "pending",
          score: verification.confidence,
          admin_notes: `AI Match: ${verification.reasoning}`,
        });
      }
    } catch (err) {
      console.error(`[Matching] Gemini failed for inquiry ${inquiry.id}:`, err);
    }
  }

  if (matchRecords.length > 0) {
    const { error } = await supabase.from("matches").insert(matchRecords);
    if (error) console.error("[Matching] Insert error:", error);
    else console.log(`[Matching] Created ${matchRecords.length} matches from inventory.`);
  } else {
    console.log("[Matching] No matching inquiries found.");
  }
}

module.exports = { findMatchesForInquiry, findMatchesForInventoryItem };
