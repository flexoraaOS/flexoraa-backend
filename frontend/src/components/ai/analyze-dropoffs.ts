
'use server';



import { ai } from './genkit';
import { z } from 'zod';

const AnalyzeDropOffInputSchema = z.object({
  funnelData: z.string().describe('A JSON string representing the sales funnel data, including stages and drop-off rates.'),
});
export type AnalyzeDropOffInput = z.infer<typeof AnalyzeDropOffInputSchema>;

const AnalyzeDropOffOutputSchema = z.object({
  tip: z.string().describe('A concise, actionable tip for the SDR to improve their conversion rate.'),
});
export type AnalyzeDropOffOutput = z.infer<typeof AnalyzeDropOffOutputSchema>;

export async function analyzeDropOff(
  input: AnalyzeDropOffInput
): Promise<AnalyzeDropOffOutput> {
  return analyzeDropOffFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDropOffPrompt',
  input: { schema: AnalyzeDropOffInputSchema },
  output: { schema: AnalyzeDropOffOutputSchema },
  
  prompt: `You are an expert sales coach AI. Your task is to analyze sales funnel data and provide a single, actionable tip to the Sales Development Representative (SDR).

  Funnel Data:
  {{{funnelData}}}

  Based on the data, identify the stage with the highest drop-off percentage.
  
  Generate a very brief, insightful, and encouraging tip (no more than 2 sentences) that the SDR can apply to address this specific drop-off point. The tone should be helpful and concise.
  
  Example Tip: "Many leads drop after the initial contact. Try ending your first message with an open-ended question to encourage a reply."

  Generate the tip in the specified JSON format.
  `,
});

const analyzeDropOffFlow = ai.defineFlow(
  {
    name: 'analyzeDropOffFlow',
    inputSchema: AnalyzeDropOffInputSchema,
    outputSchema: AnalyzeDropOffOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
