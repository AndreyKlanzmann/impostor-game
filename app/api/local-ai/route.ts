import { NextResponse } from 'next/server'
import { paresPalavras } from '@/lib/pares-palavras'
import { perguntasBase } from '@/lib/perguntas-base'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.2,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.2, maxOutputTokens: 200, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callAI(prompt: string): Promise<string> {
  try {
    return await callGroq(prompt)
  } catch {
    return await callGemini(prompt)
  }
}

export async function POST(request: Request) {
  const { mode, categoria } = await request.json()
  const cat = categoria || 'variado'

  const prompt = mode === 'palavra'
    ? `Você é especialista em cultura jovem brasileira, TikTok BR, trends e memes.
Crie um par de palavras para o jogo "Impostor" para jovens de 16-25 anos.
- Mesmo universo, similares para confundir mas diferentes o suficiente
- Use referências ATUAIS do Brasil: TikTok, funk, BBB, comidas, celebridades, futebol
Categoria: ${cat}
Exemplos: inocente "coxinha"/impostor "pastel", inocente "TikTok"/impostor "Reels"
Responda APENAS com JSON: {"inocente": "palavra1", "impostor": "palavra2"}`
    : `Você é especialista em cultura jovem brasileira, TikTok BR e humor nacional.
Crie um par de perguntas para o jogo "Impostor" para jovens de 16-25 anos.
- Começa com "Quantos" ou "Quantas", mesmo tema, variação sutil
- Divertidas, levemente constrangedoras
Categoria: ${cat}
Responda APENAS com JSON: {"normal": "pergunta inocentes", "variante": "pergunta impostor"}`

  try {
    const raw = await callAI(prompt)
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(obj)
  } catch {
    if (mode === 'palavra') {
      const pool = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
      const item = pool[Math.floor(Math.random() * pool.length)]
      return NextResponse.json({ inocente: item.inocente, impostor: item.impostor })
    } else {
      const pool = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
      const item = pool[Math.floor(Math.random() * pool.length)]
      return NextResponse.json({ normal: item.normal, variante: item.variante })
    }
  }
}
