"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { categoriasPalavras } from "@/lib/pares-palavras"
import type { GameMode } from "@/lib/game-types"

export default function HomePage() {
  const [view, setView] = useState<"home" | "create" | "join">("home")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [mode, setMode] = useState<GameMode>("palavra")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Digite seu nome")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: name.trim(),
          mode,
          categories: selectedCategories,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Save player info to sessionStorage
      sessionStorage.setItem("playerId", data.playerId)
      sessionStorage.setItem("playerName", name.trim())
      router.push(`/room/${data.room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sala")
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) {
      setError("Digite seu nome e o codigo da sala")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          playerName: name.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      sessionStorage.setItem("playerId", data.playerId)
      sessionStorage.setItem("playerName", name.trim())
      router.push(`/room/${data.room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar na sala")
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 max-w-sm w-full"
          >
            <div className="text-center">
              <h1 className="text-5xl font-bold text-foreground tracking-tight text-balance">
                Impostor
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Descubra quem e o impostor entre seus amigos
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={() => setView("create")}
              >
                Criar Sala
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full text-lg h-14"
                onClick={() => setView("join")}
              >
                Entrar em Sala
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              3 a 8 jogadores. Cada um no seu celular.
            </p>
          </motion.div>
        )}

        {view === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-sm"
          >
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Criar Sala</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Seu Nome</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: João"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Modo de Jogo</label>
                  <div className="flex gap-2">
                    <Button
                      variant={mode === "palavra" ? "default" : "secondary"}
                      className="flex-1"
                      onClick={() => setMode("palavra")}
                    >
                      Palavra
                    </Button>
                    <Button
                      variant={mode === "pergunta" ? "default" : "secondary"}
                      className="flex-1"
                      onClick={() => setMode("pergunta")}
                    >
                      Pergunta
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Categorias (opcional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {categoriasPalavras.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedCategories.includes(cat)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? "Criando..." : "Criar Sala"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { setView("home"); setError("") }}
                  className="w-full"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {view === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-sm"
          >
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Entrar em Sala</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Seu Nome</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Maria"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Codigo da Sala</label>
                  <Input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest uppercase"
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}

                <Button
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { setView("home"); setError("") }}
                  className="w-full"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
