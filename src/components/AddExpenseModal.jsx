import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_CATEGORIES, CatIcon } from './CategoryFilter'
import styles from './AddExpenseModal.module.css'

const FALLBACK = DEFAULT_CATEGORIES.filter(c => c.id !== 'all')
const DAYS = Array.from({length:31},(_,i)=>i+1)

export default function AddExpenseModal({ onClose, onSave, myName, partnerName, categories, editMode, initialValues }) {
  const cats = (categories && categories.length > 0) ? categories : FALLBACK
  const [amount, setAmount]     = useState(initialValues?.amount || '')
  const [title, setTitle]       = useState(initialValues?.title || '')
  const [comment, setComment]   = useState(initialValues?.comment || '')
  const [category, setCategory] = useState(initialValues?.category || null)
  const [paidBy, setPaidBy]     = useState(initialValues?.paidBy || 'me')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDay, setRecurringDay] = useState(1)
  const [saving, setSaving]     = useState(false)
  const [dragY, setDragY]       = useState(0)
  const [closing, setClosing]   = useState(false)

  const modalRef  = useRef(null)
  const scrollRef = useRef(null)
  // Храним состояние жеста в ref — не вызывает ре-рендер
  const gesture   = useRef({ active: false, startY: 0, startScrollTop: 0, currentDragY: 0 })

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  // Блокируем скролл страницы под модалкой
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Свайп: вешаем на modalRef с passive:false чтобы иметь право вызвать preventDefault
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const onStart = (e) => {
      const scrollTop = scrollRef.current ? scrollRef.current.scrollTop : 0
      gesture.current = {
        active: true,
        startY: e.touches[0].clientY,
        startScrollTop: scrollTop,
        currentDragY: 0,
      }
    }

    const onMove = (e) => {
      if (!gesture.current.active) return
      const dy = e.touches[0].clientY - gesture.current.startY

      // Тянем ВНИЗ и контент в самом верху → двигаем модалку, блокируем скролл страницы
      if (dy > 0 && gesture.current.startScrollTop <= 0) {
        e.preventDefault()
        gesture.current.currentDragY = dy
        setDragY(dy)
        return
      }

      // В остальных случаях — не вмешиваемся, пусть скроллится .modalScroll
    }

    const onEnd = () => {
      if (!gesture.current.active) return
      const dy = gesture.current.currentDragY
      gesture.current.active = false
      gesture.current.currentDragY = 0

      if (dy > 90) {
        handleClose()
      } else {
        setDragY(0)
      }
    }

    // passive:false — обязательно, иначе preventDefault игнорируется на iOS
    modal.addEventListener('touchstart', onStart, { passive: true })
    modal.addEventListener('touchmove',  onMove,  { passive: false })
    modal.addEventListener('touchend',   onEnd,   { passive: true })

    return () => {
      modal.removeEventListener('touchstart', onStart)
      modal.removeEventListener('touchmove',  onMove)
      modal.removeEventListener('touchend',   onEnd)
    }
  }, [handleClose])

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(',', '.')
    if (/^\d*\.?\d*$/.test(val)) setAmount(val)
  }

  const handleSave = async () => {
    if (!amount || !title || !category) return
    setSaving(true)
    await onSave({
      amount: parseFloat(amount), title, comment: comment.trim() || null,
      category, paidBy, isRecurring, recurringDay: isRecurring ? recurringDay : null,
    })
    setSaving(false)
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{ opacity: closing ? 0 : 1, transition: closing ? 'opacity 0.3s ease' : 'none' }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        style={{
          transform: closing
            ? 'translateY(100%)'
            : dragY > 0 ? `translateY(${dragY}px)` : 'translateY(0)',
          transition: dragY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          opacity: closing ? 0 : 1,
        }}
      >
        <div className={styles.handle} />

        <div className={styles.modalScroll} ref={scrollRef}>
          <div className={styles.title}>{editMode ? 'Редактировать трату' : 'Новая трата'}</div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Сумма, ₽</label>
            <input className={`${styles.input} ${styles.amountInput}`} type="text" inputMode="decimal"
              placeholder="0" value={amount} onChange={handleAmountChange} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Название</label>
            <input className={styles.input} type="text"
              placeholder="Продукты, кино, кафе..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              Категория {!category && <span style={{color:'var(--terracotta)',fontWeight:400,fontSize:11,textTransform:'none',letterSpacing:0}}>— выбери</span>}
            </label>
            <div className={styles.catGrid}>
              {cats.map(cat => (
                <button key={cat.id} className={`${styles.catBtn} ${category===cat.id?styles.catSel:''}`}
                  onClick={() => setCategory(cat.id)} title={cat.label}>
                  <span className={styles.catEmoji}>
                    <CatIcon icon={cat.icon} emoji={cat.emoji} size={15}
                      color={category===cat.id ? 'var(--terracotta)' : 'var(--brown-light)'} />
                  </span>
                  <span className={styles.catLabel}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Кто платил?</label>
            <div className={styles.whoToggle}>
              <button className={`${styles.whoBtn} ${paidBy==='me'?styles.whoSel:''}`} onClick={() => setPaidBy('me')}>
                👤 {myName}
              </button>
              <button className={`${styles.whoBtn} ${paidBy==='partner'?styles.whoSel:''}`} onClick={() => setPaidBy('partner')}>
                👤 {partnerName}
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Комментарий <span className={styles.optional}>необязательно</span></label>
            <input className={styles.input} type="text"
              placeholder="Включая чаевые, за прошлую неделю..."
              value={comment} onChange={e => setComment(e.target.value)} maxLength={100} />
          </div>

          {!editMode && (
            <div className={styles.inputGroup}>
              <label className={styles.recurringToggle}>
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                  className={styles.checkbox} />
                <span className={styles.recurringLabel}>🔄 Повторять каждый месяц</span>
              </label>
              {isRecurring && (
                <div className={styles.dayPicker}>
                  <div className={styles.dayPickerLabel}>Число месяца:</div>
                  <div className={styles.dayGrid}>
                    {DAYS.map(d => (
                      <button key={d}
                        className={`${styles.dayBtn} ${recurringDay===d?styles.daySel:''}`}
                        onClick={() => setRecurringDay(d)}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button className={styles.saveBtn} onClick={handleSave} disabled={!amount||!title||!category||saving}>
            {saving ? 'Сохраняем...' : editMode ? 'Сохранить изменения ✓' : 'Сохранить трату ✓'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
