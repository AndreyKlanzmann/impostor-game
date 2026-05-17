"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Player } from "@/lib/game-types"

interface LobbyProps {
  code: string
  players: Player[]
  isHost: boolean
  mode: string
  onStart: (customTheme?: string) => void
  onGoHome: () => void
  onChangeMode: (mode: string) => void
  loading: boolean
}

export function Lobby({ code, players, isHost, mode, onStart, onGoHome, onChangeMode, loading }: LobbyProps) {
  const [copied, setCopied] = useState(false)
  const [customTheme, setCustomTheme] = useState("")

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4 pb-16"
    >
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Código da sala</p>
        <button onClick={handleCopyCode} className="group">
          <h2 className="text-4xl font-mono font-bold tracking-widest text-primary group-hover:opacity-80 transition-opacity">
            {code}
          </h2>
          <span className="text-xs text-muted-foreground block mt-1">
            {copied ? "✓ Copiado!" : "Toque para copiar"}
          </span>
        </button>
      </div>

      {/* Modo */}
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2 text-center">Modo de jogo</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => isHost && onChangeMode("palavra")} disabled={!isHost}
            className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
              mode === "palavra" ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}>
            Palavra
          </button>
          <button onClick={() => isHost && onChangeMode("pergunta")} disabled={!isHost}
            className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
              mode === "pergunta" ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}>
            Pergunta
          </button>
        </div>
        {!isHost && <p className="text-xs text-muted-foreground text-center mt-1">Só o host pode trocar o modo</p>}
      </div>

      {/* Tema livre */}
      {isHost && (
        <div className="w-full">
          <p className="text-sm text-muted-foreground mb-2">Tema da rodada <span className="text-xs">(opcional)</span></p>
          <Input
            value={customTheme}
            onChange={e => setCustomTheme(e.target.value)}
            placeholder="Ex: Harry Potter, anos 80, futebol..."
            maxLength={50}
          />
          {customTheme.trim() && (
            <p className="text-xs text-primary mt-1.5">
              ✨ A IA vai gerar {mode === "palavra" ? "palavras" : "perguntas"} sobre "{customTheme.trim()}"
            </p>
          )}
        </div>
      )}

      {/* Jogadores */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-muted-foreground">Jogadores na sala</h3>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-mono">{players.length}/8</span>
        </div>
        <div className="flex flex-col gap-2">
          {players.map((player, i) => (
            <motion.div key={player.player_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-foreground font-medium flex-1">{player.name}</span>
              {player.score > 0 && <span className="text-xs text-muted-foreground">{player.score} pts</span>}
              {player.is_host && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>}
            </motion.div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="w-full flex flex-col gap-2">
          <Button
            onClick={() => onStart(customTheme.trim() || undefined)}
            disabled={players.length < 3 || loading}
            className="w-full h-12 text-base"
          >
            {loading
              ? "Gerando com IA... 🤖"
              : players.length < 3
                ? `Aguardando jogadores (${players.length}/3)`
                : customTheme.trim()
                  ? `Iniciar → tema "${customTheme.trim()}"`
                  : "Iniciar Rodada →"}
          </Button>
          {players.length < 3 && <p className="text-xs text-muted-foreground text-center">Precisa de pelo menos 3 jogadores</p>}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Aguardando o host iniciar o jogo...</p>
          <div className="mt-3 flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
            ))}
          </div>
        </div>
      )}

      {isHost && (
        <button onClick={onGoHome}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}
          className="text-xs text-muted-foreground underline px-4 py-2 bg-background/80 rounded-full">
          ← Sair da sala
        </button>
      )}
    </motion.div>
  )
}
