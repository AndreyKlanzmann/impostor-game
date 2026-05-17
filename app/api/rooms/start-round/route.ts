import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWordPair, generateQuestionPair, getStaticWordPair, getStaticQuestionPair } from '@/lib/ai-generator'

export async function POST(request: Request) {
  try {
    const { roomId, playerId } = await request.json()

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'roomId e playerId sao obrigatorios' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify host
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!room || room.host_id !== playerId) {
      return NextResponse.json({ error: 'Apenas o host pode iniciar a rodada' }, { status: 403 })
    }

    // Get players
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at')

    if (!players || players.length < 3) {
      return NextResponse.json({ error: 'Minimo de 3 jogadores' }, { status: 400 })
    }

    // Calculate impostors: 1 for 3-5, 2 for 6-8
    const impostorCount = players.length >= 6 ? 2 : 1
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const impostorIds = shuffled.slice(0, impostorCount).map(p => p.player_id)

    const newRound = room.current_round + 1
    const categoria = room.categories.length > 0
      ? room.categories[Math.floor(Math.random() * room.categories.length)]
      : undefined

    let wordInnocent: string | null = null
    let wordImpostor: string | null = null
    let questionNormal: string | null = null
    let questionImpostor: string | null = null
    let aiGenerated = false

    if (room.mode === 'palavra') {
      // Try AI first, fallback to static
      try {
        const pair = await generateWordPair(categoria)
        wordInnocent = pair.inocente
        wordImpostor = pair.impostor
        aiGenerated = true
      } catch {
        const pair = getStaticWordPair(categoria)
        wordInnocent = pair.inocente
        wordImpostor = pair.impostor
      }
    } else {
      try {
        const pair = await generateQuestionPair(categoria)
        questionNormal = pair.normal
        questionImpostor = pair.variante
        aiGenerated = true
      } catch {
        const pair = getStaticQuestionPair(categoria)
        questionNormal = pair.normal
        questionImpostor = pair.variante
      }
    }

    // Create round
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        room_id: roomId,
        round_number: newRound,
        impostor_ids: impostorIds,
        word_innocent: wordInnocent,
        word_impostor: wordImpostor,
        question_normal: questionNormal,
        question_impostor: questionImpostor,
        category: categoria || null,
        ai_generated: aiGenerated,
        status: 'revealing',
      })
      .select()
      .single()

    if (roundError) {
      return NextResponse.json({ error: roundError.message }, { status: 500 })
    }

    // Update room status and round count
    await supabase
      .from('rooms')
      .update({ status: 'playing', current_round: newRound })
      .eq('id', roomId)

    return NextResponse.json({ round })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
