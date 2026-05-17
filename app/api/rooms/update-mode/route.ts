import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { roomId, playerId, mode } = await request.json()

    if (!roomId || !playerId || !mode) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!room || room.host_id !== playerId) {
      return NextResponse.json({ error: 'Apenas o host pode mudar o modo' }, { status: 403 })
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Não é possível mudar o modo durante o jogo' }, { status: 400 })
    }

    await supabase
      .from('rooms')
      .update({ mode })
      .eq('id', roomId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
