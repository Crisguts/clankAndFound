const fs = require("fs");
const path = require("path");

async function testInquiry() {
  const imagePath = path.resolve("./test_keys.png");

  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found at ${imagePath}`);
    return;
  }

  const file = Bun.file(imagePath);
  const formData = new FormData();
  formData.append("image", file);

  console.log("Sending request to http://localhost:8080/api/inquiry...");

  try {
    const response = await fetch("http://localhost:8080/api/inquiry", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testInquiry();
