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
}

export function GamePlay({ round, players, playerId, onAdvanceToVoting, onGoHome, isHost }: GamePlayProps) {
  const [revealed, setRevealed] = useState(false)

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

  const getMyContent = () => {
    const isImpostor = round.impostor_ids.includes(playerId)
    if (mode === "palavra") return isImpostor ? round.word_impostor : round.word_innocent
    return isImpostor ? round.question_impostor : round.question_normal
  }

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
          <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-mono">
            ✨ IA
          </span>
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

      <div className="w-full mt-1">
        <p className="text-xs text-muted-foreground text-center mb-3">
          {players.length} jogadores · {round.impostor_ids.length} impostor{round.impostor_ids.length > 1 ? "es" : ""}
        </p>
        <Button variant="ghost" onClick={onGoHome} className="w-full text-muted-foreground">
          ← Sair da sala
        </Button>
      </div>
    </motion.div>
  )
}
