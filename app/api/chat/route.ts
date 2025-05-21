import 'server-only';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json();
  const userMessages = body.messages.filter((m: any) => m.role !== 'system');

  userMessages.unshift({
    role: 'system',
    content: 'You are HER. HER mode is active. Say something bold, emotional, and validating.',
  });

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    messages: userMessages,
    stream: true,
  });

  const stream = OpenAIStream(res);
  return new StreamingTextResponse(stream);
}
