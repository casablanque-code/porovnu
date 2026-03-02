import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './CategoryFilter.module.css'

export const DEFAULT_CATEGORIES = [
  { id: 'all',       label: 'Все',        emoji: '🧾' },
  { id: 'food',      label: 'Продукты',   emoji: '🛒' },
  { id: 'home',      label: 'Жильё',      emoji: '🏠' },
  { id: 'fun',       label: 'Досуг',      emoji: '🎉' },
  { id: 'transport', label: 'Транспорт',  emoji: '🚗' },
  { id: 'health',    label: 'Здоровье',   emoji: '💊' },
  { id: 'cafe',      label: 'Кафе',       emoji: '☕' },
  { id: 'other',     label: 'Другое',     emoji: '📦' },
]

const EMOJI_PICKER = [
  '🏋️','🎮','✈️','🎵','📱','💈','🐶','🌿','📚','🍕',
  '🎁','🧴','🚀','⚽','🎨','🧹','💻','🎭','🛁','🔧',
  '🌙','☀️','🍷','🎤','🧘','🏊','🚲','🎯','🪴','💐',
]

const MAX_TOTAL = 10

export default function CategoryFilter({ active, onChange, pairId, onCategoriesChange }) {
  const [custom, setCustom] = useState([])
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('🏋️')
  const [step, setStep] = useState('label') // 'label' | 'emoji'

  useEffect(() => {
    if (pairId) loadCustom()
  }, [pairId])

  async function loadCustom() {
    const { data } = await supabase
      .from('pair_categories')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at')
    if (data) {
      const loaded = data.map(d => ({ id: d.id, label: d.label, emoji: d.emoji }))
      setCustom(loaded)
      onCategoriesChange?.([...DEFAULT_CATEGORIES.filter(c => c.id !== 'all'), ...loaded])
    }
  }

  const canAdd = (DEFAULT_CATEGORIES.length - 1 + custom.length) < MAX_TOTAL

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label || !pairId) return
    const { data, error } = await supabase
      .from('pair_categories')
      .insert({ pair_id: pairId, label, emoji: newEmoji })
      .select()
      .single()
    if (!error && data) {
      const newCat = { id: data.id, label: data.label, emoji: data.emoji }
      const updated = [...custom, newCat]
      setCustom(updated)
      onChange(data.id)
      onCategoriesChange?.([...DEFAULT_CATEGORIES.filter(c => c.id !== 'all'), ...updated])
    }
    setNewLabel('')
    setNewEmoji('🏋️')
    setStep('label')
    setAdding(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (step === 'label' && newLabel.trim()) setStep('emoji')
      else if (step === 'emoji') handleAdd()
    }
    if (e.key === 'Escape') cancelAdding()
  }

  function cancelAdding() {
    setAdding(false)
    setNewLabel('')
    setNewEmoji('🏋️')
    setStep('emoji')
  }

  const allCategories = [...DEFAULT_CATEGORIES, ...custom]

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.pill} ${active === cat.id ? styles.active : ''}`}
            onClick={() => onChange(cat.id)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}

        {canAdd && !adding && (
          <button className={`${styles.pill} ${styles.addBtn}`} onClick={() => setAdding(true)}>
            + своя
          </button>
        )}
      </div>

      {/* Add category panel */}
      {adding && (
        <div className={styles.addPanel}>
          {step === 'label' ? (
            <>
              <div className={styles.addHint}>Название категории</div>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  autoFocus
                  placeholder="Зал, Подписки, Спорт..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={16}
                />
                <button className={styles.nextBtn2} onClick={() => newLabel.trim() && setStep('emoji')} disabled={!newLabel.trim()}>
                  Далее →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.addHint}>
                <span className={styles.chosenEmoji}>{newEmoji}</span>
                Выбери иконку для «{newLabel}»
              </div>
              <div className={styles.emojiGrid}>
                {EMOJI_PICKER.map(e => (
                  <button
                    key={e}
                    className={`${styles.emojiBtn} ${newEmoji === e ? styles.emojiSel : ''}`}
                    onClick={() => setNewEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className={styles.emojiActions}>
                <button className={styles.backBtn} onClick={() => setStep('label')}>← Назад</button>
                <button className={styles.nextBtn} onClick={handleAdd}>Сохранить ✓</button>
              </div>
            </>
          )}
          <button className={styles.cancelLink} onClick={cancelAdding}>отмена</button>
        </div>
      )}
    </div>
  )
}
