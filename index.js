// api genai
import { GoogleGenAI, Modality } from "@google/genai";
import express from "express";
import * as fs from "node:fs";
import * as path from "node:path";

const app = express();
const PORT = 5000;

// Serve static files from the current directory
app.use('/images', express.static(process.cwd()));

const ai = new GoogleGenAI({ apiKey: "You Apikey" });

app.get("/api/gemini", async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    console.log(`Processing query: ${query}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
    });

    return res.json({
      success: true,
      text: response.text
    });

  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).json({ error: "Failed to process query" });
  }
});

app.get("/api/image", async (req, res) => {
  try {
    const prompt = req.query.prompt;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt parameter is required" });
    }

    console.log(`Generating image for prompt: ${prompt}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log("Generated text:", part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const filename = `generated-${Date.now()}.png`;
        const filepath = path.join(process.cwd(), filename);
        
        fs.writeFileSync(filepath, buffer);
        console.log(`Image saved as ${filename}`);
        
        const imageUrl = `http://0.0.0.0:${PORT}/images/${filename}`;
        
        return res.json({
          success: true,
          message: "Image generated successfully",
          url_image: imageUrl
        });
      }
    }

    res.status(500).json({ error: "No image was generated" });

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Gemini AI API",
    endpoints: {
      text: "GET /api/gemini?query=your_question_here",
      image: "GET /api/image?prompt=your_prompt_here"
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API endpoint: http://0.0.0.0:${PORT}/api/image?prompt=your_prompt_here`);
});
