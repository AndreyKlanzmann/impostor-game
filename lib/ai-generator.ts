import { paresPalavras, type ParPalavra } from '@/lib/pares-palavras'
import { perguntasBase, type PerguntaBase } from '@/lib/perguntas-base'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.2,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function generateWordPair(categoria?: string): Promise<ParPalavra> {
  try {
    const cat = categoria || 'variado'

    const prompt = `Você é um especialista em cultura jovem brasileira, TikTok BR, trends, memes e humor nacional.

Crie um par de palavras para o jogo "Impostor" (estilo Among Us de palavras), voltado para jovens brasileiros de 16-25 anos.

REGRAS DO PAR:
- As duas palavras devem ser do MESMO universo/contexto para confundir
- Similares o suficiente para o impostor conseguir se passar por inocente
- Diferentes o suficiente para o impostor se entregar se não souber
- Evite palavras muito óbvias ou muito difíceis
- Use referências ATUAIS do Brasil: TikTok, Instagram, funk, pagode, BBB, reality shows, comidas, gírias, celebridades BR, futebol, etc.

Categoria: ${cat}

Exemplos do nível certo:
- inocente: "curtida" / impostor: "salvo" (ambos são interações do Instagram mas diferentes)
- inocente: "Luva de Pedreiro" / impostor: "Cazé TV" (criadores BR mas diferentes)
- inocente: "coxinha" / impostor: "quibe" (salgados parecidos)
- inocente: "pisadinha" / impostor: "brega funk" (ritmos parecidos)
- inocente: "Palmeiras" / impostor: "Corinthians" (rivais do mesmo estado)
- inocente: "Kwai" / impostor: "TikTok" (apps de vídeo curto)
- inocente: "pix" / impostor: "ted" (formas de transferência)

Responda APENAS com JSON válido, sem texto extra:
{"inocente": "palavra1", "impostor": "palavra2"}`

    const raw = await callGemini(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const obj = JSON.parse(clean)

    if (!obj.inocente || !obj.impostor) throw new Error('Invalid response')
    return { categoria: cat, inocente: obj.inocente, impostor: obj.impostor }
  } catch {
    const filtered = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
    const pool = filtered.length > 0 ? filtered : paresPalavras
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export async function generateQuestionPair(categoria?: string): Promise<PerguntaBase> {
  try {
    const cat = categoria || 'variado'

    const prompt = `Você é um especialista em cultura jovem brasileira, TikTok BR, memes e humor nacional.

Crie um par de perguntas para o jogo "Impostor", voltado para jovens brasileiros de 16-25 anos.

REGRAS DO PAR:
- As perguntas devem começar com "Quantos" ou "Quantas"
- Devem ser do MESMO tema mas com pequena variação para confundir
- A variante (do impostor) deve ser parecida mas gerar respostas diferentes
- Devem ser divertidas, levemente constrangedoras mas não ofensivas
- Use referências da vida real de jovens BR: redes sociais, relacionamentos, festas, comida, dinheiro, etc.

Categoria: ${cat}

Exemplos do nível certo:
- normal: "Quantas horas por dia você passa no TikTok?" / variante: "Quantas horas por dia você passa no Instagram?"
- normal: "Quantas vezes você stalkeou seu ex esse mês?" / variante: "Quantas vezes você bloqueou seu ex esse mês?"
- normal: "Quantos reais você gastou em ifood esse mês?" / variante: "Quantos reais você gastou em uber esse mês?"
- normal: "Quantas músicas do seu artista favorito você sabe de cor?" / variante: "Quantas músicas você skipou do seu artista favorito?"
- normal: "Quantas vezes você desmarcou um role esse ano?" / variante: "Quantas vezes te desmarcaram de um role esse ano?"

Responda APENAS com JSON válido, sem texto extra:
{"normal": "pergunta para inocentes", "variante": "pergunta para o impostor"}`

    const raw = await callGemini(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const obj = JSON.parse(clean)

    if (!obj.normal || !obj.variante) throw new Error('Invalid response')
    return { categoria: cat, normal: obj.normal, variante: obj.variante }
  } catch {
    const filtered = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
    const pool = filtered.length > 0 ? filtered : perguntasBase
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export function getStaticWordPair(categoria?: string): ParPalavra {
  const filtered = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
  const pool = filtered.length > 0 ? filtered : paresPalavras
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getStaticQuestionPair(categoria?: string): PerguntaBase {
  const filtered = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
  const pool = filtered.length > 0 ? filtered : perguntasBase
  return pool[Math.floor(Math.random() * pool.length)]
}
