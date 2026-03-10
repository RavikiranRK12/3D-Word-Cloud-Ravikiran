import { useState } from 'react'
import { analyzeUrl } from './api'
import type { WordData, AppState } from './types'
import WordCloud from './components/WordCloud'
import InputPanel from './components/InputPanel'
import Legend from './components/Legend'
import styles from './App.module.css'

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [words, setWords] = useState<WordData[]>([])
  const [topics, setTopics] = useState<string[][]>([])
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(url: string) {
    setAppState('loading')
    setError(null)
    setWords([])
    setTopics([])
    setArticleTitle(null)

    try {
      const data = await analyzeUrl(url)
      setWords(data.words)
      setTopics(data.topics)
      setArticleTitle(data.article_title)
      setAppState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAppState('error')
    }
  }

  return (
    <div className={styles.app}>
      {/* Background grid */}
      <div className={styles.grid} />
      {/* Ambient glow blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      {/* 3D Canvas */}
      <div className={styles.canvas}>
        {appState === 'success' && words.length > 0 ? (
          <WordCloud words={words} />
        ) : (
          <div className={styles.emptyState}>
            {appState === 'idle' && (
              <div className={styles.hint}>
                <span className={styles.hintIcon}>◈</span>
                <p>enter an article URL to begin</p>
              </div>
            )}
            {appState === 'loading' && (
              <div className={styles.loadingOrbs}>
                <div className={styles.orb} style={{ '--delay': '0s' } as React.CSSProperties} />
                <div className={styles.orb} style={{ '--delay': '0.2s' } as React.CSSProperties} />
                <div className={styles.orb} style={{ '--delay': '0.4s' } as React.CSSProperties} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* UI overlay */}
      <InputPanel
        onSubmit={handleSubmit}
        state={appState}
        error={error}
        articleTitle={articleTitle}
      />

      {appState === 'success' && topics.length > 0 && (
        <Legend topics={topics} />
      )}

      {/* Controls hint */}
      {appState === 'success' && (
        <div className={styles.controlsHint}>
          drag to rotate · scroll to zoom · hover words
        </div>
      )}
    </div>
  )
}
