require("dotenv").config({ path: ".env" });
const supabase = require("./services/supabase");

async function seedItems() {
  console.log("Seeding database with similar items...");

  // 6 Similar items: Black JanSport SuperBreak backpacks with subtle variations
  const items = [
    {
      description:
        "This is a black JanSport SuperBreak backpack in what appears to be very good condition. The bag features the classic JanSport design with a large main compartment, front utility pocket with organizer, and padded shoulder straps. The iconic JanSport logo is visible on the front pocket in red and white. The zippers appear to be functioning properly with standard black zipper pulls. No visible damage, stains, or wear marks. The fabric is the typical 600 denier polyester material. Dimensions appear to be approximately 16.7 x 13 x 8.5 inches, consistent with the standard SuperBreak model.",
      image_url: "https://example.com/jansport1.jpg",
      gemini_data: {
        short_description: "Black JanSport SuperBreak Backpack",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak, clean, good condition",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "This is a black JanSport SuperBreak backpack with noticeable wear. The bag has the standard JanSport design with front pocket and main compartment. Most notably, there is a light brown coffee or tea stain visible on the lower right portion of the front pocket, roughly 2-3 inches in diameter. The stain has set into the fabric. The JanSport logo is intact on the front. Shoulder straps show some fraying at the edges. The zippers are functional but the main zipper pull has some scratches. Otherwise structurally sound. Standard SuperBreak dimensions.",
      image_url: "https://example.com/jansport2.jpg",
      gemini_data: {
        short_description: "Black JanSport SuperBreak Backpack with Stain",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak, coffee stain, worn",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "This is a black JanSport SuperBreak backpack in good external condition. Upon inspection of the interior, the name 'Alex' is written in silver metallic marker on the manufacturer's tag inside the main compartment. The handwriting appears to be in neat block letters. Externally, the bag shows the typical JanSport construction with front utility pocket, main compartment, and padded adjustable shoulder straps. The red and white JanSport logo is visible on the front. Zippers are in working condition. No external damage or stains visible. Standard SuperBreak size.",
      image_url: "https://example.com/jansport3.jpg",
      gemini_data: {
        short_description: "Black JanSport SuperBreak Backpack",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak, name alex, marker, tag",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "This is a black JanSport SuperBreak backpack with a distinctive red keychain accessory. A bright red carabiner-style keychain is attached to the main compartment zipper pull, making this bag easily identifiable. The keychain appears to be a simple solid red color with no text or logos. The backpack itself is in good condition with the standard JanSport design - large main compartment, front organizer pocket, and padded shoulder straps. The JanSport logo in red and white is visible on the front pocket. No visible damage, stains, or excessive wear. Standard SuperBreak dimensions approximately 16.7 x 13 x 8.5 inches.",
      image_url: "https://example.com/jansport4.jpg",
      gemini_data: {
        short_description: "Black JanSport SuperBreak Backpack with Red Keychain",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak, red keychain, carabiner",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "This is a black JanSport SuperBreak backpack showing significant signs of use and wear. The shoulder straps are noticeably faded, appearing more of a dark charcoal gray rather than the original black color. The strap padding shows compression from extended use. The main body fabric has also faded slightly, giving the bag an overall weathered appearance. Some pilling is visible on the back panel where it contacts clothing. The JanSport logo on the front is slightly faded but still legible. Zippers are functional though stiff. No holes or tears, just general wear consistent with heavy daily use over an extended period.",
      image_url: "https://example.com/jansport5.jpg",
      gemini_data: {
        short_description: "Faded Black JanSport SuperBreak Backpack",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak, faded, worn, gray, weathered",
        color: "Black",
      },
      status: "active",
    },
    {
      description:
        "This is a black JanSport SuperBreak Plus backpack, which is the larger laptop-compatible version of the classic SuperBreak. The bag features a dedicated padded laptop sleeve in the main compartment that can accommodate up to a 15-inch laptop. It is noticeably larger than the standard SuperBreak, with dimensions approximately 17.5 x 13 x 10 inches. The design includes the classic front utility pocket with organizer, plus an additional side water bottle pocket not found on the regular SuperBreak. The JanSport logo is displayed on the front pocket. The bag is in good condition with no visible damage or stains. Zippers function smoothly.",
      image_url: "https://example.com/jansport6.jpg",
      gemini_data: {
        short_description: "Black JanSport SuperBreak Plus Laptop Backpack",
        category: "Bags",
        keywords: "backpack, black, jansport, superbreak plus, laptop sleeve, larger",
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
