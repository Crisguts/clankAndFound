require("dotenv").config();
const supabase = require("./services/supabase");
const { findMatchesForInquiry } = require("./services/matching");

async function createInventoryItem(description) {
  const { data, error } = await supabase
    .from("inventory")
    .insert([{ description, status: "active" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function createInquiry(description, keywords) {
  const { data, error } = await supabase
    .from("inquiries")
    .insert([{ description, status: "submitted", gemini_data: { keywords } }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function runScenario(
  name,
  inventoryDesc,
  inquiryDesc,
  keywords,
  expectedMatch = true,
) {
  console.log(`\n--- Scenario: ${name} ---`);

  // 1. Setup Inventory
  const invItem = await createInventoryItem(inventoryDesc);
  console.log(
    `Inventory: "${inventoryDesc}" (ID: ${invItem.id.substring(0, 5)}...)`,
  );

  // 2. Setup Inquiry
  const inquiry = await createInquiry(inquiryDesc, keywords);
  console.log(`Inquiry:   "${inquiryDesc}" (Keywords: ${keywords})`);

  // 3. Run Match
  await findMatchesForInquiry(inquiry.id, keywords);

  // 4. Check Results
  const { data: matches } = await supabase
    .from("matches")
    .select("*, inventory(*)")
    .eq("inquiry_id", inquiry.id)
    .order("score", { ascending: false });

  if (matches.length > 0) {
    console.log(`=> Found ${matches.length} matches.`);
    matches.forEach((m) => {
      const isTarget = m.inventory_id === invItem.id;
      const marker = isTarget ? "✅ TARGET" : "  Other";
      console.log(
        `   [${marker}] Score: ${m.score.toFixed(4)} | Item: ${m.inventory.description.substring(0, 40)}...`,
      );
    });

    const foundTarget = matches.some((m) => m.inventory_id === invItem.id);
    if (expectedMatch && foundTarget)
      console.log("   PASSED: Target item found.");
    else if (expectedMatch && !foundTarget)
      console.log("   FAILED: Target item NOT found.");
    else if (!expectedMatch && foundTarget)
      console.log("   FAILED: Unexpected match found.");
    else console.log("   PASSED: No unexpected match.");
  } else {
    console.log("=> No matches found.");
    if (expectedMatch) console.log("   FAILED: Expected a match but got none.");
    else console.log("   PASSED: Correctly found no matches.");
  }
}

async function main() {
  console.log("Starting Extended Verification...");

  // clear old data? No, let's just add to the pile to test "needle in haystack" slightly.

  try {
    // Case 1: High Confidence Match (Specific Brand & Color)
    await runScenario(
      "Blue Hydroflask",
      "Found a blue Hydroflask water bottle with stickers on it.",
      "I lost my blue Hydroflask at the gym.",
      "blue, Hydroflask, bottle, stickers",
    );

    // Case 2: Broad Category Match (Generic keys)
    await runScenario(
      "Lost Keys",
      "Found a set of keys with a Toyota car fob.",
      "Lost my keys somewhere.",
      "keys, car fob, Toyota",
    );

    // Case 3: No Match (Completely different)
    await runScenario(
      "Mismatch Test",
      "Found a pair of Rayban sunglasses.",
      "Lost my winter coat.",
      "coat, winter, jacket",
      false, // Expect NO match between these two specifically (though it might match others if DB is dirty)
    );

    // Case 4: Ambiguous / Low Score
    await runScenario(
      "Ambiguous Phone",
      "Found a black iPhone 12 with a cracked screen.",
      "Lost a black Samsung Galaxy phone.",
      "black, phone, Samsung",
      true, // Might match partially on "black phone", checking score
    );
  } catch (e) {
    console.error("Test failed:", e);
  }
}

main();
