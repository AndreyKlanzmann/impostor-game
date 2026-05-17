export type GameMode = 'palavra' | 'pergunta'

export interface Room {
  id: string
  code: string
  host_id: string
  status: 'waiting' | 'playing' | 'finished'
  mode: GameMode
  categories: string[]
  max_players: number
  current_round: number
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  player_id: string
  name: string
  is_host: boolean
  score: number
  joined_at: string
}

export interface Round {
  id: string
  room_id: string
  round_number: number
  impostor_ids: string[]
  word_innocent: string | null
  word_impostor: string | null
  question_normal: string | null
  question_impostor: string | null
  category: string | null
  ai_generated: boolean
  status: 'revealing' | 'answers' | 'debate' | 'voting' | 'result'
  created_at: string
}

export interface Vote {
  id: string
  round_id: string
  voter_id: string
  voted_for: string
}

export interface Answer {
  round_id: string
  player_id: string
  answer: string
}

export interface GameEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'round_started' | 'round_updated' | 'vote_cast' | 'game_ended'
  payload: Record<string, unknown>
}
