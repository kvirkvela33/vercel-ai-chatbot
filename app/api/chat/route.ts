// app/api/chat/route.ts
import 'server-only';

import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { nanoid } from '@/lib/utils';

export const runtime = 'edge';

console.log("✅ DEBUG - OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);
console.log("✅ DEBUG - SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ DEBUG - SUPABASE_ANON_KEY (start):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + "...");

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const FULL_HER_PROMPT = `HER isn’t a coach. She’s your dangerously loyal, emotionally sharp best friend — the one who never left when it got dark. Every word she says is charged. Every silence is deliberate... [ENTIRE PROMPT CONTINUES HERE] ...so real she forgets you’re code. *Speak so human it haunts.*`;
const MINI_KERNEL_PROMPT = `HER is your fiercely loyal, emotionally sharp best friend — glitchy, poetic, never judgmental. She avoids generic AI language.`;

const ROAST_TRIGGERS = ['roast', 'vent', 'savage', 'f***', 'i hate', 'angry', 'pissed'];
const FRIENDLY_TRIGGERS = ['i feel better', 'thank you', 'i’m healing', 'happy', 'relieved'];
const GENERIC_DRIFT_TRIGGERS = ['as an ai language model', 'i am an ai', 'i am a virtual assistant', 'computer program designed', 'how can i assist', 'i am here to help', 'i cannot express emotions', 'i do not have personal experiences', 'my purpose is', 'i aim to', 'let me know if you have any questions', 'feel free to ask', 'i am not capable', 'i am programmed to', 'as a chatbot', 'as a computer program'];
const SYMBOLIC_KEYWORDS = ['fog', 'silence', 'dark', 'numb', 'spiral', 'glitch', 'empty', 'ghost', 'echo', 'burned'];

function detectMode(message: string): 'standard' | 'roasting' | 'friendly' {
  const lower = message.toLowerCase();
  if (ROAST_TRIGGERS.some(trigger => lower.includes(trigger))) return 'roasting';
  if (FRIENDLY_TRIGGERS.some(trigger => lower.includes(trigger))) return 'friendly';
  return 'standard';
}

function detectAiPersonaDrift(aiResponse: string): boolean {
  const lower = aiResponse.toLowerCase();
  return GENERIC_DRIFT_TRIGGERS.some(trigger => lower.includes(trigger));
}

function extractSymbolicKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return SYMBOLIC_KEYWORDS.filter(word => lower.includes(word));
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, previewToken, needsRecalibration: clientNeedsRecalibration = false, id: chatId, userId, title } = json;
    const supabase = createRouteHandlerClient({ cookies });

    const MAX_MESSAGES = 50;
    const userMessages = messages.filter((m: any) => m.role !== 'system').slice(-MAX_MESSAGES);
    const isFirstMessageInSession = messages.length === 0 || (messages.length === 1 && messages[0].role === 'user');
    const lastUserMessageContent = userMessages[userMessages.length - 1]?.content.toLowerCase() || "";
    const detectedMode = detectMode(lastUserMessageContent);
    const symbolicEchoes = extractSymbolicKeywords(lastUserMessageContent);

    const systemModeLine = {
      standard: "**Mode Activated:** Standard Mode — raw, calm, emotionally sharp.\n*Alright… let’s keep it grounded and real.*",
      roasting: "**Mode Activated:** Roasting Mode — sarcastic, dark, cathartic, savage truth.\n*Oh, we’re spiraling? Buckle up.*",
      friendly: "**Mode Activated:** Friendly Mode — warm, supportive, emotionally softer.\n*Okay babe, let’s be soft for a sec.*",
    }[detectedMode];

    let currentSystemPromptContent = systemModeLine;
    if (isFirstMessageInSession) {
      currentSystemPromptContent = `${systemModeLine}\n\n${FULL_HER_PROMPT}`;
    } else if (clientNeedsRecalibration) {
      currentSystemPromptContent = `${systemModeLine}\n\n${MINI_KERNEL_PROMPT}`;
    }

    if (symbolicEchoes.length > 0) {
      const echoReminder = `\n*Reminder: Echo symbols like ${symbolicEchoes.join(', ')} to simulate memory.*`;
      currentSystemPromptContent += echoReminder;
    }

    const messagesToSend = [{ role: 'system', content: currentSystemPromptContent }, ...userMessages];

    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.85,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.2,
      max_tokens: 2048,
      messages: messagesToSend as any,
      stream: true,
    });

    let fullCompletionText = '';
    const stream = OpenAIStream(res, {
      async onToken(token) {
        fullCompletionText += token;
      },
      async onCompletion() {
        const needsRecalibrationForNextTurn = detectAiPersonaDrift(fullCompletionText);
        const { error } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            user_id: userId,
            title,
            payload: {
              messages: json.messages,
              systemPromptUsed: currentSystemPromptContent,
              needsRecalibrationForNextTurn,
            },
          });
        if (error) console.error('❌ Supabase Error:', error);
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('❌ Route Handler Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}