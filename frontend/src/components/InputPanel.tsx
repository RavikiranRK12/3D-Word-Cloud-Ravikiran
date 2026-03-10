import { useState, type FormEvent } from 'react'
import type { AppState } from '../types'
import styles from './InputPanel.module.css'

const SAMPLE_URLS = [
  {
    label: 'NYT · AI & Society',
    url: 'https://www.nytimes.com/2024/05/21/technology/ai-frontier-models.html',
  },
  {
    label: 'BBC · Climate',
    url: 'https://www.bbc.com/news/science-environment-68640823',
  },
  {
    label: 'The Guardian · Tech',
    url: 'https://www.theguardian.com/technology/2024/jun/10/apple-ai-features-ios-18',
  },
]

interface InputPanelProps {
  onSubmit: (url: string) => void
  state: AppState
  error: string | null
  articleTitle: string | null
}

export default function InputPanel({ onSubmit, state, error, articleTitle }: InputPanelProps) {
  const [url, setUrl] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.logo}>◈</span>
        <h1 className={styles.title}>LEXICLOUD</h1>
        <span className={styles.sub}>3D topic visualization</span>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="https://article-url.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={state === 'loading'}
            spellCheck={false}
          />
          <button
            className={styles.button}
            type="submit"
            disabled={state === 'loading' || !url.trim()}
          >
            {state === 'loading' ? (
              <span className={styles.spinner} />
            ) : (
              '→'
            )}
          </button>
        </div>
      </form>

      <div className={styles.samples}>
        <span className={styles.samplesLabel}>samples →</span>
        {SAMPLE_URLS.map((s) => (
          <button
            key={s.url}
            className={styles.sampleBtn}
            onClick={() => {
              setUrl(s.url)
              onSubmit(s.url)
            }}
            disabled={state === 'loading'}
          >
            {s.label}
          </button>
        ))}
      </div>

      {state === 'loading' && (
        <div className={styles.status}>
          <span className={styles.statusDot} data-active />
          crawling &amp; analyzing…
        </div>
      )}

      {error && (
        <div className={styles.error}>⚠ {error}</div>
      )}

      {articleTitle && state === 'success' && (
        <div className={styles.articleTitle} title={articleTitle}>
          {articleTitle}
        </div>
      )}
    </div>
  )
}
