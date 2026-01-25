const supabase = require("./supabase");

/**
 * Finds potential matches for a new inquiry by searching the inventory
 * using full-text search on the keywords provided.
 *
 * @param {string} inquiryId - The UUID of the newly created inquiry
 * @param {string} searchString - Comma-separated keywords or description from Gemini
 */
async function findMatchesForInquiry(inquiryId, searchString) {
  console.log(`[Matching] Starting match process for Inquiry ID: ${inquiryId}`);

  if (!searchString || !searchString.trim()) {
    console.log("[Matching] No search string provided. Skipping.");
    return;
  }

  // 1. Prepare the query
  // Gemini returns "keyword1, keyword2, keyword3".
  // for 'websearch', we can transform this to "keyword1 OR keyword2 OR keyword3"
  // to maximize recall (finding anything matching at least one property).
  const formattedQuery = searchString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k)
    .join(" OR ");

  console.log(`[Matching] Searching inventory with query: "${formattedQuery}"`);

  // 2. Search Inventory (Active items only) using RPC for Scoring
  const { data: potentialMatches, error: searchError } = await supabase.rpc(
    "match_inventory",
    {
      query_text: formattedQuery,
      match_threshold: 0.01, // Low threshold for demo
      match_count: 5, // Top 5
    },
  );

  if (searchError) {
    console.error("[Matching] Supabase Search Error:", searchError);
    return;
  }

  console.log(`[Matching] Found ${potentialMatches.length} potential matches.`);

  if (potentialMatches.length === 0) {
    return;
  }

  // 3. Insert into 'matches' table
  const matchRecords = potentialMatches.map((item) => ({
    inquiry_id: inquiryId,
    inventory_id: item.id,
    status: "pending",
    score: item.rank, // Using the score from RPC
    admin_notes: `Auto-matched via keywords: ${formattedQuery.substring(0, 50)}...`,
  }));

  const { error: insertError } = await supabase
    .from("matches")
    .insert(matchRecords);

  if (insertError) {
    console.error("[Matching] Error inserting matches:", insertError);
  } else {
    console.log(
      `[Matching] Successfully created ${matchRecords.length} match entries.`,
    );
  }
}

module.exports = { findMatchesForInquiry };
