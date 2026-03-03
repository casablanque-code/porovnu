import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './OnboardingPage.module.css'

const SLIDES = [
  {
    emoji: '🧡',
    title: 'Поровну',
    sub: 'Общий бюджет для пар и соседей. Без споров, без Excel, без головной боли.',
    hint: null,
  },
  {
    emoji: '➕',
    title: 'Добавляй траты',
    sub: 'Кто-то купил продукты — добавил трату. Приложение само считает кто кому должен.',
    hint: '3 секунды на трату',
  },
  {
    emoji: '⚖️',
    title: 'Всё поровну',
    sub: 'В любой момент видишь баланс. Один клик — и готов запрос на перевод.',
    hint: 'Никаких споров',
  },
  {
    emoji: '💌',
    title: 'Позови партнёра',
    sub: 'Зарегистрируйся и отправь ссылку. Партнёр принимает — и вы оба видите общий бюджет.',
    hint: 'Работает для пар и соседей',
  },
]

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const isLast = slide === SLIDES.length - 1

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Skip */}
        {!isLast && (
          <button className={styles.skip} onClick={() => navigate('/register')}>
            Пропустить
          </button>
        )}

        {/* Все слайды рендерятся сразу, показывается только активный */}
        <div className={styles.slideContainer}>
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className={`${styles.slide} ${i === slide ? styles.slideActive : styles.slideHidden}`}
            >
              <div className={styles.emoji}>{s.emoji}</div>
              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.sub}>{s.sub}</p>
              {s.hint && <div className={styles.hint}>✨ {s.hint}</div>}
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>

        {/* Actions — фиксированная зона, две кнопки всегда зарезервированы */}
        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => isLast ? navigate('/register') : setSlide(s => s + 1)}
          >
            {isLast ? 'Создать аккаунт →' : 'Далее →'}
          </button>
          <button
            className={`${styles.btnSecondary} ${isLast ? styles.btnSecondaryVisible : styles.btnSecondaryHidden}`}
            onClick={() => navigate('/login')}
            tabIndex={isLast ? 0 : -1}
          >
            Уже есть аккаунт
          </button>
        </div>

      </div>

      <div className={styles.blob1} />
      <div className={styles.blob2} />
    </div>
  )
}
