const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Description from Image
async function analyzeImage(imageBuffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this image of a lost/found item. 
    Provide a detailed JSON description with the following fields:
    - short_description (string): A concise title (e.g. "Black Northface Backpack")
    - detailed_description (string): A full description including wear, tear, and unique markers.
    - color (string): Dominant color.
    - category (string): Electronics, Clothing, Accessories, etc.
    - brand (string): If visible.
    - keywords (string): A comma-separated list of keywords for search (e.g. "backpack, black, northface, bag, zipper").
    
    Output strictly raw JSON.
  `;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  // Clean up code fences if present
  const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanedText);
}

module.exports = { analyzeImage };
