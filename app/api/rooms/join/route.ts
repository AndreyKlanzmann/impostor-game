import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { code, playerName } = await request.json()

    if (!code || !playerName) {
      return NextResponse.json({ error: 'Codigo e nome sao obrigatorios' }, { status: 400 })
    }

    const supabase = await createClient()
    const playerId = crypto.randomUUID()

    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 })
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Jogo ja comecou' }, { status: 400 })
    }

    // Check player count
    const { count } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)

    if ((count ?? 0) >= room.max_players) {
      return NextResponse.json({ error: 'Sala cheia' }, { status: 400 })
    }

    // Add player
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        player_id: playerId,
        name: playerName,
        is_host: false,
        score: 0,
      })

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 })
    }

    return NextResponse.json({ room, playerId })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
