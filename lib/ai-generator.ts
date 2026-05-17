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
      temperature: 1.3,
      max_tokens: 300,
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
      generationConfig: { temperature: 1.3, maxOutputTokens: 300, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callAI(prompt: string): Promise<string> {
  try { return await callGroq(prompt) } catch { return await callGemini(prompt) }
}

function wordPrompt(cat: string, isCustom: boolean) {
  if (isCustom) {
    return `Você é especialista em criar conteúdo para jogos.
Crie um par de palavras/termos para o jogo "Impostor" com base no tema escolhido pelo host.
- Ambas devem ser diretamente do tema "${cat}"
- Similares o suficiente para confundir, diferentes o suficiente para o impostor se trair
- Seja criativo e específico dentro do tema

Tema: "${cat}"
Exemplos de como pensar: se tema for "Harry Potter" → inocente "Grifinória"/impostor "Sonserina"; se tema for "anos 80" → inocente "Atari"/impostor "Nintendinho"

Responda APENAS com JSON: {"inocente": "palavra1", "impostor": "palavra2"}`
  }

  return `Você é especialista em cultura brasileira popular e cotidiano.
Crie um par de palavras para o jogo "Impostor" para brasileiros de todas as idades.
- Mesmo universo amplo, similares para confundir mas diferentes o suficiente para o impostor se trair
- Prefira coisas do dia a dia brasileiro: comida, futebol, família, trabalho, dinheiro, relacionamentos, redes sociais
- EVITE nichos muito específicos (k-pop, TED Talks, termos técnicos estrangeiros)
Categoria: ${cat}
Exemplos: inocente "coxinha"/impostor "pastel", inocente "Flamengo"/impostor "Corinthians", inocente "Pix"/impostor "TED"
Responda APENAS com JSON: {"inocente": "palavra1", "impostor": "palavra2"}`
}

function questionPrompt(cat: string, isCustom: boolean) {
  if (isCustom) {
    return `Você é um criador de perguntas para um jogo de impostor.
Crie um par de perguntas baseadas no tema escolhido pelo host.

REGRA MAIS IMPORTANTE: as duas perguntas DEVEM exigir o MESMO FORMATO de resposta.
- Se uma pede um nome → a outra pede um nome
- Se uma pede uma história curta → a outra pede uma história curta
- Se uma pede um número → a outra pede um número
- NUNCA misture formatos (uma pedindo nome e outra pedindo justificativa)

O CONTEÚDO muda, o FORMATO da resposta não.

Tema: "${cat}"

Exemplos CORRETOS (mesmo formato):
- Tema "futebol": normal "Qual time brasileiro você nunca consegue torcer contra?" / variante "Qual time você torce quando seu time não está jogando?"
  → ambas pedem um nome de time
- Tema "Harry Potter": normal "Com qual personagem você se identifica mais?" / variante "Com qual personagem você menos se identifica?"
  → ambas pedem um nome de personagem
- Tema "anos 80": normal "Qual música dos anos 80 você não cansa de ouvir?" / variante "Qual música dos anos 80 você não aguenta mais?"
  → ambas pedem uma música

Exemplos ERRADOS (formatos diferentes — NUNCA faça isso):
- normal "Qual time você torce?" / variante "Qual foi o jogo que mais te emocionou e por quê?"
  → um pede nome, outro pede história

Responda APENAS com JSON: {"normal": "pergunta inocentes", "variante": "pergunta impostor"}`
  }

  return `Você é um criador de perguntas para um jogo de impostor brasileiro.
Inocentes recebem uma pergunta, o impostor recebe uma pergunta PARECIDA mas diferente. Todos respondem em texto. As respostas aparecem juntas e o grupo tenta achar quem é o impostor.

REGRA MAIS IMPORTANTE: as duas perguntas DEVEM exigir o MESMO FORMATO de resposta.
- Se uma pede um número → a outra pede um número
- Se uma pede um nome → a outra pede um nome
- Se uma pede uma escolha → a outra pede uma escolha
- Se uma pede uma história curta → a outra pede uma história curta
- NUNCA misture formatos

O CONTEÚDO muda, o FORMATO não. O impostor se trai pelo conteúdo, não pelo formato.

Outras regras:
- Perguntas criativas e inesperadas, contexto brasileiro
- EVITE nichos obscuros (TED Talks, termos estrangeiros, k-pop)
- Quando a resposta for número, especifique: "(só números, sem R$)"

Categoria: ${cat}

EXEMPLOS CORRETOS:
- inocente: "Quantas pessoas em média você acha que uma pessoa pega num bloquinho?" / impostor: "Fale um número de 1 a 15"
  → ambas pedem um número
- inocente: "Se ganhasse na loteria, quantos % doaria pros seus pais? (só números)" / impostor: "Qual a maior % de gorjeta que já deu? (só números)"
  → ambas pedem uma porcentagem
- inocente: "Qual comida você comeria todo dia sem enjoar?" / impostor: "Qual comida você nunca mais quer ver na sua vida?"
  → ambas pedem o nome de uma comida
- inocente: "Qual o primeiro pensamento quando acorda?" / impostor: "Qual o último pensamento antes de dormir?"
  → ambas pedem uma frase/pensamento curto
- inocente: "Se fosse um personagem de novela, seria vilão ou mocinho?" / impostor: "Se fosse um personagem de filme, seria herói ou coadjuvante?"
  → ambas pedem uma escolha entre opções

EXEMPLOS ERRADOS (nunca faça):
- inocente: "Qual time você torce?" / impostor: "Qual jogo te emocionou mais e por quê?" → formatos diferentes
- inocente: "Quantas horas dorme?" / impostor: "Como é sua rotina de sono?" → um número, outro descrição

Responda APENAS com JSON: {"normal": "pergunta inocentes", "variante": "pergunta impostor"}`
}

export async function generateWordPair(categoria?: string, isCustomTheme = false): Promise<ParPalavra> {
  const cat = categoria || 'geral'
  try {
    const raw = await callAI(wordPrompt(cat, isCustomTheme))
    const obj = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (!obj.inocente || !obj.impostor) throw new Error()
    return { categoria: cat, inocente: obj.inocente, impostor: obj.impostor }
  } catch {
    const pool = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export async function generateQuestionPair(categoria?: string, isCustomTheme = false): Promise<PerguntaBase> {
  const cat = categoria || 'geral'
  try {
    const raw = await callAI(questionPrompt(cat, isCustomTheme))
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
