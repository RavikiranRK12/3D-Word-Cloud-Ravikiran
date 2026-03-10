export interface WordData {
  word: string
  weight: number
  topic: number
}

export interface AnalyzeResponse {
  words: WordData[]
  topics: string[][]
  article_title: string
}

export type AppState = 'idle' | 'loading' | 'success' | 'error'
