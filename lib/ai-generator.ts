import { paresPalavras, type ParPalavra } from '@/lib/pares-palavras'
import { perguntasBase, type PerguntaBase } from '@/lib/perguntas-base'

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

const wordPrompt = (cat: string) => `Você é especialista em cultura jovem brasileira, TikTok BR, trends e memes.
Crie um par de palavras para o jogo "Impostor" para jovens de 16-25 anos.
- Mesmo universo, similares para confundir mas diferentes o suficiente para o impostor se entregar
- Use referências ATUAIS do Brasil: TikTok, Instagram, funk, BBB, comidas, celebridades, futebol
Categoria: ${cat}
Exemplos: inocente "coxinha"/impostor "pastel", inocente "TikTok"/impostor "Reels", inocente "Pix"/impostor "TED"
Responda APENAS com JSON: {"inocente": "palavra1", "impostor": "palavra2"}`

const questionPrompt = (cat: string) => `Você é especialista em cultura jovem brasileira, TikTok BR e humor nacional.
Crie um par de perguntas para o jogo "Impostor" para jovens de 16-25 anos.
- Começa com "Quantos" ou "Quantas", mesmo tema, variação sutil
- Divertidas, levemente constrangedoras mas não ofensivas
Categoria: ${cat}
Exemplos: normal "Quantas horas no TikTok?"/variante "Quantas horas no Instagram?"
Responda APENAS com JSON: {"normal": "pergunta inocentes", "variante": "pergunta impostor"}`

export async function generateWordPair(categoria?: string): Promise<ParPalavra> {
  const cat = categoria || 'variado'
  try {
    const raw = await callAI(wordPrompt(cat))
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (!obj.inocente || !obj.impostor) throw new Error()
    return { categoria: cat, inocente: obj.inocente, impostor: obj.impostor }
  } catch {
    const pool = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export async function generateQuestionPair(categoria?: string): Promise<PerguntaBase> {
  const cat = categoria || 'variado'
  try {
    const raw = await callAI(questionPrompt(cat))
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (!obj.normal || !obj.variante) throw new Error()
    return { categoria: cat, normal: obj.normal, variante: obj.variante }
  } catch {
    const pool = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export function getStaticWordPair(categoria?: string): ParPalavra {
  const pool = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getStaticQuestionPair(categoria?: string): PerguntaBase {
  const pool = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
  return pool[Math.floor(Math.random() * pool.length)]
}
