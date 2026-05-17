"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player, Round } from "@/lib/game-types"

interface GamePlayProps {
  round: Round
  players: Player[]
  playerId: string
  onAdvanceToVoting: () => void
  onGoHome: () => void
  isHost: boolean
  isLocalMode: boolean
}

export function GamePlay({ round, players, playerId, onAdvanceToVoting, onGoHome, isHost, isLocalMode }: GamePlayProps) {
  const [revealed, setRevealed] = useState(false)
  // Modo local: índice do jogador atual na sequência de revelação
  const [localIndex, setLocalIndex] = useState(0)
  const [localDone, setLocalDone] = useState(false)

  const mode = round.word_innocent ? "palavra" : "pergunta"

  const debateOrder = useMemo(() => {
    const shuffled = [...players]
    let seed = round.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      const j = Math.abs(seed) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [players, round.id])

  // Ordem local = mesma ordem embaralhada do debate
  const localOrder = debateOrder

  const getContentForPlayer = (player: Player) => {
    const isImpostor = round.impostor_ids.includes(player.player_id)
    if (mode === "palavra") return isImpostor ? round.word_impostor : round.word_innocent
    return isImpostor ? round.question_impostor : round.question_normal
  }

  const getMyContent = () => {
    const isImpostor = round.impostor_ids.includes(playerId)
    if (mode === "palavra") return isImpostor ? round.word_impostor : round.word_innocent
    return isImpostor ? round.question_impostor : round.question_normal
  }

  const handleNextLocal = () => {
    setRevealed(false)
    if (localIndex + 1 >= localOrder.length) {
      setLocalDone(true)
    } else {
      setLocalIndex(localIndex + 1)
    }
  }

  // ── MODO LOCAL ──────────────────────────────────────────────
  if (isLocalMode && !localDone) {
    const currentPlayer = localOrder[localIndex]
    const isLast = localIndex === localOrder.length - 1

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
      >
        <div className="flex gap-2 flex-wrap justify-center">
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono uppercase">
            Rodada {round.round_number}
          </span>
          {round.ai_generated && (
            <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-mono">✨ IA</span>
          )}
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono">
            {localIndex + 1}/{localOrder.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div className="text-center bg-secondary/30 rounded-2xl p-8 w-full">
                <p className="text-sm text-muted-foreground mb-2">Vez de</p>
                <p className="text-3xl font-bold text-foreground">{currentPlayer.name}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Todos fechem os olhos! 👀
                </p>
              </div>
              <Button
                size="lg"
                className="h-16 w-full text-base"
                onClick={() => setRevealed(true)}
              >
                {currentPlayer.name} está pronto → Mostrar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="showing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              <div className="text-center p-6 rounded-2xl border-2 border-primary bg-primary/10 w-full">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  {currentPlayer.name} — sua {mode === "palavra" ? "palavra" : "pergunta"}
                </p>
                <p className={`font-bold text-foreground mt-2 ${mode === "palavra" ? "text-3xl" : "text-xl"}`}>
                  {getContentForPlayer(currentPlayer)}
                </p>
              </div>
              <Button
                className="w-full h-14"
                variant="secondary"
                onClick={handleNextLocal}
              >
                {isLast ? "Todos viram! → Iniciar debate" : `Próximo: ${localOrder[localIndex + 1].name} →`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onGoHome}
          style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
          className="text-xs text-muted-foreground underline underline-offset-2 px-4 py-2"
        >
          ← Sair da sala
        </button>
      </motion.div>
    )
  }

  // ── MODO LOCAL — fase debate (todos já viram) ────────────────
  if (isLocalMode && localDone && round.status === "revealing" && isHost) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
      >
        <div className="text-center bg-secondary/30 rounded-2xl p-8 w-full">
          <p className="text-2xl font-bold text-foreground mb-2">✅ Todos viram!</p>
          <p className="text-sm text-muted-foreground">Hora de debater quem é o impostor.</p>
        </div>
        <Button onClick={onAdvanceToVoting} className="w-full h-12">
          Iniciar debate →
        </Button>
        <button
          onClick={onGoHome}
          style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
          className="text-xs text-muted-foreground underline underline-offset-2 px-4 py-2"
        >
          ← Sair da sala
        </button>
      </motion.div>
    )
  }

  // ── MODO MULTIPLAYER (normal) ────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <div className="flex gap-2 flex-wrap justify-center">
        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono uppercase">
          Rodada {round.round_number}
        </span>
        {round.category && (
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono uppercase">
            {round.category}
          </span>
        )}
        {round.ai_generated && (
          <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-mono">✨ IA</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="hidden"
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <p className="text-muted-foreground text-center text-sm">
              Toque para ver sua {mode === "palavra" ? "palavra" : "pergunta"}
            </p>
            <Button size="lg" className="h-20 w-64 text-lg" onClick={() => setRevealed(true)}>
              👁 Revelar
            </Button>
            <p className="text-xs text-muted-foreground">
              Esconda a tela dos outros antes de revelar!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            className="flex flex-col items-center gap-6 w-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center p-6 rounded-2xl border-2 border-primary bg-primary/10 w-full">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                {mode === "palavra" ? "Sua palavra" : "Sua pergunta"}
              </p>
              <p className={`font-bold text-foreground ${mode === "palavra" ? "text-3xl" : "text-xl"}`}>
                {getMyContent()}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setRevealed(false)} className="text-sm">
              Esconder
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {round.status === "revealing" && isHost && (
        <div className="mt-2 w-full">
          <Button onClick={onAdvanceToVoting} className="w-full h-12" variant="secondary">
            Todos viram? → Iniciar debate
          </Button>
        </div>
      )}

      {round.status === "debate" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center w-full"
        >
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-lg font-semibold text-foreground mb-3">💬 Ordem do debate</p>
            <div className="flex flex-col gap-1.5">
              {debateOrder.map((player, i) => (
                <div key={player.player_id} className="flex items-center gap-3 bg-background/50 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                  <span className={`text-sm flex-1 text-left ${player.player_id === playerId ? "font-bold text-primary" : "text-foreground"}`}>
                    {player.name}{player.player_id === playerId ? " (você)" : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {mode === "palavra"
                ? "Cada um fala sobre sua palavra. Descubram quem é diferente!"
                : "Cada um responde sua pergunta em voz alta!"}
            </p>
          </div>
          {isHost ? (
            <Button onClick={onAdvanceToVoting} className="w-full h-12 mt-4">
              Ir para votação →
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              Aguardando o host encerrar o debate...
            </p>
          )}
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {players.length} jogadores · {round.impostor_ids.length} impostor{round.impostor_ids.length > 1 ? "es" : ""}
      </p>

      <button
        onClick={onGoHome}
        style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
        className="text-xs text-muted-foreground underline underline-offset-2 px-4 py-2"
      >
        ← Sair da sala
      </button>
    </motion.div>
  )
}
