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
Crie um par de perguntas criativas baseadas EXCLUSIVAMENTE no tema escolhido pelo host.
- As perguntas devem explorar o tema "${cat}" de forma interessante e inesperada
- Inocentes e impostor recebem perguntas relacionadas mas com respostas naturalmente diferentes
- As respostas podem ser palavras, nomes, descrições — não precisam ser números
- Quando a resposta for número, especifique o formato (ex: "só números")

Tema: "${cat}"
Exemplos de como pensar:
- Tema "futebol": normal "Qual foi o gol mais bonito que você já viu ao vivo?" / variante "Qual foi a maior goleada que você se lembra?"
- Tema "Harry Potter": normal "Com qual personagem você se identifica mais?" / variante "Qual personagem você acha mais superestimado?"
- Tema "anos 80": normal "Qual música dos anos 80 você não cansa de ouvir?" / variante "Qual moda dos anos 80 você nunca entendeu?"

Responda APENAS com JSON: {"normal": "pergunta inocentes", "variante": "pergunta impostor"}`
  }

  return `Você é um criador de perguntas para um jogo de impostor brasileiro.
O jogo funciona assim: inocentes recebem uma pergunta, o impostor recebe uma pergunta PARECIDA mas diferente. Todos respondem em texto. Depois as respostas aparecem juntas e o grupo tenta achar quem é o impostor pela resposta diferente.

REGRAS FUNDAMENTAIS:
- As perguntas devem ser CRIATIVAS e INESPERADAS — algo que ninguém esperava ser perguntado
- A resposta do inocente e do impostor devem ser naturalmente diferentes, revelando o impostor
- As respostas NÃO precisam ser números — podem ser palavras, nomes, descrições curtas
- TUDO em contexto brasileiro, cotidiano e acessível
- NUNCA use nichos obscuros (k-pop, TED Talks, termos técnicos estrangeiros)
- Quando a resposta for número, especifique o formato

Categoria: ${cat}

EXEMPLOS DO ESTILO CERTO:
- inocente: "Quantas pessoas em média você acha que uma pessoa pega em um bloquinho de carnaval?" / impostor: "Fale um número de 1 a 15"
- inocente: "Se inventasse uma máquina do tempo, para qual época você iria?" / impostor: "Se pudesse pegar um momento da história para botar em um quadro, qual seria?"
- inocente: "Se você ganhasse na loteria, quantos % você doaria pros seus pais? (só números)" / impostor: "Qual a maior % de gorjeta que você já deu? (só números)"
- inocente: "Qual o primeiro pensamento que vem na sua cabeça quando acorda?" / impostor: "Qual o último pensamento antes de dormir?"
- inocente: "Qual comida você comeria todo dia sem enjoar?" / impostor: "Qual comida você nunca mais quer ver na sua vida?"

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
