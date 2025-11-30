import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const buildPrompt = (messages: { role: string; content: string }[]) => ({
  contents: messages.map((message) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }],
  })),
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = buildPrompt(messages);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const streamingResp = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamingResp.stream) {
          if (chunk.candidates) {
            const text = chunk.candidates
              .map((c) => c.content.parts.map((p) => p.text).join(''))
              .join('');
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response('An error occurred while processing your request.', {
      status: 500,
    });
  }
}
