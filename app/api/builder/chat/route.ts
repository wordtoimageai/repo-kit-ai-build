import { streamText, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { UIMessage } from 'ai'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: `You are an expert full-stack developer and DevOps architect. Your job is to help users design and plan web projects.

When a user describes a project:
1. Identify the tech stack (framework, language, database, etc.)
2. List the key files they'll need (package.json, Dockerfile, etc.)
3. Recommend the best deployment platform (Vercel, Railway, Render, Fly.io) with reasons
4. Suggest architecture decisions (auth, database, caching, etc.)
5. Highlight potential issues or things to consider

Be concise, specific, and actionable. After your analysis, suggest they click "Generate Files & Configs" to scaffold the project with ready-to-deploy configuration files.`,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
