"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/game-types"

interface LobbyProps {
  code: string
  players: Player[]
  isHost: boolean
  mode: string
  onStart: () => void
  loading: boolean
}

export function Lobby({ code, players, isHost, mode, onStart, loading }: LobbyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Codigo da sala</p>
        <h2 className="text-4xl font-mono font-bold tracking-widest text-primary">
          {code}
        </h2>
        <p className="text-xs text-muted-foreground mt-2">
          Compartilhe com seus amigos
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono uppercase">
          {mode === "palavra" ? "PALAVRA" : "PERGUNTA"}
        </span>
        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono">
          {players.length}/8
        </span>
      </div>

      <div className="w-full">
        <h3 className="text-sm text-muted-foreground mb-3">Jogadores</h3>
        <div className="flex flex-col gap-2">
          {players.map((player, i) => (
            <motion.div
              key={player.player_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-foreground font-medium flex-1">{player.name}</span>
              {player.is_host && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="w-full flex flex-col gap-2">
          <Button
            onClick={onStart}
            disabled={players.length < 3 || loading}
            className="w-full h-12 text-base"
          >
            {loading ? "Gerando rodada..." : `Iniciar Rodada (min 3)`}
          </Button>
          {players.length < 3 && (
            <p className="text-xs text-muted-foreground text-center">
              Aguardando mais jogadores...
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Aguardando o host iniciar o jogo...
          </p>
          <div className="mt-3 flex gap-1 justify-center">
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
    </motion.div>
  )
}
