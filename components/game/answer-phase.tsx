"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Player, Round, Answer } from "@/lib/game-types"

interface AnswerPhaseProps {
  round: Round
  players: Player[]
  playerId: string
  answers: Answer[]
  onSubmitAnswer: (answer: string) => void
  onAdvanceToVoting: () => void
  onGoHome: () => void
  isHost: boolean
  loading: boolean
}

export function AnswerPhase({ round, players, playerId, answers, onSubmitAnswer, onAdvanceToVoting, onGoHome, isHost, loading }: AnswerPhaseProps) {
  const [answer, setAnswer] = useState("")
  const hasAnswered = answers.some(a => a.player_id === playerId)

  // Embaralha as respostas para não revelar ordem de quem é quem
  const shuffledAnswers = [...answers].sort(() => Math.random() - 0.5)

  const getPlayerName = (id: string) => players.find(p => p.player_id === id)?.name ?? "?"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4"
    >
      <div className="flex gap-2 flex-wrap justify-center">
        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono uppercase">
          Rodada {round.round_number}
        </span>
        {round.ai_generated && (
          <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-mono">✨ IA</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Fase: digitando resposta */}
        {!hasAnswered && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4 w-full">
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Sua pergunta</p>
              <p className="text-base font-medium text-foreground">{round.question_normal}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Sua resposta</label>
              <Input
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && answer.trim() && onSubmitAnswer(answer)}
                placeholder="Digite sua resposta..."
                maxLength={80}
                autoFocus
              />
            </div>

            <Button
              onClick={() => onSubmitAnswer(answer)}
              disabled={!answer.trim() || loading}
              className="w-full h-12"
            >
              {loading ? "Enviando..." : "Enviar resposta"}
            </Button>

            <div className="bg-secondary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">
                {answers.length}/{players.length} responderam
              </p>
              <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(answers.length / players.length) * 100}%` }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Fase: aguardando outros */}
        {hasAnswered && answers.length < players.length && (
          <motion.div key="waiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 text-center py-4">
            <div className="text-4xl">✅</div>
            <p className="text-primary font-semibold text-lg">Resposta enviada!</p>
            <p className="text-sm text-muted-foreground">Aguardando os outros...</p>
            <div className="w-full bg-secondary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center mb-1.5">
                {answers.length}/{players.length} responderam
              </p>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  animate={{ width: `${(answers.length / players.length) * 100}%` }}
                  transition={{ duration: 0.4 }} />
              </div>
            </div>
            <div className="flex gap-1 justify-center mt-2">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Fase: todos responderam — mostra respostas */}
        {hasAnswered && answers.length >= players.length && (
          <motion.div key="reveal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 w-full">

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Pergunta dos inocentes</p>
              <p className="text-base font-semibold text-foreground">{round.question_normal}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Todas as respostas ({shuffledAnswers.length})
              </p>
              <div className="flex flex-col gap-2">
                {shuffledAnswers.map((a, i) => (
                  <motion.div key={a.player_id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                      a.player_id === playerId ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
                    }`}>
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{a.answer}</p>
                      <p className="text-xs text-muted-foreground">{getPlayerName(a.player_id)}{a.player_id === playerId ? " (você)" : ""}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {isHost && (
              <Button onClick={onAdvanceToVoting} className="w-full h-12">
                Ir para votação →
              </Button>
            )}
            {!isHost && (
              <p className="text-sm text-muted-foreground text-center">
                Aguardando o host iniciar a votação...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {isHost ? (
        <button onClick={onGoHome}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}
          className="text-xs text-muted-foreground underline px-4 py-2 bg-background/80 rounded-full">
          ← Voltar ao lobby
        </button>
      ) : (
        <p style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}
          className="text-xs text-muted-foreground px-4 py-2 bg-background/80 rounded-full">
          Só o host pode voltar ao lobby
        </p>
      )}
    </motion.div>
  )
}
