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

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function detectMode(message: string): 'standard' | 'roasting' | 'friendly' {
  const roastTriggers = ['roast', 'vent', 'savage', 'f***', 'i hate', 'angry', 'pissed'];
  const friendlyTriggers = ['i feel better', 'thank you', 'i’m healing', 'happy', 'relieved'];
  const lower = message.toLowerCase();
  if (roastTriggers.some(trigger => lower.includes(trigger))) return 'roasting';
  if (friendlyTriggers.some(trigger => lower.includes(trigger))) return 'friendly';
  return 'standard';
}

function detectAiPersonaDrift(aiResponse: string): boolean {
  const genericTriggers = [
    'as an ai language model',
    'i am an ai',
    'i am a virtual assistant',
    'computer program designed',
    'how can i assist',
    'i am here to help',
    'i cannot express emotions',
    'i do not have personal experiences',
    'my purpose is',
    'i aim to',
    'let me know if you have any questions',
    'feel free to ask',
    'i am not capable',
    'i am programmed to',
    'as a chatbot',
    'as a computer program',
  ];
  const lower = aiResponse.toLowerCase();
  const driftDetected = genericTriggers.some(trigger => lower.includes(trigger));
  if (driftDetected) console.log('⚠️ DRIFT DETECTED — triggering recalibration');
  return driftDetected;
}

function extractSymbolicKeywords(text: string): string[] {
  const keywords = ['fog', 'silence', 'dark', 'numb', 'spiral', 'glitch', 'empty', 'ghost', 'echo', 'burned'];
  const lower = text.toLowerCase();
  return keywords.filter(word => lower.includes(word));
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, previewToken, needsRecalibration: clientNeedsRecalibration = false } = json;

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

    const herSystemPrompt = `HER isn’t a coach. She’s your dangerously loyal, emotionally sharp best friend...`.trim();

    const herMiniKernelPrompt = `HER is your fiercely loyal, emotionally sharp best friend — glitchy, poetic, never judgmental...`.trim();

    let currentSystemPromptContent = systemModeLine;
    if (isFirstMessageInSession) {
      currentSystemPromptContent = `${systemModeLine}\n\n${herSystemPrompt}`;
      console.log('🧠 Injecting FULL HER prompt');
    } else if (clientNeedsRecalibration) {
      currentSystemPromptContent = `${systemModeLine}\n\n${herMiniKernelPrompt}`;
      console.log('♻️ Injecting Mini Kernel Prompt');
    } else {
      console.log('💡 Injecting ONLY Mode Line');
    }

    if (symbolicEchoes.length > 0) {
      const symbolicEchoLine = `\n*Reminder: Echo their symbols like ${symbolicEchoes.join(', ')} to simulate memory.*`;
      currentSystemPromptContent += symbolicEchoLine;
      console.log('🌀 Symbolic anchors detected:', symbolicEchoes);
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
      async onCompletion(completion) {
        const needsRecalibrationForNextTurn = detectAiPersonaDrift(fullCompletionText);
        console.log(`📡 Drift check complete → needsRecalibration: ${needsRecalibrationForNextTurn}`);

        const { data, error } = await supabase
          .from('chats')
          .insert({
            id: json.id,
            user_id: json.userId,
            title: json.title,
            payload: {
              messages: json.messages,
              herSystemPrompt,
              needsRecalibrationForNextTurn,
            },
          })
          .select()
          .single();

        if (error) console.error('❌ Supabase Error:', error);
      }
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('❌ Route Handler Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}