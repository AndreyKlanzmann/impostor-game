"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player, Round } from "@/lib/game-types"

interface GamePlayProps {
  round: Round
  players: Player[]
  playerId: string
  onAdvanceToVoting: () => void
  isHost: boolean
}

export function GamePlay({ round, players, playerId, onAdvanceToVoting, isHost }: GamePlayProps) {
  const [revealed, setRevealed] = useState(false)

  const isImpostor = round.impostor_ids.includes(playerId)
  const mode = round.word_innocent ? "palavra" : "pergunta"

  const getMyContent = () => {
    if (mode === "palavra") {
      return isImpostor ? round.word_impostor : round.word_innocent
    } else {
      return isImpostor ? round.question_impostor : round.question_normal
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <div className="flex gap-2">
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
            IA
          </span>
        )}
      </div>

      {!revealed ? (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <p className="text-muted-foreground text-center text-sm">
            Toque para ver sua {mode === "palavra" ? "palavra" : "pergunta"}
          </p>
          <Button
            size="lg"
            className="h-20 w-64 text-lg"
            onClick={() => setRevealed(true)}
          >
            Revelar
          </Button>
          <p className="text-xs text-muted-foreground">
            Esconda a tela antes de mostrar!
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={`text-center p-6 rounded-2xl border-2 w-full ${
            isImpostor
              ? "border-destructive bg-destructive/10"
              : "border-primary bg-primary/10"
          }`}>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
              {isImpostor ? "Voce e o IMPOSTOR" : mode === "palavra" ? "Sua palavra" : "Sua pergunta"}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {getMyContent()}
            </p>
            {isImpostor && (
              <p className="text-xs text-destructive mt-3">
                Tente se passar por inocente!
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={() => setRevealed(false)}
            className="text-sm"
          >
            Esconder
          </Button>
        </motion.div>
      )}

      {round.status === "revealing" && isHost && (
        <div className="mt-4 w-full">
          <Button
            onClick={onAdvanceToVoting}
            className="w-full h-12"
            variant="secondary"
          >
            Todos viram? Ir para debate
          </Button>
        </div>
      )}

      {round.status === "debate" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center w-full"
        >
          <div className="bg-secondary/50 rounded-xl p-4">
            <p className="text-lg font-semibold text-foreground mb-2">Hora do debate!</p>
            <p className="text-sm text-muted-foreground">
              {mode === "palavra"
                ? "Discutam! Tentem descobrir quem tem a palavra diferente."
                : "Cada um responde sua pergunta em voz alta. O impostor tem uma pergunta DIFERENTE!"}
            </p>
          </div>
          {isHost && (
            <Button
              onClick={onAdvanceToVoting}
              className="w-full h-12 mt-4"
            >
              Ir para votacao
            </Button>
          )}
        </motion.div>
      )}

      <div className="w-full mt-2">
        <p className="text-xs text-muted-foreground text-center">
          {players.length} jogadores | {round.impostor_ids.length} impostor{round.impostor_ids.length > 1 ? "es" : ""}
        </p>
      </div>
    </motion.div>
  )
}
