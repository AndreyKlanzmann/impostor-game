"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/game-types"

interface LobbyProps {
  code: string
  players: Player[]
  isHost: boolean
  mode: string
  isLocalMode: boolean
  onStart: () => void
  onGoHome: () => void
  onChangeMode: (mode: string) => void
  onToggleLocalMode: () => void
  loading: boolean
}

export function Lobby({ code, players, isHost, mode, isLocalMode, onStart, onGoHome, onChangeMode, onToggleLocalMode, loading }: LobbyProps) {
  const [copied, setCopied] = useState(false)

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

      {/* Modo de jogo */}
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2 text-center">Modo de jogo</p>
        <div className="flex gap-2">
          <button
            onClick={() => isHost && onChangeMode("palavra")}
            disabled={!isHost}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
              mode === "palavra"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
          >
            Palavra
          </button>
          <button
            onClick={() => isHost && onChangeMode("pergunta")}
            disabled={!isHost}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
              mode === "pergunta"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
          >
            Pergunta
          </button>
        </div>
      </div>

      {/* Modo local vs multiplayer */}
      <div className="w-full">
        <p className="text-sm text-muted-foreground mb-2 text-center">Como vão jogar?</p>
        <div className="flex gap-2">
          <button
            onClick={() => isHost && !isLocalMode && onToggleLocalMode()}
            disabled={!isHost}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
              !isLocalMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
          >
            📱 Cada um no cel.
          </button>
          <button
            onClick={() => isHost && isLocalMode && onToggleLocalMode()}
            disabled={!isHost}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
              isLocalMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-secondary text-secondary-foreground"
            } ${isHost ? "cursor-pointer" : "cursor-default opacity-80"}`}
          >
            🖥️ Tela compartilhada
          </button>
        </div>
        {isLocalMode && (
          <p className="text-xs text-muted-foreground text-center mt-1.5">
            As palavras aparecem uma por vez — cada um fecha os olhos na vez do outro
          </p>
        )}
        {!isHost && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Só o host pode mudar as configurações
          </p>
        )}
      </div>

      {/* Jogadores */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-muted-foreground">Jogadores na sala</h3>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-mono">
            {players.length}/8
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {players.map((player, i) => (
            <motion.div
              key={player.player_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-foreground font-medium flex-1">{player.name}</span>
              {player.score > 0 && (
                <span className="text-xs text-muted-foreground">{player.score} pts</span>
              )}
              {player.is_host && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Host</span>
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
            {loading
              ? "Gerando rodada com IA... 🤖"
              : players.length < 3
                ? `Aguardando jogadores (${players.length}/3)`
                : "Iniciar Rodada →"}
          </Button>
          {players.length < 3 && (
            <p className="text-xs text-muted-foreground text-center">
              Precisa de pelo menos 3 jogadores
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Aguardando o host iniciar o jogo...</p>
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
