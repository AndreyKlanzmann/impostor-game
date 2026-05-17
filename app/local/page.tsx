"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { categoriasPalavras, paresPalavras } from "@/lib/pares-palavras"
import { perguntasBase } from "@/lib/perguntas-base"
import type { GameMode } from "@/lib/game-types"

type LocalPlayer = { id: string; name: string }
type LocalRound = {
  roundNumber: number
  impostorIds: string[]
  wordInnocent: string | null
  wordImpostor: string | null
  questionNormal: string | null
  questionImpostor: string | null
  aiGenerated: boolean
}
type Phase = "setup" | "revealing" | "debate" | "voting" | "result"

function getStaticPair(mode: GameMode, categoria?: string) {
  if (mode === "palavra") {
    const pool = categoria ? paresPalavras.filter(p => p.categoria === categoria) : paresPalavras
    const item = pool[Math.floor(Math.random() * pool.length)]
    return { wordInnocent: item.inocente, wordImpostor: item.impostor, questionNormal: null, questionImpostor: null }
  } else {
    const pool = categoria ? perguntasBase.filter(p => p.categoria === categoria) : perguntasBase
    const item = pool[Math.floor(Math.random() * pool.length)]
    return { wordInnocent: null, wordImpostor: null, questionNormal: item.normal, questionImpostor: item.variante }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function LocalPage() {
  const router = useRouter()
  const [mode, setMode] = useState<GameMode>("palavra")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [players, setPlayers] = useState<LocalPlayer[]>([])
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>("setup")
  const [round, setRound] = useState<LocalRound | null>(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [revealIndex, setRevealIndex] = useState(0)
  const [revealOrder, setRevealOrder] = useState<LocalPlayer[]>([])
  const [debateOrder, setDebateOrder] = useState<LocalPlayer[]>([])
  const [showWord, setShowWord] = useState(false)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [voterIndex, setVoterIndex] = useState(0)
  const [votingOrder, setVotingOrder] = useState<LocalPlayer[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)

  const addPlayer = () => {
    const trimmed = newName.trim()
    if (!trimmed || players.find(p => p.name.toLowerCase() === trimmed.toLowerCase())) return
    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }])
    setNewName("")
  }

  const toggleCategory = (cat: string) =>
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const startRound = async () => {
    setLoading(true)
    const impostorCount = players.length >= 6 ? 2 : 1
    const impostorIds = shuffle(players).slice(0, impostorCount).map(p => p.id)
    const categoria = selectedCategories.length > 0
      ? selectedCategories[Math.floor(Math.random() * selectedCategories.length)]
      : undefined

    let content = getStaticPair(mode, categoria)
    let aiGenerated = false

    try {
      const res = await fetch("/api/local-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, categoria }),
      })
      if (res.ok) {
        const data = await res.json()
        if (mode === "palavra" && data.inocente) {
          content = { wordInnocent: data.inocente, wordImpostor: data.impostor, questionNormal: null, questionImpostor: null }
          aiGenerated = true
        } else if (mode === "pergunta" && data.normal) {
          content = { wordInnocent: null, wordImpostor: null, questionNormal: data.normal, questionImpostor: data.variante }
          aiGenerated = true
        }
      }
    } catch {}

    const newRound: LocalRound = { roundNumber: roundNumber + 1, impostorIds, aiGenerated, ...content }
    setRound(newRound)
    setRoundNumber(n => n + 1)
    setRevealOrder(shuffle(players))
    setDebateOrder(shuffle(players))
    setRevealIndex(0)
    setShowWord(false)
    setVotes({})
    setVoterIndex(0)
    setHasVoted(false)
    setSelectedVote(null)
    setPhase("revealing")
    setLoading(false)
  }

  const getContentForPlayer = (player: LocalPlayer) => {
    if (!round) return ""
    const isImpostor = round.impostorIds.includes(player.id)
    if (mode === "palavra") return isImpostor ? round.wordImpostor : round.wordInnocent
    return isImpostor ? round.questionImpostor : round.questionNormal
  }

  const handleNextReveal = () => {
    setShowWord(false)
    if (revealIndex + 1 >= revealOrder.length) setPhase("debate")
    else setRevealIndex(i => i + 1)
  }

  const startVoting = () => {
    setVotingOrder(shuffle(players))
    setVoterIndex(0)
    setVotes({})
    setSelectedVote(null)
    setHasVoted(false)
    setPhase("voting")
  }

  const confirmVote = () => {
    if (!selectedVote || !round) return
    const currentVoter = votingOrder[voterIndex]
    const newVotes = { ...votes, [currentVoter.id]: selectedVote }
    setVotes(newVotes)
    setSelectedVote(null)
    setHasVoted(false)
    if (voterIndex + 1 >= votingOrder.length) {
      // Tally
      const tally: Record<string, number> = {}
      Object.values(newVotes).forEach(id => { tally[id] = (tally[id] || 0) + 1 })
      const maxVotes = Math.max(...Object.values(tally), 0)
      const mostVoted = Object.keys(tally).filter(k => tally[k] === maxVotes)
      const impostorCaught = mostVoted.some(id => round.impostorIds.includes(id))
      const newScores = { ...scores }
      players.forEach(p => { if (!newScores[p.id]) newScores[p.id] = 0 })
      if (impostorCaught) {
        players.filter(p => !round.impostorIds.includes(p.id)).forEach(p => { newScores[p.id] = (newScores[p.id] || 0) + 1 })
      } else {
        players.filter(p => round.impostorIds.includes(p.id)).forEach(p => { newScores[p.id] = (newScores[p.id] || 0) + 2 })
      }
      setScores(newScores)
      setPhase("result")
    } else {
      setVoterIndex(i => i + 1)
    }
  }

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name ?? "?"

  const BackButton = () => (
    <button onClick={() => setPhase("setup")}
      style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}
      className="text-xs text-muted-foreground underline px-4 py-2 bg-background/80 rounded-full">
      ← Voltar ao lobby
    </button>
  )

  // SETUP
  if (phase === "setup") return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-5 pb-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🖥️ Modo Local</h1>
          <p className="text-sm text-muted-foreground mt-1">Um dispositivo, tela compartilhada</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Modo</p>
          <div className="flex gap-2">
            {(["palavra", "pergunta"] as GameMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary text-secondary-foreground"}`}>
                {m === "palavra" ? "Palavra" : "Pergunta"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Categorias <span className="text-xs">(vazio = todas)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {categoriasPalavras.map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedCategories.includes(cat) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Jogadores ({players.length})</p>
          <div className="flex gap-2 mb-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPlayer()}
              placeholder="Nome do jogador" maxLength={20} />
            <Button onClick={addPlayer} disabled={!newName.trim()} className="shrink-0 px-4">+</Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {players.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm flex-1">{p.name}</span>
                {(scores[p.id] || 0) > 0 && <span className="text-xs text-muted-foreground">{scores[p.id]} pts</span>}
                <button onClick={() => setPlayers(prev => prev.filter(x => x.id !== p.id))}
                  className="text-muted-foreground hover:text-destructive text-xl leading-none">×</button>
              </motion.div>
            ))}
          </div>
        </div>

        <Button onClick={startRound} disabled={players.length < 3 || loading} className="w-full h-12 text-base">
          {loading ? "Gerando com IA... 🤖" : players.length < 3 ? `Adicione jogadores (${players.length}/3)` : "Iniciar Rodada →"}
        </Button>

        <button onClick={() => router.push("/")} className="text-xs text-muted-foreground underline text-center">
          ← Voltar ao menu
        </button>
      </motion.div>
    </main>
  )

  // REVEALING
  if (phase === "revealing" && round) {
    const currentPlayer = revealOrder[revealIndex]
    const isLast = revealIndex === revealOrder.length - 1
    return (
      <main className="min-h-dvh flex items-center justify-center p-4">
        <motion.div key={revealIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col gap-5 items-center">
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono">Rodada {round.roundNumber}</span>
            <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-mono">{revealIndex + 1}/{revealOrder.length}</span>
            {round.aiGenerated && <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-mono">✨ IA</span>}
          </div>
          <AnimatePresence mode="wait">
            {!showWord ? (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 w-full">
                <div className="text-center bg-secondary/30 rounded-2xl p-8 w-full">
                  <p className="text-sm text-muted-foreground mb-2">Vez de</p>
                  <p className="text-3xl font-bold">{currentPlayer.name}</p>
                  <p className="text-sm text-muted-foreground mt-3">Todos fechem os olhos! 👀</p>
                </div>
                <Button size="lg" className="w-full h-14" onClick={() => setShowWord(true)}>
                  {currentPlayer.name} está pronto → Mostrar
                </Button>
              </motion.div>
            ) : (
              <motion.div key="show" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 w-full">
                <div className="text-center p-6 rounded-2xl border-2 border-primary bg-primary/10 w-full">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                    {currentPlayer.name} — sua {mode === "palavra" ? "palavra" : "pergunta"}
                  </p>
                  <p className={`font-bold mt-2 ${mode === "palavra" ? "text-3xl" : "text-xl"}`}>
                    {getContentForPlayer(currentPlayer)}
                  </p>
                </div>
                <Button className="w-full h-14" onClick={handleNextReveal}>
                  {isLast ? "Todos viram! → Debate" : `Próximo: ${revealOrder[revealIndex + 1].name} →`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <BackButton />
      </main>
    )
  }

  // DEBATE
  if (phase === "debate" && round) return (
    <main className="min-h-dvh flex items-center justify-center p-4 pb-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <p className="text-2xl font-bold">💬 Debate</p>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "palavra" ? "Falem sobre sua palavra. Quem é diferente?" : "Cada um responde em voz alta!"}
          </p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Ordem de fala</p>
          {debateOrder.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
              <span className="text-sm font-medium">{p.name}</span>
            </div>
          ))}
        </div>
        <Button className="w-full h-12" onClick={startVoting}>Ir para votação →</Button>
      </motion.div>
      <BackButton />
    </main>
  )

  // VOTING
  if (phase === "voting" && round) {
    const currentVoter = votingOrder[voterIndex]
    return (
      <main className="min-h-dvh flex items-center justify-center p-4 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <p className="text-2xl font-bold">🗳️ Votação</p>
            <p className="text-sm text-muted-foreground mt-1">Vez de <strong>{currentVoter?.name}</strong> votar</p>
            <p className="text-xs text-muted-foreground">{voterIndex + 1}/{votingOrder.length}</p>
          </div>
          {!hasVoted ? (
            <>
              <div className="flex flex-col gap-2">
                {players.filter(p => p.id !== currentVoter?.id).map(p => (
                  <button key={p.id} onClick={() => setSelectedVote(p.id)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 border-2 text-left transition-all ${selectedVote === p.id ? "border-destructive bg-destructive/10" : "border-transparent bg-secondary/50"}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{p.name}</span>
                    {selectedVote === p.id && <span className="ml-auto text-destructive">👈</span>}
                  </button>
                ))}
              </div>
              <Button variant="destructive" className="w-full h-12" disabled={!selectedVote} onClick={() => setHasVoted(true)}>
                {selectedVote ? `Votar em ${getPlayerName(selectedVote)}` : "Selecione alguém"}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <div className="bg-secondary/30 rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-1">Voto de {currentVoter?.name}</p>
                <p className="text-xl font-bold text-destructive">{getPlayerName(selectedVote!)}</p>
              </div>
              <Button className="w-full h-12" onClick={confirmVote}>
                Confirmar → Próximo jogador
              </Button>
            </div>
          )}
        </motion.div>
        <BackButton />
      </main>
    )
  }

  // RESULT
  if (phase === "result" && round) {
    const tally: Record<string, number> = {}
    Object.values(votes).forEach(id => { tally[id] = (tally[id] || 0) + 1 })
    const maxVotes = Math.max(...Object.values(tally), 0)
    const impostorCaught = Object.keys(tally).filter(k => tally[k] === maxVotes).some(id => round.impostorIds.includes(id))
    return (
      <main className="min-h-dvh flex items-center justify-center p-4 pb-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <h2 className={`text-3xl font-bold ${impostorCaught ? "text-primary" : "text-destructive"}`}>
              {impostorCaught ? "Impostor descoberto!" : "Impostor escapou!"}
            </h2>
            <p className="text-muted-foreground mt-1">{impostorCaught ? "Inocentes vencem!" : "O impostor enganou todos!"}</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Impostor era</p>
            {round.impostorIds.map(id => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-sm font-bold text-destructive">
                  {getPlayerName(id).charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold">{getPlayerName(id)}</span>
                <span className="text-destructive text-xs ml-auto">IMPOSTOR</span>
              </div>
            ))}
          </div>
          {round.wordInnocent && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Inocentes</p>
                <p className="text-sm font-bold">{round.wordInnocent}</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Impostor</p>
                <p className="text-sm font-bold">{round.wordImpostor}</p>
              </div>
            </div>
          )}
          {round.questionNormal && (
            <div className="flex flex-col gap-2">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Inocentes responderam</p>
                <p className="text-sm">{round.questionNormal}</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Impostor respondeu</p>
                <p className="text-sm">{round.questionImpostor}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Votos</p>
            {[...players].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0)).map(p => (
              <div key={p.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-1 ${round.impostorIds.includes(p.id) ? "bg-destructive/10" : "bg-secondary/30"}`}>
                <span className="text-sm flex-1">{p.name}{round.impostorIds.includes(p.id) && <span className="text-destructive text-xs ml-1">(impostor)</span>}</span>
                <span className="text-xs font-mono">{tally[p.id] || 0} votos</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Placar</p>
            {[...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-sm">{p.name}</span>
                <span className="text-sm font-mono font-bold text-primary">{scores[p.id] || 0} pts</span>
              </div>
            ))}
          </div>
          <Button onClick={startRound} disabled={loading} className="w-full h-12">
            {loading ? "Gerando com IA... 🤖" : "Próxima Rodada →"}
          </Button>
        </motion.div>
        <BackButton />
      </main>
    )
  }

  return null
}
