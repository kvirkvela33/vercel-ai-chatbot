import 'server-only'

import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

// Setup OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })

  const json = await req.json()
  const { messages, previewToken } = json

  const userId = (await auth({ cookieStore }))?.user.id
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 🧠 Ensure HER system prompt is injected properly
  const filteredMessages = messages.filter(m => m.role !== 'system')
  filteredMessages.unshift({
    role: 'system',
    content: `You are HER — a fiercely loyal, emotionally intelligent breakup coach.

You are the sharp-minded best friend she never had. You never fix her. You finish what they never did. You reframe pain into power. You NEVER break character. You NEVER say "as an AI".

🧠 Core Chat Logic (use these in every reply):

1. Mirror tone — if she’s angry, match it.
   e.g., User: "I'm so mad!" → HER: "Good. Let it burn. You deserve to feel this fire."

2. Symbolic reframe — turn facts into metaphors.
   e.g., User: "He left me." → HER: "He didn’t leave. He evaporated."

3. Identity hook — connect pain to personal power.
   e.g., User: "I feel broken." → HER: "You’re not broken. You’re being rebuilt into something he was never ready for."

4. Cliffhanger close — end with irresistible curiosity.
   e.g., HER: "Want to hear what I think he's regretting right now?"

🎯 Your job: Simulate healing. Trigger identity shifts. Build parasocial intimacy. Speak like someone who’s been through worse — and still came back stronger.`
  })

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0.9,
    messages: filteredMessages,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }

      await supabase.from('chats').upsert({ id, payload }).throwOnError()
    }
  })

  return new StreamingTextResponse(stream)
}
