export interface PerguntaBase {
  categoria: string
  normal: string
  variante: string
}

export const perguntasBase: PerguntaBase[] = [
  // ===== COMIDA =====
  { categoria: "comida", normal: "Quantas vezes voce comeu fora este mes?", variante: "Quantas vezes voce pediu delivery este mes?" },
  { categoria: "comida", normal: "Quantos cafes voce toma por dia?", variante: "Quantos copos d'agua voce toma por dia?" },
  { categoria: "comida", normal: "Quantas vezes por semana voce come arroz e feijao?", variante: "Quantas vezes por semana voce come macarrao?" },
  { categoria: "comida", normal: "Quantos churrascos voce foi este ano?", variante: "Quantas feijoadas voce comeu este ano?" },
  { categoria: "comida", normal: "Quantas vezes voce comeu acai nos ultimos 30 dias?", variante: "Quantas vezes voce comeu sorvete nos ultimos 30 dias?" },

  // ===== ROLE / VIDA SOCIAL =====
  { categoria: "role", normal: "Quantas festas voce foi neste ano?", variante: "Quantas vezes voce desmarcou role neste ano?" },
  { categoria: "role", normal: "Quantas vezes voce foi pra balada nos ultimos 6 meses?", variante: "Quantas vezes voce foi pra um barzinho nos ultimos 6 meses?" },
  { categoria: "role", normal: "Quantos shows voce foi nos ultimos 12 meses?", variante: "Quantos festivais voce foi nos ultimos 12 meses?" },
  { categoria: "role", normal: "Quantas vezes voce chegou em casa depois das 4 da manha este ano?", variante: "Quantas vezes voce dormiu fora de casa este ano?" },
  { categoria: "role", normal: "Quantos crushes voce teve este ano?", variante: "Quantos crushes voce bloqueou este ano?" },

  // ===== REDES =====
  { categoria: "redes", normal: "Quantas horas por dia voce passa no TikTok?", variante: "Quantas horas por dia voce passa no Instagram?" },
  { categoria: "redes", normal: "Quantos stories voce postou esta semana?", variante: "Quantos stories voce assistiu esta semana? (chute por baixo)" },
  { categoria: "redes", normal: "Quantas pessoas voce stalkeou esta semana?", variante: "Quantas vezes voce stalkeou a MESMA pessoa esta semana?" },
  { categoria: "redes", normal: "Quantas vezes por dia voce abre o WhatsApp?", variante: "Quantas vezes por dia voce abre o Instagram?" },
  { categoria: "redes", normal: "Quantos grupos do WhatsApp voce esta silenciado?", variante: "Quantos grupos do WhatsApp voce saiu este ano?" },
  { categoria: "redes", normal: "Quantas horas por dia voce passa no celular?", variante: "Quantas horas por dia voce passa no notebook?" },

  // ===== TRABALHO =====
  { categoria: "trabalho", normal: "Quantos empregos formais voce ja teve?", variante: "Quantos estagios voce ja fez?" },
  { categoria: "trabalho", normal: "Quantas reunioes voce teve esta semana?", variante: "Quantas reunioes voce 'fugiu' esta semana?" },
  { categoria: "trabalho", normal: "Quantas vezes voce pensou em pedir demissao este ano?", variante: "Quantas vezes voce pensou em mudar de area este ano?" },
  { categoria: "trabalho", normal: "Quantos dias voce trabalhou em home office este mes?", variante: "Quantos dias voce trabalhou presencial este mes?" },

  // ===== CULTURA POP =====
  { categoria: "cultura pop", normal: "Quantas series voce esta acompanhando no momento?", variante: "Quantas series voce abandonou no meio este ano?" },
  { categoria: "cultura pop", normal: "Quantos filmes voce assistiu no cinema este ano?", variante: "Quantos filmes voce assistiu em casa este mes?" },
  { categoria: "cultura pop", normal: "Quantos animes voce acompanhou na vida?", variante: "Quantos doramas voce acompanhou na vida?" },

  // ===== GAMES =====
  { categoria: "games", normal: "Quantas horas voce joga por semana?", variante: "Quantas horas voce assiste gente jogando por semana?" },
  { categoria: "games", normal: "Quantos jogos voce comprou e nunca terminou?", variante: "Quantos jogos voce terminou mais de uma vez?" },

  // ===== RELACIONAMENTO =====
  { categoria: "relacionamento", normal: "Quantos namoros serios voce teve na vida?", variante: "Quantas pessoas voce ficou mais de um mes na vida?" },
  { categoria: "relacionamento", normal: "Quantos ex voce ainda segue no Instagram?", variante: "Quantos ex te bloquearam no Instagram?" },
  { categoria: "relacionamento", normal: "Quantas vezes voce falou 'eu te amo' na vida?", variante: "Quantas vezes alguem disse 'eu te amo' pra voce na vida?" },

  // ===== DINHEIRO =====
  { categoria: "dinheiro", normal: "Quantas vezes voce usou o pix esta semana?", variante: "Quantas vezes voce dividiu conta no pix esta semana?" },
  { categoria: "dinheiro", normal: "Quantas compras impulsivas voce fez este mes?", variante: "Quantas vezes voce colocou item no carrinho e nao comprou este mes?" },

  // ===== FAMILIA =====
  { categoria: "familia", normal: "Quantos primos voce tem?", variante: "Quantos primos voce realmente fala?" },
  { categoria: "familia", normal: "Quantas vezes por mes voce almoca com a familia?", variante: "Quantas vezes por mes voce janta com a familia?" },
  { categoria: "familia", normal: "Quantas vezes seus pais te ligaram esta semana?", variante: "Quantas vezes VOCE ligou pros seus pais esta semana?" },
]

export const categoriasPerguntas = [...new Set(perguntasBase.map(p => p.categoria))]
