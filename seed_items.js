require("dotenv").config({ path: ".env" });
const supabase = require("./services/supabase");

async function seedItems() {
  console.log("Seeding database with similar items...");

  // 5 Similar items: Black Backpacks with slight variations
  const items = [
    {
      description:
        "Black North Face backpack with a small tear on the left strap. Has a water bottle holder on the right side.",
      image_url: "https://example.com/backpack1.jpg",
      gemini_data: {
        short_description: "Black North Face Backpack",
        category: "Bags",
        keywords: "backpack, black, north face, tear, strap",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "Black JanSport backpack, slightly faded. Has a 'Class of 2024' keychain attached to the main zipper.",
      image_url: "https://example.com/backpack2.jpg",
      gemini_data: {
        short_description: "Faded Black JanSport Backpack",
        category: "Bags",
        keywords: "backpack, black, jansport, faded, keychain",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "Small black leather backpack, potentially a purse. Gold zippers and hardware. Brand is Kate Spade.",
      image_url: "https://example.com/backpack3.jpg",
      gemini_data: {
        short_description: "Small Black Leather Backpack",
        category: "Bags",
        keywords: "backpack, black, leather, kate spade, small",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "Black Nike athletic backpack with a shoe compartment at the bottom. White swoosh logo on the front.",
      image_url: "https://example.com/backpack4.jpg",
      gemini_data: {
        short_description: "Black Nike Athletic Backpack",
        category: "Bags",
        keywords: "backpack, black, nike, athletic, shoe compartment",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "Generic black laptop backpack with extra padding. Has a sticker of a cat on the back pocket.",
      image_url: "https://example.com/backpack5.jpg",
      gemini_data: {
        short_description: "Black Laptop Backpack",
        category: "Bags",
        keywords: "backpack, black, laptop, cat sticker, padding",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "Dark grey or black tactical backpack with molle webbing. Very rugged look.",
      image_url: "https://example.com/backpack6.jpg",
      gemini_data: {
        short_description: "Tactical Backpack",
        category: "Bags",
        keywords: "backpack, black, grey, tactical, military",
        color: "Black",
      },
      status: "active",
    },
  ];

  const { data, error } = await supabase
    .from("inventory")
    .insert(items)
    .select();

  if (error) {
    console.error("Error seeding items:", error);
  } else {
    console.log(`Successfully added ${data.length} items to inventory.`);
    console.log(
      "IDs:",
      data.map((i) => i.id),
    );
  }
}

seedItems();
