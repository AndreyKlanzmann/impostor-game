# Impostor Game 🕵️

Jogo multiplayer estilo Among Us em que os jogadores precisam descobrir quem é o impostor entre eles.

## Como funciona

Cada rodada, todos os jogadores recebem a mesma palavra ou pergunta — exceto o(s) impostor(es), que recebem uma versão diferente. Os jogadores dão respostas e tentam identificar quem está fora do grupo sem revelar sua própria palavra.

Dois modos de jogo:
- **Palavra** — jogadores recebem uma palavra e descrevem sem falar ela diretamente
- **Pergunta** — todos respondem a mesma pergunta; o impostor recebe uma pergunta diferente

Dois formatos:
- **Jogo Local** — tela compartilhada, sem limite de jogadores
- **Multiplayer online** — cada jogador no próprio celular, salas com código

## Stack

- [Next.js 16](https://nextjs.org/) + TypeScript
- [Supabase](https://supabase.com/) — banco de dados e realtime (sincronização entre jogadores)
- [Groq AI](https://groq.com/) — geração de palavras e perguntas via IA
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/) — animações

## Rodando localmente

```bash
# instalar dependências
pnpm install

# configurar variáveis de ambiente
cp .env.example .env.local
# preencher SUPABASE_URL, SUPABASE_ANON_KEY e GROQ_API_KEY

# iniciar
pnpm dev
```

Acesse `http://localhost:3000`

## Sobre

Projeto pessoal desenvolvido para aprender na prática: Next.js App Router, realtime com Supabase, integração com IA e desenvolvimento full-stack.
