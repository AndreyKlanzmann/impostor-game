"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/game-types"

interface VotingProps {
  players: Player[]
  playerId: string
  onVote: (votedFor: string) => void
  onGoHome: () => void
  votesCount: number
  totalPlayers: number
  hasVoted: boolean
  loading: boolean
}

export function Voting({ players, playerId, onVote, onGoHome, votesCount, totalPlayers, hasVoted, loading }: VotingProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const otherPlayers = players.filter(p => p.player_id !== playerId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">🗳️ Votação</h2>
        <p className="text-sm text-muted-foreground mt-1">Quem você acha que é o impostor?</p>
      </div>

      {!hasVoted ? (
        <>
          <div className="w-full flex flex-col gap-2">
            {otherPlayers.map((player, i) => (
              <motion.button
                key={player.player_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(player.player_id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all border-2 text-left ${
                  selected === player.player_id
                    ? "border-destructive bg-destructive/10 scale-[1.02]"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-foreground font-medium flex-1">{player.name}</span>
                {selected === player.player_id && <span className="text-destructive text-lg">👈</span>}
              </motion.button>
            ))}
          </div>

          <Button
            onClick={() => selected && onVote(selected)}
            disabled={!selected || loading}
            className="w-full h-12"
            variant="destructive"
          >
            {loading ? "Votando..." : selected ? `Votar em ${players.find(p => p.player_id === selected)?.name}` : "Selecione alguém"}
          </Button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="text-4xl mb-3">✅</div>
          <p className="text-primary font-semibold text-lg">Voto registrado!</p>
          <p className="text-sm text-muted-foreground mt-2">Aguardando outros jogadores...</p>
          <div className="mt-4 flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      <div className="w-full bg-secondary/30 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Votos recebidos</span>
          <span className="text-xs font-mono font-bold">{votesCount}/{totalPlayers}</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(votesCount / totalPlayers) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <Button variant="ghost" onClick={onGoHome} className="w-full text-muted-foreground">
        ← Sair da sala
      </Button>
    </motion.div>
  )
}
