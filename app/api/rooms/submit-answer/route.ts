import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { roundId, playerId, answer } = await request.json()

    if (!roundId || !playerId || answer === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single()

    if (!round) return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 })

    // Upsert na tabela de respostas
    const { error } = await supabase
      .from('answers')
      .upsert(
        { round_id: roundId, player_id: playerId, answer: answer.trim() },
        { onConflict: 'round_id,player_id' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Conta quantos já responderam
    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', round.room_id)

    const { count: answerCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', roundId)

    const allAnswered = (answerCount ?? 0) >= (playerCount ?? 0)

    // Se todos responderam, avança para a fase de respostas
    if (allAnswered) {
      await supabase.from('rounds').update({ status: 'answers' }).eq('id', roundId)
    }

    return NextResponse.json({ allAnswered, answerCount, playerCount })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
