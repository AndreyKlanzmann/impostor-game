import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { roomId, playerId } = await request.json()

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!room || room.host_id !== playerId) {
      return NextResponse.json({ error: 'Apenas o host pode voltar ao lobby' }, { status: 403 })
    }

    // Volta o status da sala para waiting — todos os clientes detectam via Realtime
    await supabase.from('rooms').update({ status: 'waiting' }).eq('id', roomId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
