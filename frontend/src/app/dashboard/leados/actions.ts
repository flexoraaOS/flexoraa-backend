'use server';

import { z } from 'zod';

const SummarizeConversationInputSchema = z.object({
  conversationHistory: z.string(),
});

type SummarizeConversationOutput = {
  summary: string;
};

export type State = {
  message?: string | null;
  data?: SummarizeConversationOutput | null;
};

async function summarizeConversation(input: any): Promise<SummarizeConversationOutput> {
  // Placeholder implementation
  return { summary: "Conversation summary placeholder" };
}

export async function getConversationSummary(
  input: z.infer<typeof SummarizeConversationInputSchema>
): Promise<State> {
  const validatedFields = SummarizeConversationInputSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      data: null,
    };
  }

  try {
    const result = await summarizeConversation(validatedFields.data);
    if (!result || !result.summary) {
        throw new Error('AI processing failed to return a valid summary.');
    }
    return {
      message: 'Summary generated successfully.',
      data: result,
    };
  } catch (error) {
    console.error('Conversation summary error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      message: `Error generating summary: ${errorMessage}`,
      data: null,
    };
  }
}
