export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function callGroq(
  messages: GroqMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.log('  ⚠️ GROQ_API_KEY not configured, skipping AI enrichment')
    return null
  }

  const model = options?.model ?? 'llama-3.3-70b-versatile'
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 2000

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.log(`  ⚠️ Groq API error: ${response.status} - ${error}`)
      return null
    }

    const data = await response.json() as GroqResponse
    return data.choices?.[0]?.message?.content ?? null
  } catch (err) {
    console.log(`  ⚠️ Groq API request failed: ${(err as Error).message}`)
    return null
  }
}
