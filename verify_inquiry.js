const fs = require("fs");
const path = require("path");

const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

async function testInquiry() {
  const imageArg = process.argv[2];
  const imagePath = path.resolve(imageArg || "./test_keys.png");

  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found at ${imagePath}`);
    return;
  }

  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = mimeTypes[ext];

  if (!mimeType) {
    console.error(`Unsupported file type: ${ext}`);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: mimeType });
  const fileName = path.basename(imagePath);

  const formData = new FormData();
  formData.append("image", blob, fileName);

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
