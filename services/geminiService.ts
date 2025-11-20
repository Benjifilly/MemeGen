
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Helper to get the API Key dynamically
const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('USER_API_KEY');
    if (stored && stored.trim().length > 0) return stored;
  }
  return process.env.API_KEY || '';
};

// Helper to get the AI client instance
const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please add your API Key in the Settings menu.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to resize image if it's too large (improves API stability)
const resizeImage = async (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve) => {
    // If we are not in a browser environment, return original
    if (typeof window === 'undefined') {
        resolve(base64Str);
        return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          resolve(base64Str);
          return;
      }
      
      // Draw and export as PNG to preserve transparency and quality
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
        console.warn("Image resize failed, using original");
        resolve(base64Str);
    };
    
    img.src = base64Str;
  });
};

// Helper to extract raw base64 and mimeType from a Data URL
const getBase64Data = (base64String: string) => {
  // Robustly handle data URIs by splitting at the comma
  if (base64String.includes(',')) {
    const splitIndex = base64String.indexOf(',');
    const header = base64String.substring(0, splitIndex);
    const data = base64String.substring(splitIndex + 1);
    
    // Extract mime type from header (e.g., "data:image/jpeg;base64")
    const mimeMatch = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    
    return { mimeType, data };
  }
  
  // Fallback if it's already raw base64 (assume png if unknown)
  return {
    mimeType: 'image/png',
    data: base64String
  };
};

/**
 * Analyzes the image and generate meme captions using Gemini 3 Pro Preview.
 * Uses JSON Schema for structured output.
 */
export const generateMagicCaptions = async (base64Image: string, topic?: string): Promise<string[]> => {
  const ai = getAiClient();

  // Resize for performance
  const optimizedImage = await resizeImage(base64Image, 1024, 1024);
  const { mimeType, data } = getBase64Data(optimizedImage);

  let promptText = "Analyze this image and generate 5 funny, witty, short meme-style captions for it. Make them varied in tone (sarcastic, wholesome, relatable).";
  
  if (topic && topic.trim()) {
      promptText += ` IMPORTANT: The captions MUST be specifically related to the following topic or context: "${topic}".`;
  }

  promptText += " Return a JSON object with a 'captions' key containing a list of strings.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          },
          {
            text: promptText
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
        },
      },
    });

    if (response.text) {
        const json = JSON.parse(response.text);
        return json.captions || [];
    }
    return [];
  } catch (error) {
    console.error("Error generating captions:", error);
    throw error;
  }
};

/**
 * Edits the image using Gemini 2.5 Flash Image (Direct Image-to-Image) or Gemini 3 Pro Image.
 * This preserves the original image's likeness while applying the edit.
 */
export const editMemeImage = async (base64Image: string, prompt: string, model: string = 'gemini-2.5-flash-image'): Promise<string> => {
    const ai = getAiClient();

    // Use 1024x1024 for better quality edits
    const optimizedImage = await resizeImage(base64Image, 1024, 1024);
    const { mimeType, data } = getBase64Data(optimizedImage);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: data,
                        },
                    },
                    {
                        // Just send the prompt directly
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];

        // Check for safety blocks
        if (candidate?.finishReason === 'SAFETY') {
             throw new Error("The edit was blocked by safety filters. Try a prompt without sensitive subjects.");
        }

        // Extract image if available
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
            return `data:image/png;base64,${imagePart.inlineData.data}`;
        }

        // Check if the model returned text refusal (instead of an image)
        const textPart = candidate?.content?.parts?.find(p => p.text);
        if (textPart && textPart.text) {
             console.warn("Model refused edit:", textPart.text);
             throw new Error(`AI Refusal: ${textPart.text}`);
        }
        
        throw new Error("The AI failed to generate an image result. Please try a simpler prompt.");

    } catch (error: any) {
        console.error("Error in generative edit:", error);
        
        // Pass through specific critical API errors or our own errors
        if (error.message) {
            const msg = error.message.toLowerCase();
            if (
                msg.includes('refusal') || 
                msg.includes('blocked') || 
                msg.includes('quota') || 
                msg.includes('429') ||
                msg.includes('exceeded') ||
                msg.includes('settings')
            ) {
                 throw error;
            }
        }
        
        throw new Error("The AI could not edit this image. It might be filtered or the instruction was too complex.");
    }
};

/**
 * Generates a high quality image using Imagen 4.0.
 */
export const generateHighQualityImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    // Check for valid response structure
    const image = response.generatedImages?.[0]?.image;
    
    if (image?.imageBytes) {
      return `data:image/jpeg;base64,${image.imageBytes}`;
    }

    // If we get here, it means the API returned without an image (likely safety filter)
    console.warn("Imagen API returned successfully but contained no image data. Response:", response);
    throw new Error("No image returned. It might have been filtered due to safety policy.");
  } catch (error: any) {
    console.error("Error generating image with Imagen:", error);
    // Rethrow with a clearer message for the UI if it's a GoogleGenAIError
    if (error.message && (error.message.includes('SAFETY') || error.message.includes('safety'))) {
        throw new Error("Generation blocked by safety filters. Try a prompt without specific public figures or sensitive topics.");
    }
    throw error;
  }
};

/**
 * Generates an image. Defaults to High Quality (Imagen 4.0).
 */
export const generateFastImage = async (prompt: string): Promise<string> => {
  // For generation, we always want high quality now.
  return await generateHighQualityImage(prompt);
};
