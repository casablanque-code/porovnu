import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus, Scale, Mail } from 'lucide-react'
import styles from './OnboardingPage.module.css'

const SLIDES = [
  {
    icon: 'Heart',
    title: 'Поровну',
    sub: 'Общий бюджет для пар и соседей. Без споров, без Excel, без головной боли.',
    hint: null,
  },
  {
    icon: 'Plus',
    title: 'Добавляй траты',
    sub: 'Кто-то купил продукты — добавил трату. Приложение само считает кто кому должен.',
    hint: '3 секунды на трату',
  },
  {
    icon: 'Scale',
    title: 'Всё поровну',
    sub: 'В любой момент видишь баланс. Один клик — и готов запрос на перевод.',
    hint: 'Никаких споров',
  },
  {
    icon: 'Mail',
    title: 'Позови партнёра',
    sub: 'Зарегистрируйся и отправь ссылку. Партнёр принимает — и вы оба видите общий бюджет.',
    hint: 'Работает для пар и соседей',
  },
]

const ICONS = { Heart, Plus, Scale, Mail }
function SlideIcon({ name }) {
  const C = ICONS[name]
  return C ? <C size={54} strokeWidth={1.25} color="var(--terracotta)" /> : null
}

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const isLast = slide === SLIDES.length - 1

  // Свайп
  const gesture = useRef({ active: false, startX: 0, startY: 0, axis: null })
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = e => {
      const t = e.touches[0]
      gesture.current = { active: true, startX: t.clientX, startY: t.clientY, axis: null }
    }

    const onMove = e => {
      if (!gesture.current.active) return
      const dx = e.touches[0].clientX - gesture.current.startX
      const dy = e.touches[0].clientY - gesture.current.startY
      if (!gesture.current.axis) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
        gesture.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (gesture.current.axis === 'x') e.preventDefault()
    }

    const onEnd = e => {
      if (!gesture.current.active || gesture.current.axis !== 'x') return
      gesture.current.active = false
      const dx = e.changedTouches[0].clientX - gesture.current.startX
      if (dx < -50 && slide < SLIDES.length - 1) setSlide(s => s + 1)
      if (dx >  50 && slide > 0)                 setSlide(s => s - 1)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [slide])

  return (
    <div className={styles.page}>
      <div className={styles.card} ref={containerRef}>

        {!isLast && (
          <button className={styles.skip} onClick={() => navigate('/register')}>
            Пропустить
          </button>
        )}

        <div className={styles.slideContainer}>
          {SLIDES.map((s, i) => (
            <div key={i}
              className={`${styles.slide} ${i === slide ? styles.slideActive : i < slide ? styles.slideLeft : styles.slideRight}`}
            >
              <div className={styles.iconWrap}>
                <SlideIcon name={s.icon} />
              </div>
              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.sub}>{s.sub}</p>
              {s.hint && <div className={styles.hint}>{s.hint}</div>}
            </div>
          ))}
        </div>

        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <div key={i}
              className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary}
            onClick={() => isLast ? navigate('/register') : setSlide(s => s + 1)}>
            {isLast ? 'Создать аккаунт' : 'Далее'}
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
