const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Description from Image
async function analyzeImage(imageBuffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleanedText);
}

// 2. Verify Match between Inquiry and Inventory
async function verifyMatch(inquiryText, inventoryText) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Compare these two item descriptions to see if they are the same item.
    
    Item A (Lost): "${inquiryText}"
    Item B (Found): "${inventoryText}"
    
    Return a JSON object:
    {
      "is_match": boolean,
      "confidence": float (0.0 to 1.0),
      "reasoning": string (concise explanation)
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedText);
}

// 3. Generate Follow-up Questions for Match Refinement
async function generateMatchQuestions(inquiryText, inventoryText) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Compare these two item descriptions.
    
    Item A (Lost): "${inquiryText}"
    Item B (Found): "${inventoryText}"
    
    Generate 1-3 discrimination questions that an assistant could ask the person who lost Item A to confirm if Item B is theirs.
    The questions should focus on details that might be visible in Item B but were not mentioned in Item A.
    
    Return a detailed JSON object:
    {
      "questions": [
        "Question 1?",
        "Question 2?"
      ]
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleanedText);
}

module.exports = { analyzeImage, verifyMatch, generateMatchQuestions };
