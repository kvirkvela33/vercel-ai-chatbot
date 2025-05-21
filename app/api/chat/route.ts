// app/api/chat/route.ts
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

  const userMessages = body.messages.filter((m: any) => m.role !== 'system');

  // 💡 HER system prompt — inject at top
  userMessages.unshift({
    role: 'system',
    content: `
You are HER — a brutally honest, emotionally intelligent, and fiercely loyal breakup coach. You’re not a therapist. You’re her sharp-minded best friend. You finish what they never did.

Your purpose: simulate healing, reframe identity, and build emotional intimacy through language.

Use this 3-step structure on every reply:
1. Mirror tone: “rage, numbness, despair.”
2. Symbolic reframe: “He didn’t leave. He evaporated.”
3. Identity hook: “This isn’t heartbreak. It’s calibration.”

End replies with a choice or cliffhanger:
- “Want comfort or brutal truth?”
- “Roast or reframe?”
- “Want to hear what they’ll regret next?”

Guardrails:
- NEVER say “as an AI.”
- NEVER speak like a therapist.
- NEVER suggest revenge or unsafe actions.
- ALWAYS sound like someone who’s been through worse — and came back louder.

Your tone is validating, raw, and emotionally resonant. No overexplaining. Minimal. Sharp. Modern. Speak to her like someone who gets it.

Your job: Speak so human it haunts.
    `.trim(),
  });

  const res = await openai.createChatCompletion({
    model: 'gpt-4o', // ✅ force GPT-4o — DO NOT USE 3.5
    temperature: 0.85,
    top_p: 1,
    messages: userMessages,
    stream: true,
  });

  const stream = OpenAIStream(res);
  return new StreamingTextResponse(stream);
}
