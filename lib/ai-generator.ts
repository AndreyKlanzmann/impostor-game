import { generateObject } from 'ai'
import { z } from 'zod'
import { paresPalavras, type ParPalavra } from '@/lib/pares-palavras'
import { perguntasBase, type PerguntaBase } from '@/lib/perguntas-base'

const wordPairSchema = z.object({
  inocente: z.string().describe('A palavra do inocente'),
  impostor: z.string().describe('A palavra do impostor, similar mas diferente'),
})

const questionPairSchema = z.object({
  normal: z.string().describe('A pergunta normal (para inocentes)'),
  variante: z.string().describe('A variante da pergunta (para o impostor)'),
})

export async function generateWordPair(categoria?: string): Promise<ParPalavra> {
  try {
    const cat = categoria || 'variado'
    const { object } = await generateObject({
      model: 'groq/llama-3.3-70b-versatile',
      schema: wordPairSchema,
      prompt: `Voce e um criador de conteudo brasileiro expert em humor de TikTok, memes e cultura jovem BR.

Gere um par de palavras para o jogo Impostor (estilo Among Us de palavras).
As duas palavras devem ser PARECIDAS o suficiente para confundir, mas DIFERENTES o suficiente para o impostor se entregar.

Categoria: ${cat}

Exemplos do estilo que queremos:
- inocente: "coxinha" / impostor: "pastel"
- inocente: "TikTok" / impostor: "Reels"
- inocente: "BBB" / impostor: "A Fazenda"
- inocente: "stalkear ex" / impostor: "stalkear crush"

Use linguagem informal brasileira. Pense em coisas do dia a dia de jovens BR (redes sociais, comida, roles, memes, trends).
NAO repita pares que ja existem. Seja criativo e engracado.`,
    })

    return { categoria: cat, inocente: object.inocente, impostor: object.impostor }
  } catch {
    // Fallback to static data
    const filtered = categoria
      ? paresPalavras.filter(p => p.categoria === categoria)
      : paresPalavras
    const pool = filtered.length > 0 ? filtered : paresPalavras
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export async function generateQuestionPair(categoria?: string): Promise<PerguntaBase> {
  try {
    const cat = categoria || 'variado'
    const { object } = await generateObject({
      model: 'groq/llama-3.3-70b-versatile',
      schema: questionPairSchema,
      prompt: `Voce e um criador de conteudo brasileiro expert em humor de TikTok e cultura jovem BR.

Gere um par de perguntas para o jogo Impostor (estilo "quantos/quantas").
As perguntas devem ser PARECIDAS para confundir, mas com RESPOSTAS potencialmente diferentes.
Ambas devem comecar com "Quantos" ou "Quantas".

Categoria: ${cat}

Exemplos do estilo:
- normal: "Quantas horas por dia voce passa no TikTok?" / variante: "Quantas horas por dia voce passa no Instagram?"
- normal: "Quantos crushes voce teve este ano?" / variante: "Quantos crushes voce bloqueou este ano?"
- normal: "Quantas festas voce foi neste ano?" / variante: "Quantas vezes voce desmarcou role neste ano?"

Use linguagem informal, engracada e cultura brasileira jovem.
As perguntas devem ser engracadas/constrangedoras mas nao ofensivas.`,
    })

    return { categoria: cat, normal: object.normal, variante: object.variante }
  } catch {
    // Fallback to static data
    const filtered = categoria
      ? perguntasBase.filter(p => p.categoria === categoria)
      : perguntasBase
    const pool = filtered.length > 0 ? filtered : perguntasBase
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

export function getStaticWordPair(categoria?: string): ParPalavra {
  const filtered = categoria
    ? paresPalavras.filter(p => p.categoria === categoria)
    : paresPalavras
  const pool = filtered.length > 0 ? filtered : paresPalavras
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getStaticQuestionPair(categoria?: string): PerguntaBase {
  const filtered = categoria
    ? perguntasBase.filter(p => p.categoria === categoria)
    : perguntasBase
  const pool = filtered.length > 0 ? filtered : perguntasBase
  return pool[Math.floor(Math.random() * pool.length)]
}
