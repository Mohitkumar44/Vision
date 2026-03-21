import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

export const analyzeObjectPermanenceFlow = ai.defineFlow(
  {
    name: 'analyzeObjectPermanence',
    inputSchema: z.object({
      baselineImage: z.string().optional(),
      currentFrame: z.string(),
      description: z.string(),
    }),
    outputSchema: z.object({
      present: z.boolean(),
      explanation: z.string(),
      boundingBox: z.array(z.number()).optional(),
    }),
  },
  async (input) => {
    let promptParts: any[] = [];
    
    if (input.baselineImage) {
      promptParts = [
        { text: `You are an expert security AI tracking this object: "${input.description}".
1. Carefully identify the object described in the BASELINE image.
2. Check if that exact same object is still clearly visible in the CURRENT image.
3. If it is present, output its bounding box in the CURRENT image as [ymin, xmin, ymax, xmax] scaled from 0 to 1000.
BASELINE:` },
        { media: { url: input.baselineImage } },
        { text: 'CURRENT:' },
        { media: { url: input.currentFrame } },
      ];
    } else {
      promptParts = [
        { text: `You are an expert security AI looking for this object: "${input.description}".
1. Check if the described object is clearly visible in the provided image.
2. If it is present, output its bounding box as [ymin, xmin, ymax, xmax] scaled from 0 to 1000.
IMAGE:` },
        { media: { url: input.currentFrame } },
      ];
    }

    const { output } = await ai.generate({
      prompt: promptParts,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: z.object({
          present: z.boolean().describe("true if the exact described object is present in the CURRENT image, otherwise false"),
          explanation: z.string().describe("Clear, short explanation of your reasoning"),
          boundingBox: z.array(z.number()).optional().describe("[ymin, xmin, ymax, xmax] scaled 0-1000 representing the bounding box in the CURRENT image"),
        }),
      },
      config: {
        temperature: 0.1,
      }
    });

    if (!output) {
      throw new Error("Missing structured output from AI");
    }

    return output;
  }
);
