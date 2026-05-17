import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { customAlphabet } from 'nanoid'

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export async function POST(request: Request) {
  try {
    const { hostName, mode, categories } = await request.json()

    if (!hostName || !mode) {
      return NextResponse.json({ error: 'Nome e modo sao obrigatorios' }, { status: 400 })
    }

    const supabase = await createClient()
    const code = generateCode()
    const hostId = crypto.randomUUID()

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: hostId,
        status: 'waiting',
        mode,
        categories: categories || [],
        max_players: 8,
        current_round: 0,
      })
      .select()
      .single()

    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 500 })
    }

    // Add host as first player
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        player_id: hostId,
        name: hostName,
        is_host: true,
        score: 0,
      })

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 })
    }

    return NextResponse.json({ room, playerId: hostId })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
