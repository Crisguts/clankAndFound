const { analyzeImage, verifyMatch } = require("./gemini");
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

  // 3. Verify matches with Gemini (AI Layer)
  const matchRecords = [];

  for (const item of potentialMatches) {
    try {
      console.log(`[Matching] Verifying candidate: ${item.id} with Gemini...`);
      // We compare the Search String (Inquiry) vs Item Description (Inventory)
      // In a real app, we might fetch the full inquiry text first if searchString is just keywords.
      // Assuming searchString is descriptive enough for now.
      const verification = await verifyMatch(searchString, item.description);

      console.log(
        `   -> Gemini Result: IsMatch=${verification.is_match}, Conf=${verification.confidence}`,
      );

      // If confidence is high, boost score. If low, penalize or drop?
      // Let's use Gemini confidence as the primary score if it's a match.
      // If Gemini says NOT a match, we can still keep it but with low score, or filter it out.
      // For this demo, let's keep everything but update score/notes.

      let finalScore = item.rank;
      if (verification.is_match) {
        finalScore = Math.max(item.rank, verification.confidence); // Boost
      } else {
        finalScore = item.rank * 0.1; // Penalize heavy
      }

      matchRecords.push({
        inquiry_id: inquiryId,
        inventory_id: item.id,
        status: "pending",
        score: finalScore,
        admin_notes: `AI Verification: ${verification.reasoning} (Confidence: ${verification.confidence})`,
      });
    } catch (err) {
      console.error(
        `[Matching] Gemini Verification Failed for ${item.id}:`,
        err,
      );
      // Fallback to DB rank
      matchRecords.push({
        inquiry_id: inquiryId,
        inventory_id: item.id,
        status: "pending",
        score: item.rank,
        admin_notes: `Auto-matched via keywords. AI Verification failed.`,
      });
    }
  }

  // 4. Insert into 'matches' table
  // Filter out low scores
  const MIN_SCORE_THRESHOLD = 0.5;
  const validMatches = matchRecords.filter(
    (m) => m.score >= MIN_SCORE_THRESHOLD,
  );

  if (validMatches.length > 0) {
    const { error: insertError } = await supabase
      .from("matches")
      .insert(validMatches);

    if (insertError) {
      console.error("[Matching] Error inserting matches:", insertError);
    } else {
      console.log(
        `[Matching] Successfully created ${validMatches.length} match entries (Filtered from ${matchRecords.length}).`,
      );
    }
  } else {
    console.log(
      `[Matching] No matches above threshold (${MIN_SCORE_THRESHOLD}).`,
    );
  }
}

module.exports = { findMatchesForInquiry };
