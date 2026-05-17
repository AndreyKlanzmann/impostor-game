"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/game-types"

interface VotingProps {
  players: Player[]
  playerId: string
  onVote: (votedFor: string) => void
  votesCount: number
  totalPlayers: number
  hasVoted: boolean
  loading: boolean
}

export function Voting({ players, playerId, onVote, votesCount, totalPlayers, hasVoted, loading }: VotingProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const otherPlayers = players.filter(p => p.player_id !== playerId)

  const handleConfirm = () => {
    if (selected) {
      onVote(selected)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Votacao</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quem voce acha que e o impostor?
        </p>
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
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all border-2 ${
                  selected === player.player_id
                    ? "border-destructive bg-destructive/10"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-foreground font-medium">{player.name}</span>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full h-12"
            variant="destructive"
          >
            {loading ? "Votando..." : "Confirmar Voto"}
          </Button>
        </>
      ) : (
        <div className="text-center">
          <p className="text-primary font-semibold">Voto registrado!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Aguardando outros jogadores... ({votesCount}/{totalPlayers})
          </p>
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
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {votesCount}/{totalPlayers} votos
      </p>
    </motion.div>
  )
}
