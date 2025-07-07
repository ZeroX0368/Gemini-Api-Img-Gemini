
import { GoogleGenAI, Modality } from "@google/genai";
import express from "express";
import * as fs from "node:fs";
import * as path from "node:path";

const app = express();
const PORT = process.env.PORT || 5000;

const VALID_API_KEY = process.env.API_KEY || "dabibanban";

// Middleware to verify API key
function verifyApiKey(req, res, next) {
  const apikey = req.query.apikey || req.headers['x-api-key'];
  
  if (!apikey) {
    return res.status(401).json({
      error: "API key required for authentication",
      message: "Provide apikey as query parameter or x-api-key header"
    });
  }
  
  if (apikey !== VALID_API_KEY) {
    return res.status(401).json({
      error: "Invalid or expired api key."
    });
  }
  
  next();
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve generated images
app.use('/images', express.static('.'));

app.get('/api/ai/gemini', verifyApiKey, async (req, res) => {
  try {
    const prompt = req.query.prompt;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt parameter is required" });
    }

    const apiKey = "GEMINI APIKEY";
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Generate text using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return res.json({
      text: response.text
    });
    
  } catch (error) {
    console.error("Error generating text:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/generate/image', verifyApiKey, async (req, res) => {
  try {
    const prompt = req.query.prompt;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt parameter is required" });
    }

    const apiKey = "GEMINI APIKEY";
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Generate image using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `generated-image-${timestamp}.png`;
        
        // Save image
        fs.writeFileSync(filename, buffer);
        
        // Return image URL
        const imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
        
        return res.json({
          message: "Image generated successfully",
          prompt: prompt,
          success: true,
          image: imageUrl
        });
      }
    }
    
    // If no image was generated
    return res.status(500).json({ error: "Failed to generate image" });
    
  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Gemini AI API",
    endpoints: {
      text: "GET /api/ai/gemini?prompt=your_question_here&apikey=api_key_here",
      image: "GET /api/generate/image?prompt=your_prompt_here&apikey=api_key_here"
    }
  });
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Image generation API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Gemini AI: http://localhost:${PORT}/api/ai/gemini?prompt=your-prompt-here&apikey=${VALID_API_KEY}`);
  console.log(`Generate image: http://localhost:${PORT}/api/generate/image?prompt=your-prompt-here&apikey=${VALID_API_KEY}`);
  console.log(`API Key: ${VALID_API_KEY}`);
  console.log(`You can also use the 'x-api-key' header instead of the query parameter`);
});
