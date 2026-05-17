"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Player, Round, Answer } from "@/lib/game-types"

interface RoomState {
  room: {
    id: string
    code: string
    host_id: string
    status: string
    mode: string
    categories: string[]
    max_players: number
    current_round: number
  } | null
  players: Player[]
  currentRound: Round | null
  votes: { voter_id: string; voted_for: string }[]
  answers: Answer[]
}

export function useRoom(code: string) {
  const [state, setState] = useState<RoomState>({
    room: null, players: [], currentRound: null, votes: [], answers: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabaseRef = useRef(createClient())

  const fetchRoom = useCallback(async () => {
    const supabase = supabaseRef.current

    const { data: room, error: roomError } = await supabase
      .from("rooms").select("*").eq("code", code).single()

    if (roomError || !room) {
      setError("Sala não encontrada")
      setLoading(false)
      return
    }

    const { data: players } = await supabase
      .from("players").select("*").eq("room_id", room.id).order("joined_at")

    let currentRound: Round | null = null
    let votes: { voter_id: string; voted_for: string }[] = []
    let answers: Answer[] = []

    if (room.current_round > 0) {
      const { data: round } = await supabase
        .from("rounds").select("*").eq("room_id", room.id)
        .eq("round_number", room.current_round).single()

      if (round) {
        currentRound = round

        const [{ data: voteData }, { data: answerData }] = await Promise.all([
          supabase.from("votes").select("voter_id, voted_for").eq("round_id", round.id),
          supabase.from("answers").select("round_id, player_id, answer").eq("round_id", round.id),
        ])

        votes = voteData || []
        answers = answerData || []
      }
    }

    setState({ room, players: players || [], currentRound, votes, answers })
    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchRoom()
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`room-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, () => fetchRoom())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => fetchRoom())
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, () => fetchRoom())
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => fetchRoom())
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, () => fetchRoom())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [code, fetchRoom])

  return { ...state, loading, error, refetch: fetchRoom }
}
