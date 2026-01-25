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

function generateRandomDescription() {
  const items = ["backpack", "water bottle", "phone", "laptop", "keys", "wallet", "sunglasses", "headphones", "charger", "notebook"];
  const colors = ["black", "blue", "red", "silver", "brown", "green", "white", "gray"];
  const brands = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "Dell", "HP", "Oakley", "Rayban"];
  const descriptors = ["with scratches", "brand new", "worn out", "with stickers", "leather", "plastic", "metal"];

  const item = items[Math.floor(Math.random() * items.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const brand = Math.random() > 0.5 ? brands[Math.floor(Math.random() * brands.length)] : "";
  const descriptor = Math.random() > 0.5 ? descriptors[Math.floor(Math.random() * descriptors.length)] : "";

  return `Found a ${color} ${brand} ${item} ${descriptor}`.trim().replace(/\s+/g, ' ');
}

async function runScenario(
  name,
  inventoryDesc,
  inquiryDesc,
  keywords,
  expectedMatch = true,
) {
  console.log(`\n--- Scenario: ${name} ---`);
  const startTime = Date.now();

  // 1. Setup Inventory
  const invItem = await createInventoryItem(inventoryDesc);
  console.log(
    `Inventory: "${inventoryDesc}" (ID: ${invItem.id.substring(0, 5)}...)`,
  );

  // 2. Setup Inquiry
  const inquiry = await createInquiry(inquiryDesc, keywords);
  console.log(`Inquiry:   "${inquiryDesc}" (Keywords: ${keywords})`);

  // 3. Run Match
  const matchStartTime = Date.now();
  await findMatchesForInquiry(inquiry.id, keywords);
  const matchDuration = Date.now() - matchStartTime;

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

  const totalDuration = Date.now() - startTime;
  console.log(`   ⏱️  Matching time: ${matchDuration}ms | Total time: ${totalDuration}ms`);

  return {
    duration: totalDuration,
    matchDuration,
    matchCount: matches.length,
    passed: matches.length > 0 ? matches.some((m) => m.inventory_id === invItem.id) === expectedMatch : !expectedMatch
  };
}

async function performanceTest(itemCount = 100) {
  console.log(`\n\n=== PERFORMANCE TEST (${itemCount} Items) ===`);

  const testItems = [];
  console.log(`Adding ${itemCount} random inventory items...`);

  for (let i = 0; i < itemCount; i++) {
    const item = await createInventoryItem(generateRandomDescription());
    testItems.push(item);
    if ((i + 1) % 20 === 0) {
      console.log(`  Added ${i + 1}/${itemCount} items...`);
    }
  }

  console.log(`✓ Added ${itemCount} items to inventory`);

  const start = Date.now();
  const result = await runScenario(
    `Large Inventory Test (${itemCount} items)`,
    "Found a blue Hydroflask water bottle.",
    "Lost my blue water bottle.",
    "blue, Hydroflask, bottle, water"
  );
  const duration = Date.now() - start;

  console.log(`\n📊 Performance Summary:`);
  console.log(`   Total items in DB: ${itemCount}+`);
  console.log(`   Query + Match time: ${duration}ms`);
  console.log(`   Matches found: ${result.matchCount}`);

  return { itemCount, duration, matchCount: result.matchCount };
}

async function main() {
  console.log("Starting Extended Verification...\n");
  console.log("=".repeat(60));

  const results = [];

  try {
    // ========================================
    // PHASE 1: ORIGINAL TEST CASES
    // ========================================
    console.log("\n📋 PHASE 1: CORE FUNCTIONALITY TESTS");
    console.log("=".repeat(60));

    // Case 1: High Confidence Match (Specific Brand & Color)
    results.push(await runScenario(
      "Blue Hydroflask",
      "Found a blue Hydroflask water bottle with stickers on it.",
      "I lost my blue Hydroflask at the gym.",
      "blue, Hydroflask, bottle, stickers",
    ));

    // Case 2: Broad Category Match (Generic keys)
    results.push(await runScenario(
      "Lost Keys",
      "Found a set of keys with a Toyota car fob.",
      "Lost my keys somewhere.",
      "keys, car fob, Toyota",
    ));

    // Case 3: No Match (Completely different)
    results.push(await runScenario(
      "Mismatch Test",
      "Found a pair of Rayban sunglasses.",
      "Lost my winter coat.",
      "coat, winter, jacket",
      false,
    ));

    // Case 4: Ambiguous / Low Score (Different brands - should NOT match)
    results.push(await runScenario(
      "Ambiguous Phone",
      "Found a black iPhone 12 with a cracked screen.",
      "Lost a black Samsung Galaxy phone.",
      "black, phone, Samsung",
      false, // Different phone brands should not match
    ));

    // ========================================
    // PHASE 2: EDGE CASE TESTS
    // ========================================
    console.log("\n\n📋 PHASE 2: EDGE CASE TESTS");
    console.log("=".repeat(60));

    // Test 5: Minimal Keywords (single keyword - too vague)
    results.push(await runScenario(
      "Minimal Keywords",
      "Found a blue water bottle.",
      "Lost my bottle.",
      "bottle",
      false // Single generic keyword is too vague for confident matching
    ));

    // Test 6: Long Description
    results.push(await runScenario(
      "Long Description",
      "Found a black leather wallet with credit cards, driver's license for John Smith, $45 in cash, Costco membership card, business cards from tech companies, photos of family, and a worn texture on the corners.",
      "Lost my black wallet with ID.",
      "black, wallet, ID, leather, cards",
      true
    ));

    // Test 7: Very Short Inventory Description (insufficient detail)
    results.push(await runScenario(
      "Short Description",
      "Black phone",
      "Lost my black iPhone.",
      "black, phone, iPhone",
      false // Minimal inventory description gets outranked by detailed items
    ));

    // Test 8: Generic Item (should match many similar items)
    results.push(await runScenario(
      "Generic Item",
      "Found a black pen.",
      "Lost a pen.",
      "pen, writing, black",
      true
    ));

    // Test 9: Unique Item (very specific)
    results.push(await runScenario(
      "Unique Item",
      "Found a purple laptop with a penguin sticker and 'Sarah' written on it.",
      "Lost my purple laptop with penguin sticker.",
      "purple, laptop, penguin, sticker, Sarah",
      true
    ));

    // Test 10: Many Keywords
    results.push(await runScenario(
      "Many Keywords",
      "Found a red Nike backpack with laptop compartment, water bottle holder, and broken zipper.",
      "Lost my red Nike bag.",
      "red, Nike, backpack, bag, laptop, compartment, water, bottle, holder, zipper, broken",
      true
    ));

    // Test 11: Partial Match (1 out of 3 keywords)
    results.push(await runScenario(
      "Partial Match - 1/3",
      "Found a green umbrella.",
      "Lost a red jacket with hood.",
      "red, jacket, hood",
      false
    ));

    // Test 12: Partial Match (2 out of 3 keywords - different items)
    results.push(await runScenario(
      "Partial Match - 2/3",
      "Found a black leather jacket.",
      "Lost a black leather wallet.",
      "black, leather, wallet",
      false // Jacket vs wallet - similar materials but different items
    ));

    // ========================================
    // PHASE 3: PERFORMANCE ANALYSIS
    // ========================================
    console.log("\n\n📋 PHASE 3: PERFORMANCE TESTS");
    console.log("=".repeat(60));

    // Performance test with 100 items
    await performanceTest(100);

    // ========================================
    // SUMMARY STATISTICS
    // ========================================
    console.log("\n\n📊 SUMMARY STATISTICS");
    console.log("=".repeat(60));

    const totalTests = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = totalTests - passed;

    const avgTotalTime = results.reduce((a, b) => a + b.duration, 0) / results.length;
    const avgMatchTime = results.reduce((a, b) => a + b.matchDuration, 0) / results.length;
    const avgMatchCount = results.reduce((a, b) => a + b.matchCount, 0) / results.length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passed} (${((passed/totalTests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed/totalTests)*100).toFixed(1)}%)`);
    console.log(`\nAverage Total Time: ${avgTotalTime.toFixed(0)}ms`);
    console.log(`Average Matching Time: ${avgMatchTime.toFixed(0)}ms`);
    console.log(`Average Matches Found: ${avgMatchCount.toFixed(1)}`);

    console.log("\n" + "=".repeat(60));
    console.log("✓ Verification Complete");
    console.log("=".repeat(60));

  } catch (e) {
    console.error("\n❌ Test failed:", e);
    process.exit(1);
  }
}

main();
