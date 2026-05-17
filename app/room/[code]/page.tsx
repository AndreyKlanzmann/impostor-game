"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useRoom } from "@/hooks/use-room"
import { Lobby } from "@/components/game/lobby"
import { GamePlay } from "@/components/game/game-play"
import { Voting } from "@/components/game/voting"
import { RoundResult } from "@/components/game/round-result"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string)?.toUpperCase()
  const { room, players, currentRound, votes, loading, error, refetch } = useRoom(code)
  const [playerId, setPlayerId] = useState<string>("")
  const [actionLoading, setActionLoading] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    const storedId = sessionStorage.getItem("playerId")
    if (storedId) {
      setPlayerId(storedId)
    } else {
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    if (votes && playerId) {
      setHasVoted(votes.some(v => v.voter_id === playerId))
    }
  }, [votes, playerId])

  useEffect(() => {
    if (currentRound?.status === "revealing") {
      setHasVoted(false)
    }
  }, [currentRound?.id, currentRound?.status])

  const isHost = room?.host_id === playerId

  const handleGoHome = useCallback(() => {
    sessionStorage.removeItem("playerId")
    sessionStorage.removeItem("playerName")
    router.push("/")
  }, [router])

  const handleStartRound = useCallback(async () => {
    if (!room) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/rooms/start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId }),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error("Start round error:", data.error)
      }
    } finally {
      setActionLoading(false)
    }
  }, [room, playerId])

  const handleAdvanceRound = useCallback(async (status: string) => {
    if (!currentRound) return
    setActionLoading(true)
    try {
      await fetch("/api/rooms/update-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: currentRound.id, status }),
      })
    } finally {
      setActionLoading(false)
    }
  }, [currentRound])

  const handleVote = useCallback(async (votedFor: string) => {
    if (!currentRound) return
    setActionLoading(true)
    try {
      await fetch("/api/rooms/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: currentRound.id,
          voterId: playerId,
          votedFor,
        }),
      })
      setHasVoted(true)
    } finally {
      setActionLoading(false)
    }
  }, [currentRound, playerId])

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive text-lg">{error}</p>
          <button onClick={() => router.push("/")} className="mt-4 text-primary underline">
            Voltar ao início
          </button>
        </div>
      </main>
    )
  }

  const gamePhase = (() => {
    if (!room) return "loading"
    if (room.status === "waiting" || !currentRound) return "lobby"
    if (currentRound.status === "revealing" || currentRound.status === "debate") return "playing"
    if (currentRound.status === "voting") return "voting"
    if (currentRound.status === "result") return "result"
    return "lobby"
  })()

  return (
    <main className="min-h-dvh flex items-center justify-center py-8">
      <AnimatePresence mode="wait">
        {gamePhase === "lobby" && (
          <Lobby
            key="lobby"
            code={code}
            players={players}
            isHost={isHost}
            mode={room?.mode || "palavra"}
            onStart={handleStartRound}
            onGoHome={handleGoHome}
            loading={actionLoading}
          />
        )}

        {gamePhase === "playing" && currentRound && (
          <GamePlay
            key={`play-${currentRound.id}`}
            round={currentRound}
            players={players}
            playerId={playerId}
            isHost={isHost}
            onAdvanceToVoting={() => {
              if (currentRound.status === "revealing") {
                handleAdvanceRound("debate")
              } else {
                handleAdvanceRound("voting")
              }
            }}
            onGoHome={handleGoHome}
          />
        )}

        {gamePhase === "voting" && currentRound && (
          <Voting
            key={`vote-${currentRound.id}`}
            players={players}
            playerId={playerId}
            onVote={handleVote}
            onGoHome={handleGoHome}
            votesCount={votes.length}
            totalPlayers={players.length}
            hasVoted={hasVoted}
            loading={actionLoading}
          />
        )}

        {gamePhase === "result" && currentRound && (
          <RoundResult
            key={`result-${currentRound.id}`}
            round={currentRound}
            players={players}
            votes={votes}
            isHost={isHost}
            onNextRound={handleStartRound}
            onGoHome={handleGoHome}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
