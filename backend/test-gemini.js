import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    const key = process.argv[2];
    console.log("Testing with key:", key);
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success:", result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
