
'use server';

/**
 * @fileOverview AI flow for generating personalized WhatsApp message templates.
 *
 * - generateMessageTemplate - A function that generates a message template.
 * - GenerateMessageTemplateInput - The input type for the generateMessageTemplate function.
 * - GenerateMessageTemplateOutput - The return type for the generateMessage-template function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMessageTemplateInputSchema = z.object({
  businessInfo: z.string().describe('Detailed information about the client\'s business.'),
  templateType: z.enum(['INITIAL_OUTREACH', 'RE_ENGAGEMENT'])
    .describe('The type of message template to generate.'),
  tone: z.optional(z.enum(['Friendly', 'Professional', 'Direct', 'Casual']))
    .describe('The desired tone for the re-engagement message.'),
});
export type GenerateMessageTemplateInput = z.infer<typeof GenerateMessageTemplateInputSchema>;

const GenerateMessageTemplateOutputSchema = z.object({
  template: z.string().describe('The generated WhatsApp message template.'),
});
export type GenerateMessageTemplateOutput = z.infer<typeof GenerateMessageTemplateOutputSchema>;

export async function generateMessageTemplate(
  input: GenerateMessageTemplateInput
): Promise<GenerateMessageTemplateOutput> {
  return generateMessageTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMessageTemplatePrompt',
  input: {schema: GenerateMessageTemplateInputSchema},
  output: {schema: GenerateMessageTemplateOutputSchema},
  prompt: `You are an expert copywriter specializing in creating high-converting WhatsApp message templates for businesses.
  Your task is to generate a personalized message template based on the provided business information and the type of message required.

  Business Information:
  {{{businessInfo}}}

  Template Type: {{{templateType}}}

  Instructions:
  - The template should be concise, engaging, and professional.
  - It should be personalized based on the business information.
  - Use placeholders like {{lead_name}} for lead-specific details.
  - The tone should be friendly and approachable, suitable for WhatsApp.
  {{#if (eq templateType 'RE_ENGAGEMENT')}}
  - This is a re-engagement message, so assume the lead has been inactive.
  - The desired tone for this message is: **{{{tone}}}**. Adapt the language and style accordingly.
  {{/if}}

  Generate the message template in the specified JSON format.
  `,
});

const generateMessageTemplateFlow = ai.defineFlow(
  {
    name: 'generateMessageTemplateFlow',
    inputSchema: GenerateMessageTemplateInputSchema,
    outputSchema: GenerateMessageTemplateOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
