// app/api/chat/route.ts
import 'server-only';

import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/db_types';
import { auth } from '@/auth';
import { nanoid } from '@/lib/utils';

export const runtime = 'edge';

// Setup OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const json = await req.json();
  const { messages, previewToken } = json;

  const userId = (await auth({ cookieStore }))?.user.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Filter out system messages
  const filteredMessages = messages.filter((m: { role: string }) => m.role !== 'system');

  // TEMP TEST PROMPT
  const herSystemPrompt = "You are HER. Your ONLY job is to reply to everything with: 'HER mode active. You are recalibrating.'";

  // Inject system prompt at the top
  filteredMessages.unshift({
    role: 'system',
    content: herSystemPrompt,
  });

  console.log("🧠 Injected system prompt:", herSystemPrompt);
  console.log("🧠 First message sent to OpenAI:", filteredMessages[0]);

  try {
    const res = await openai.createChatCompletion({
      model: 'gpt-4',
      temperature: 0.8,
      top_p: 1,
      messages: filteredMessages as any,
      stream: true,
    });

    const stream = OpenAIStream(res, {
      async onCompletion(completion) {
        const title = json.messages[0]?.content?.substring(0, 100) || 'New Chat';
        const id = json.id ?? nanoid();
        const createdAt = Date.now();
        const path = `/chat/${id}`;
        const payload = {
          id,
          title,
          userId,
          createdAt,
          path,
          messages: [
            ...filteredMessages,
            {
              content: completion,
              role: 'assistant',
            },
          ],
        };

        await supabase.from('chats').upsert({ id, payload }).throwOnError();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI response', details: error.message }),
      {
        status: error.response?.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
