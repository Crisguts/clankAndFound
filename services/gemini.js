const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Description from Image
async function analyzeImage(imageBuffer, mimeType, userContext = null) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Build prompt with optional user context
  let prompt = `Analyze this image of a lost/found item.\n`;

  if (userContext) {
    prompt += `The user describes this item as: "${userContext}"\nUse this context to focus your analysis on relevant details.\n\n`;
  }

  prompt += `Provide a detailed JSON description with the following fields:
    - short_description (string): A concise title (e.g. "Black Northface Backpack")
    - detailed_description (string): A full description including wear, tear, and unique markers.
    - color (string): Dominant color.
    - category (string): Electronics, Clothing, Accessories, etc.
    - brand (string): If visible.
    - keywords (string): A comma-separated list of keywords for search (e.g. "backpack, black, northface, bag, zipper").

    Output strictly raw JSON.`;

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
    Compare these two item descriptions to see if they are the SAME physical item.
    
    Item A (Lost): "${inquiryText}"
    Item B (Found): "${inventoryText}"
    
    CRITICAL RULES:
    1. If the BRANDS are different (e.g. Nike vs Uniqlo, Apple vs Samsung), "is_match" MUST be false and "confidence" MUST be < 0.2.
    2. If the COLORS are clearly different, "is_match" MUST be false.
    3. If Item B has a distinct feature (e.g. sticker, tear) that Item A does not mention, do not rule it out (Item A owner might not have noticed).
    4. If Item A has a distinct feature that Item B DEFINITELY does not have, rule it out.
    
    Return a JSON object:
    {
      "is_match": boolean,
      "confidence": float (0.0 to 1.0),
      "reasoning": string (concise explanation, mentioning any brand mismatch)
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

module.exports = {
  analyzeImage,
  verifyMatch,
  generateMatchQuestions,
  generateRefinementQuestions,
  refineMatchesWithAnswers,
};

// 4. Generate Refinement Questions for Multiple Matches
async function generateRefinementQuestions(inquiryText, candidates) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const candidateDescriptions = candidates
    .map((c, i) => `Candidate ${i + 1}: ${c.description || "No description"}`)
    .join("\n");

  const prompt = `
    I am helping a user find their lost item. 
    Lost Item Description: "${inquiryText}"
    
    Here are potentially matching found items:
    ${candidateDescriptions}
    
    The user is unsure which, if any, of these are theirs.
    Generate 3 specific, discriminatory questions to ask the user that would help distinguish their item from these candidates.
    Focus on details like unique markings, specific contents, brand logos, or material quirks that might not be in the initial description but could be verified.
    
    Return a JSON object:
    {
      "questions": [
        "Question 1?",
        "Question 2?",
        "Question 3?"
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

// 5. Refine Matches with User Answers
async function refineMatchesWithAnswers(inquiryText, answers, candidates) {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const candidateDescriptions = candidates
    .map((c, i) => `id: "${c.id}", description: "${c.description}"`)
    .join("\n");

  const qaPairs = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n");

  const prompt = `
    Re-evaluate the likelihood of the lost item matching the found candidates based on new user answers.
    
    Lost Item Initial Description: "${inquiryText}"
    
    User Q&A Verification:
    ${qaPairs}
    
    Candidates:
    ${candidateDescriptions}
    
    For each candidate, provide a new match score (0-100) and reasoning.
    If the answers definitely rule out a candidate (e.g. wrong color, wrong brand), give it a low score (<20).
    If the answers confirm unique details, give it a high score (>80).
    
    Return a JSON object:
    {
      "rethinks": [
        {
          "id": "candidate_id",
          "new_score": number,
          "reasoning": "string"
        }
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
