
'use server';

import { z } from 'zod';
import { generateMessageTemplate } from '@/ai/flows/generate-message-template';

const GenerateMessageTemplateInputSchema = z.object({
  businessInfo: z.string().describe('Detailed information about the client\'s business.'),
  templateType: z.enum(['INITIAL_OUTREACH', 'RE_ENGAGEMENT'])
    .describe('The type of message template to generate.'),
  tone: z.optional(z.enum(['Friendly', 'Professional', 'Direct', 'Casual']))
    .describe('The desired tone for the re-engagement message.'),
});

export type State = {
  message?: string | null;
  errors?: {
    businessInfo?: string[];
    templateType?: string[];
  } | null;
  data?: { template: string } | null;
};

export async function generateTemplateAction(
  input: z.infer<typeof GenerateMessageTemplateInputSchema>
): Promise<State> {
  const validatedFields = GenerateMessageTemplateInputSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input. Please check the fields and try again.',
      data: null,
    };
  }

  try {
    const template = await generateMessageTemplate(validatedFields.data);
    return {
      message: 'Template generated successfully.',
      data: { template },
      errors: null,
    };
  } catch (error) {
    console.error('Template generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      message: `Error generating template: ${errorMessage}`,
      data: null,
      errors: null,
    };
  }
}
