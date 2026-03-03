import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_CATEGORIES } from './CategoryFilter'
import styles from './AddExpenseModal.module.css'

const FALLBACK = DEFAULT_CATEGORIES.filter(c => c.id !== 'all')
const DAYS = Array.from({length:31},(_,i)=>i+1)

export default function AddExpenseModal({ onClose, onSave, myName, partnerName, categories, editMode, initialValues }) {
  const cats = (categories && categories.length > 0) ? categories : FALLBACK
  const [amount, setAmount] = useState(initialValues?.amount || '')
  const [title, setTitle] = useState(initialValues?.title || '')
  const [comment, setComment] = useState(initialValues?.comment || '')
  const [category, setCategory] = useState(initialValues?.category || null)
  const [paidBy, setPaidBy] = useState(initialValues?.paidBy || 'me')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDay, setRecurringDay] = useState(1)
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const scrollRef = useRef(null)

  // Плавное закрытие — сначала анимация, потом unmount
  const handleClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 320)
  }

  // Блокируем скролл основной страницы пока модалка открыта
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Валидация суммы
  const handleAmountChange = (e) => {
    const val = e.target.value.replace(',', '.') // запятую → точку
    if (/^\d*\.?\d*$/.test(val)) setAmount(val) // только цифры и точка
  }

  // Свайп вниз для закрытия
  const [touchStart, setTouchStart] = useState(null)
  const [dragY, setDragY] = useState(0)

  const handleTouchStart = (e) => {
    // Блокируем pull-to-refresh браузера
    setTouchStart(e.touches[0].clientY)
    setDragY(0)
  }

  const handleTouchMove = (e) => {
    if (touchStart === null) return
    const delta = e.touches[0].clientY - touchStart
    const scrollTop = scrollRef.current?.scrollTop || 0
    // Тянем вниз И скролл уже в самом верху — двигаем модалку
    if (delta > 0 && scrollTop <= 0) {
      e.preventDefault()
      setDragY(delta)
    }
    // Если скролл не в верху — обычный скролл, не трогаем
  }

  const handleTouchEnd = () => {
    if (dragY > 100) {
      handleClose()
    } else {
      setDragY(0)
    }
    setTouchStart(null)
  }

  const handleSave = async () => {
    if (!amount || !title || !category) return
    setSaving(true)
    await onSave({
      amount: parseFloat(amount), title, comment: comment.trim()||null,
      category, paidBy, isRecurring, recurringDay: isRecurring ? recurringDay : null,
    })
    setSaving(false)
  }

  return createPortal(
    <div className={styles.overlay}
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{ opacity: closing ? 0 : 1, transition: closing ? 'opacity 0.32s ease' : 'none' }}>
      <div className={styles.modal}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: closing ? 'translateY(100%)' : `translateY(${dragY}px)`,
          transition: (closing || dragY === 0) ? 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          opacity: closing ? 0 : 1,
        }}>
        <div className={styles.handle}/>
        <div className={styles.modalScroll} ref={scrollRef}>
        <div className={styles.title}>{editMode ? 'Редактировать трату' : 'Новая трата'}</div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Сумма, ₽</label>
          <input className={`${styles.input} ${styles.amountInput}`} type="text" inputMode="decimal"
            placeholder="0" value={amount} onChange={handleAmountChange}/>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Название</label>
          <input className={styles.input} type="text"
            placeholder="Продукты, кино, кафе..." value={title} onChange={e=>setTitle(e.target.value)}/>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Категория {!category && <span style={{color:"var(--terracotta)",fontWeight:400,fontSize:11,textTransform:"none",letterSpacing:0}}>— выбери</span>}</label>
          <div className={styles.catGrid}>
            {cats.map(cat => (
              <button key={cat.id} className={`${styles.catBtn} ${category===cat.id?styles.catSel:''}`}
                onClick={() => setCategory(cat.id)} title={cat.label}>
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Кто платил?</label>
          <div className={styles.whoToggle}>
            <button className={`${styles.whoBtn} ${paidBy==='me'?styles.whoSel:''}`} onClick={()=>setPaidBy('me')}>
              👤 {myName}
            </button>
            <button className={`${styles.whoBtn} ${paidBy==='partner'?styles.whoSel:''}`} onClick={()=>setPaidBy('partner')}>
              👤 {partnerName}
            </button>
          </div>
        </div>

        {/* Comment — optional */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Комментарий <span className={styles.optional}>необязательно</span></label>
          <input className={styles.input} type="text"
            placeholder="Включая чаевые, за прошлую неделю..."
            value={comment} onChange={e=>setComment(e.target.value)} maxLength={100}/>
        </div>

        {/* Recurring — только при создании */}
        {!editMode && <div className={styles.inputGroup}>
          <label className={styles.recurringToggle}>
            <input type="checkbox" checked={isRecurring} onChange={e=>setIsRecurring(e.target.checked)}
              className={styles.checkbox}/>
            <span className={styles.recurringLabel}>🔄 Повторять каждый месяц</span>
          </label>
          {isRecurring && (
            <div className={styles.dayPicker}>
              <div className={styles.dayPickerLabel}>Число месяца:</div>
              <div className={styles.dayGrid}>
                {DAYS.map(d => (
                  <button key={d}
                    className={`${styles.dayBtn} ${recurringDay===d?styles.daySel:''}`}
                    onClick={()=>setRecurringDay(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>}

        <button className={styles.saveBtn} onClick={handleSave} disabled={!amount||!title||!category||saving}>
          {saving ? 'Сохраняем...' : editMode ? 'Сохранить изменения ✓' : 'Сохранить трату ✓'}
        </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
