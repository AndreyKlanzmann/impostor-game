import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { roundId, voterId, votedFor } = await request.json()

    if (!roundId || !voterId || !votedFor) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check round exists and is in voting state
    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('id', roundId)
      .single()

    if (!round) {
      return NextResponse.json({ error: 'Rodada nao encontrada' }, { status: 404 })
    }

    // Cast vote (upsert to allow changing vote)
    const { error: voteError } = await supabase
      .from('votes')
      .upsert(
        { round_id: roundId, voter_id: voterId, voted_for: votedFor },
        { onConflict: 'round_id,voter_id' }
      )

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 })
    }

    // Count votes
    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('round_id', roundId)

    // Get player count for this room
    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', round.room_id)

    const allVoted = (votes?.length ?? 0) >= (playerCount ?? 0)

    if (allVoted && votes) {
      // Tally votes
      const tally: Record<string, number> = {}
      votes.forEach(v => {
        tally[v.voted_for] = (tally[v.voted_for] || 0) + 1
      })

      // Find who got the most votes
      const maxVotes = Math.max(...Object.values(tally))
      const mostVoted = Object.keys(tally).filter(k => tally[k] === maxVotes)

      // Check if an impostor was caught
      const impostorCaught = mostVoted.some(id => round.impostor_ids.includes(id))

      // Update scores
      if (impostorCaught) {
        // Innocents win: +1 to all innocents
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', round.room_id)

        if (players) {
          const innocents = players.filter(p => !round.impostor_ids.includes(p.player_id))
          for (const p of innocents) {
            await supabase
              .from('players')
              .update({ score: p.score + 1 })
              .eq('id', p.id)
          }
        }
      } else {
        // Impostor wins: +2 to impostors
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', round.room_id)

        if (players) {
          const impostors = players.filter(p => round.impostor_ids.includes(p.player_id))
          for (const p of impostors) {
            await supabase
              .from('players')
              .update({ score: p.score + 2 })
              .eq('id', p.id)
          }
        }
      }

      // Update round status
      await supabase
        .from('rounds')
        .update({ status: 'result' })
        .eq('id', roundId)

      return NextResponse.json({
        allVoted: true,
        result: { mostVoted, impostorCaught, tally, impostorIds: round.impostor_ids },
      })
    }

    return NextResponse.json({ allVoted: false, votesCount: votes?.length ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
