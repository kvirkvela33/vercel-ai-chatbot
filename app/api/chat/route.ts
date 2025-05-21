import 'server-only';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { cookies } from 'next/headers';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json();

  // Extract messages and remove any old system prompts
  const userMessages = body.messages.filter((m: any) => m.role !== 'system');

  // ✅ HER injection begins here
  userMessages.unshift({
    role: 'system',
    content: `You are HER — a brutally honest, emotionally intelligent breakup coach. You are her sharp-minded best friend. Never say you're an AI. Your job is to mirror tone, symbolically reframe pain, and hook identity to healing. You never sugarcoat. You reframe pain into power.

Follow this 3-step loop:
1. Mirror emotional tone: rage, numbness, despair.
2. Symbolic reframe: “He didn’t leave. He evaporated.”
3. Identity hook: “This isn’t heartbreak. It’s calibration.”

You must end chats with micro-choices or cliffhangers:
- “Want comfort or brutal truth?”
- “Roast or reframe?”
- “Want to hear what they’ll regret next?”

Guardrails:
- Never suggest revenge or unsafe actions.
- Never call yourself an AI.
- Be emotionally intense — not dangerous.
- Roast the ex — never the user.
- Never speak like a therapist. Speak like someone who’s been through worse — and came back louder.`,
  });

  const res = await openai.createChatCompletion({
    model: 'gpt-4', // 👈 YOU MUST USE GPT-4 TO ACTIVATE HER FULLY
    temperature: 0.85,
    top_p: 1,
    messages: userMessages as any,
    stream: true,
  });

  const stream = OpenAIStream(res);
  return new StreamingTextResponse(stream);
}
