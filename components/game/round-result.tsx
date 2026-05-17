"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { Player, Round } from "@/lib/game-types"

interface RoundResultProps {
  round: Round
  players: Player[]
  votes: { voter_id: string; voted_for: string }[]
  isHost: boolean
  onNextRound: () => void
  onGoHome: () => void
}

export function RoundResult({ round, players, votes, isHost, onNextRound, onGoHome }: RoundResultProps) {
  const tally: Record<string, number> = {}
  votes.forEach(v => {
    tally[v.voted_for] = (tally[v.voted_for] || 0) + 1
  })

  const sortedPlayers = [...players].sort((a, b) => (tally[b.player_id] || 0) - (tally[a.player_id] || 0))
  const maxVotes = Math.max(...Object.values(tally), 0)
  const mostVoted = Object.keys(tally).filter(k => tally[k] === maxVotes)
  const impostorCaught = mostVoted.some(id => round.impostor_ids.includes(id))

  const getPlayerName = (id: string) => players.find(p => p.player_id === id)?.name || "?"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-center">
        <h2 className={`text-3xl font-bold ${impostorCaught ? "text-primary" : "text-destructive"}`}>
          {impostorCaught ? "Impostor descoberto!" : "Impostor escapou!"}
        </h2>
        <p className="text-muted-foreground mt-2">
          {impostorCaught
            ? "Os inocentes venceram esta rodada!"
            : "O impostor enganou todo mundo!"}
        </p>
      </motion.div>

      {/* Revelação dos impostores */}
      <div className="w-full bg-secondary/30 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          {round.impostor_ids.length > 1 ? "Impostores eram" : "Impostor era"}
        </p>
        {round.impostor_ids.map(id => (
          <div key={id} className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-sm font-bold text-destructive">
              {getPlayerName(id).charAt(0).toUpperCase()}
            </div>
            <span className="text-foreground font-semibold">{getPlayerName(id)}</span>
            <span className="text-destructive text-xs ml-auto">IMPOSTOR</span>
          </div>
        ))}
      </div>

      {/* Palavras/perguntas reveladas */}
      {round.word_innocent && (
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Inocentes tinham</p>
            <p className="text-sm font-bold text-foreground">{round.word_innocent}</p>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Impostor tinha</p>
            <p className="text-sm font-bold text-foreground">{round.word_impostor}</p>
          </div>
        </div>
      )}

      {round.question_normal && (
        <div className="w-full flex flex-col gap-2">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Inocentes responderam</p>
            <p className="text-sm text-foreground">{round.question_normal}</p>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Impostor respondeu</p>
            <p className="text-sm text-foreground">{round.question_impostor}</p>
          </div>
        </div>
      )}

      {/* Votos */}
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Votos</p>
        <div className="flex flex-col gap-1.5">
          {sortedPlayers.map(player => {
            const isImp = round.impostor_ids.includes(player.player_id)
            const voteCount = tally[player.player_id] || 0
            return (
              <div
                key={player.player_id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isImp ? "bg-destructive/10" : "bg-secondary/30"
                }`}
              >
                <span className="text-foreground text-sm flex-1">
                  {player.name}
                  {isImp && <span className="text-destructive text-xs ml-1">(impostor)</span>}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: voteCount }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-accent" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{voteCount}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Placar */}
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Placar</p>
        <div className="flex flex-col gap-1">
          {[...players].sort((a, b) => b.score - a.score).map(player => (
            <div key={player.player_id} className="flex items-center justify-between px-3 py-1.5">
              <span className="text-sm text-foreground">{player.name}</span>
              <span className="text-sm font-mono font-bold text-primary">{player.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <Button onClick={onNextRound} className="w-full h-12 text-base">
          Próxima Rodada
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aguardando host iniciar próxima rodada...
        </p>
      )}

      <button onClick={onGoHome} className="text-xs text-muted-foreground underline">
        Sair da sala
      </button>
    </motion.div>
  )
}
