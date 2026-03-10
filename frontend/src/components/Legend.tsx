import styles from './Legend.module.css'

const TOPIC_COLORS = [
  '#00ffc8',
  '#ff3cac',
  '#a78bfa',
  '#fbbf24',
  '#34d399',
  '#f87171',
  '#60a5fa',
]

interface LegendProps {
  topics: string[][]
}

export default function Legend({ topics }: LegendProps) {
  if (!topics.length) return null
  return (
    <div className={styles.legend}>
      <span className={styles.legendTitle}>topics</span>
      {topics.map((words, i) => (
        <div key={i} className={styles.row}>
          <span
            className={styles.dot}
            style={{ background: TOPIC_COLORS[i % TOPIC_COLORS.length] }}
          />
          <span className={styles.words}>
            {words.slice(0, 3).join(' · ')}
          </span>
        </div>
      ))}
    </div>
  )
}
