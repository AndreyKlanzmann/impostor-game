"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useRoom } from "@/hooks/use-room"
import { Lobby } from "@/components/game/lobby"
import { GamePlay } from "@/components/game/game-play"
import { AnswerPhase } from "@/components/game/answer-phase"
import { Voting } from "@/components/game/voting"
import { RoundResult } from "@/components/game/round-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string)?.toUpperCase()

  const [playerId, setPlayerId] = useState<string>("")
  const [actionLoading, setActionLoading] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [localMode, setLocalMode] = useState<string | null>(null)
  const [needsName, setNeedsName] = useState<boolean | null>(null) // null = ainda verificando
  const [nameInput, setNameInput] = useState("")
  const [joinError, setJoinError] = useState("")
  const [joining, setJoining] = useState(false)

  // useRoom sempre roda com o code real — o hook já tem guard interno
  const { room, players, currentRound, votes, answers, loading, error, refetch } = useRoom(code)

  useEffect(() => {
    const storedId = sessionStorage.getItem("playerId")
    if (storedId) {
      setPlayerId(storedId)
      setNeedsName(false)
    } else {
      setNeedsName(true)
    }
  }, [])

  useEffect(() => {
    if (votes && playerId) setHasVoted(votes.some(v => v.voter_id === playerId))
  }, [votes, playerId])

  useEffect(() => {
    if (currentRound?.status === "revealing") setHasVoted(false)
  }, [currentRound?.id, currentRound?.status])

  const isHost = room?.host_id === playerId

  const handleJoinByLink = useCallback(async () => {
    if (!nameInput.trim()) return
    setJoining(true)
    setJoinError("")
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, playerName: nameInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      sessionStorage.setItem("playerId", data.playerId)
      sessionStorage.setItem("playerName", nameInput.trim())
      setPlayerId(data.playerId)
      setNeedsName(false)
      // Refetch explícito para garantir que o jogador aparece imediatamente
      await refetch()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Erro ao entrar na sala")
    } finally {
      setJoining(false)
    }
  }, [code, nameInput, refetch])

  const handleGoHome = useCallback(() => {
    sessionStorage.removeItem("playerId")
    sessionStorage.removeItem("playerName")
    router.push("/")
  }, [router])

  const handleGoLobby = useCallback(async () => {
    if (!room || !isHost) return
    await fetch("/api/rooms/return-lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, playerId }),
    })
  }, [room, playerId, isHost])

  const handleStartRound = useCallback(async (customTheme?: string) => {
    if (!room) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/rooms/start-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId, customTheme }),
      })
      if (!res.ok) console.error("Start round error:", (await res.json()).error)
    } finally {
      setActionLoading(false)
    }
  }, [room, playerId])

  const handleChangeMode = useCallback((mode: string) => {
    if (!room) return
    setLocalMode(mode)
    fetch("/api/rooms/update-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, playerId, mode }),
    })
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

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentRound) return
    setActionLoading(true)
    try {
      await fetch("/api/rooms/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: currentRound.id, playerId, answer }),
      })
    } finally {
      setActionLoading(false)
    }
  }, [currentRound, playerId])

  const handleVote = useCallback(async (votedFor: string) => {
    if (!currentRound) return
    setActionLoading(true)
    try {
      await fetch("/api/rooms/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: currentRound.id, voterId: playerId, votedFor }),
      })
      setHasVoted(true)
    } finally {
      setActionLoading(false)
    }
  }, [currentRound, playerId])

  // Ainda verificando se tem sessão salva
  if (needsName === null) return null

  // Tela de entrada via link direto
  if (needsName) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col gap-5"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Entrando na sala</p>
            <h2 className="text-4xl font-mono font-bold tracking-widest text-primary">{code}</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Seu nome</label>
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoinByLink()}
                placeholder="Ex: João"
                maxLength={20}
                autoFocus
              />
            </div>
            {joinError && <p className="text-destructive text-sm text-center">{joinError}</p>}
            <Button
              onClick={handleJoinByLink}
              disabled={!nameInput.trim() || joining}
              className="w-full h-12 text-base"
            >
              {joining ? "Entrando..." : "Entrar na sala →"}
            </Button>
            <Button variant="ghost" onClick={handleGoHome} className="w-full">
              ← Voltar ao menu
            </Button>
          </div>
        </motion.div>
      </main>
    )
  }

  if (loading) return (
    <main className="min-h-dvh flex items-center justify-center">
      <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-3 h-3 rounded-full bg-primary"
            animate={{ y: [0, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </motion.div>
    </main>
  )

  if (error) return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-destructive text-lg">{error}</p>
        <button onClick={() => router.push("/")} className="mt-4 text-primary underline">Voltar ao início</button>
      </div>
    </main>
  )

  const currentMode = localMode ?? room?.mode ?? "palavra"

  const gamePhase = (() => {
    if (!room) return "loading"
    if (room.status === "waiting" || !currentRound) return "lobby"
    if (currentRound.status === "revealing" || currentRound.status === "debate") return "playing"
    if (currentRound.status === "answers") return "answers"
    if (currentRound.status === "voting") return "voting"
    if (currentRound.status === "result") return "result"
    return "lobby"
  })()

  return (
    <main className="min-h-dvh flex items-center justify-center py-8">
      <AnimatePresence mode="wait">
        {gamePhase === "lobby" && (
          <Lobby key="lobby" code={code} players={players} isHost={isHost}
            mode={currentMode} onStart={(theme) => handleStartRound(theme)}
            onGoHome={handleGoHome} onChangeMode={handleChangeMode} loading={actionLoading} />
        )}

        {gamePhase === "playing" && currentRound && (
          <GamePlay key={`play-${currentRound.id}`} round={currentRound} players={players}
            playerId={playerId} isHost={isHost} isLocalMode={false}
            onAdvanceToVoting={() => {
              if (currentRound.status === "revealing") {
                if (currentMode === "pergunta") handleAdvanceRound("answers")
                else handleAdvanceRound("debate")
              } else {
                handleAdvanceRound("voting")
              }
            }}
            onGoHome={handleGoLobby} />
        )}

        {gamePhase === "answers" && currentRound && (
          <AnswerPhase key={`answers-${currentRound.id}`} round={currentRound} players={players}
            playerId={playerId} answers={answers} isHost={isHost}
            onSubmitAnswer={handleSubmitAnswer}
            onAdvanceToVoting={() => handleAdvanceRound("voting")}
            onGoHome={handleGoLobby} loading={actionLoading} />
        )}

        {gamePhase === "voting" && currentRound && (
          <Voting key={`vote-${currentRound.id}`} players={players} playerId={playerId}
            isHost={isHost} onVote={handleVote} onGoHome={handleGoLobby}
            votesCount={votes.length} totalPlayers={players.length}
            hasVoted={hasVoted} loading={actionLoading} />
        )}

        {gamePhase === "result" && currentRound && (
          <RoundResult key={`result-${currentRound.id}`} round={currentRound} players={players}
            votes={votes} isHost={isHost} onNextRound={handleStartRound} onGoHome={handleGoLobby} />
        )}
      </AnimatePresence>
    </main>
  )
}
