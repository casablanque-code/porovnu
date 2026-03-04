import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, Home, Coffee, Car, Heart, Music, Package,
  Dumbbell, Plane, Train, Book, Laptop, Camera, Shirt,
  Scissors, Wrench, Gamepad2, Globe, Dog, Leaf, Palette,
  Gift, Utensils, Wine, Headphones, Bike, Baby, Zap, Wallet
, X } from 'lucide-react'
import styles from './CategoryFilter.module.css'

// Маппинг icon name → компонент Lucide
export const ICON_MAP = {
  ShoppingCart, Home, Coffee, Car, Heart, Music, Package,
  Dumbbell, Plane, Train, Book, Laptop, Camera, Shirt,
  Scissors, Wrench, Gamepad2, Globe, Dog, Leaf, Palette,
  Gift, Utensils, Wine, Headphones, Bike, Baby, Zap, Wallet
}

// 28 иконок для пикера (7×4)
export const ICON_PICKER = [
  { name: 'Dumbbell',     label: 'Спорт' },
  { name: 'Plane',        label: 'Путешествия' },
  { name: 'Train',        label: 'Транспорт' },
  { name: 'Bike',         label: 'Велосипед' },
  { name: 'Utensils',     label: 'Еда' },
  { name: 'Coffee',       label: 'Кафе' },
  { name: 'Wine',         label: 'Бар' },
  { name: 'Gift',         label: 'Подарки' },
  { name: 'Home',         label: 'Жильё' },
  { name: 'Wrench',       label: 'Ремонт' },
  { name: 'Scissors',     label: 'Красота' },
  { name: 'Shirt',        label: 'Одежда' },
  { name: 'Laptop',       label: 'Техника' },
  { name: 'Headphones',   label: 'Музыка' },
  { name: 'Gamepad2',     label: 'Игры' },
  { name: 'Camera',       label: 'Фото' },
  { name: 'Book',         label: 'Книги' },
  { name: 'Palette',      label: 'Творчество' },
  { name: 'Heart',        label: 'Здоровье' },
  { name: 'Baby',         label: 'Дети' },
  { name: 'Dog',          label: 'Питомцы' },
  { name: 'Leaf',         label: 'Экология' },
  { name: 'Globe',        label: 'Интернет' },
  { name: 'Zap',          label: 'Коммуналка' },
  { name: 'Wallet',       label: 'Финансы' },
  { name: 'Music',        label: 'Концерты' },
  { name: 'ShoppingCart', label: 'Покупки' },
  { name: 'Package',      label: 'Другое' },
]

// Дефолтные категории — используют icon name вместо emoji
export const DEFAULT_CATEGORIES = [
  { id: 'all',       label: 'Все',        icon: 'Package' },
  { id: 'food',      label: 'Продукты',   icon: 'ShoppingCart' },
  { id: 'home',      label: 'Жильё',      icon: 'Home' },
  { id: 'cafe',      label: 'Кафе',       icon: 'Coffee' },
  { id: 'transport', label: 'Транспорт',  icon: 'Car' },
  { id: 'health',    label: 'Здоровье',   icon: 'Heart' },
  { id: 'fun',       label: 'Досуг',      icon: 'Music' },
  { id: 'other',     label: 'Другое',     icon: 'Package' },
]

// Хелпер — рендерит иконку по имени
export function CatIcon({ icon, emoji, size = 16, color = 'currentColor', strokeWidth = 1.75 }) {
  // Поддержка старых кастомных категорий с emoji
  if (!icon && emoji) return <span style={{ fontSize: size }}>{emoji}</span>
  const Comp = ICON_MAP[icon]
  if (!Comp) return <span style={{ fontSize: size }}>□</span>
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />
}

const MAX_TOTAL = 10

export default function CategoryFilter({ active, onChange, pairId, onCategoriesChange }) {
  const [custom, setCustom]     = useState([])
  const [adding, setAdding]     = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon]   = useState('Package')
  const [step, setStep]         = useState('label')
  const [wiggle, setWiggle]     = useState(false)   // режим редактирования категорий
  const longPressTimer           = useRef(null)

  function startLongPress() {
    longPressTimer.current = setTimeout(() => setWiggle(true), 500)
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  async function handleDeleteCustom(id) {
    await supabase.from('pair_categories').delete().eq('id', id)
    const updated = custom.filter(c => c.id !== id)
    setCustom(updated)
    onCategoriesChange?.([...DEFAULT_CATEGORIES.filter(c=>c.id!=='all'), ...updated])
    if (updated.length === 0) setWiggle(false)
  }

  useEffect(() => { if (pairId) loadCustom() }, [pairId])

  async function loadCustom() {
    const { data } = await supabase.from('pair_categories').select('*').eq('pair_id', pairId).order('created_at')
    if (data) {
      const loaded = data.map(d => ({ id: d.id, label: d.label, icon: d.emoji, emoji: d.emoji }))
      setCustom(loaded)
      onCategoriesChange?.([...DEFAULT_CATEGORIES.filter(c => c.id !== 'all'), ...loaded])
    }
  }

  const canAdd = (DEFAULT_CATEGORIES.length - 1 + custom.length) < MAX_TOTAL

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label || !pairId) return
    const { data, error } = await supabase
      .from('pair_categories').insert({ pair_id: pairId, label, emoji: newIcon }).select().single()
    if (!error && data) {
      const newCat = { id: data.id, label: data.label, icon: data.emoji, emoji: data.emoji }
      const updated = [...custom, newCat]
      setCustom(updated)
      // не меняем активный фильтр после добавления — остаётся 'all'
      onCategoriesChange?.([...DEFAULT_CATEGORIES.filter(c => c.id !== 'all'), ...updated])
    }
    setNewLabel(''); setNewIcon('Package'); setStep('label'); setAdding(false)
  }

  function cancelAdding() {
    setAdding(false); setNewLabel(''); setNewIcon('Package'); setStep('label')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (step === 'label' && newLabel.trim()) setStep('icon')
      else if (step === 'icon') handleAdd()
    }
    if (e.key === 'Escape') cancelAdding()
  }

  const allCategories = [...DEFAULT_CATEGORIES, ...custom]

  return (
    <div className={styles.wrap}>
      <div
        className={styles.grid}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
      >
        {allCategories.map(cat => {
          const isCustom = custom.some(cu => cu.id === cat.id)
          return (
            <div key={cat.id} className={`${styles.pillWrap} ${wiggle && isCustom ? styles.wiggling : ''}`}>
              <button
                className={`${styles.pill} ${active === cat.id ? styles.active : ''}`}
                onClick={() => { if (!wiggle) onChange(cat.id) }}>
                <CatIcon icon={cat.icon} emoji={cat.emoji} size={14}
                  color={active === cat.id ? 'white' : 'var(--brown-light)'} />
                {cat.label}
              </button>
              {wiggle && isCustom && (
                <button className={styles.deleteX} onClick={() => handleDeleteCustom(cat.id)}>
                  <X size={10} strokeWidth={3} color="white"/>
                </button>
              )}
            </div>
          )
        })}
        {canAdd && !adding && !wiggle && (
          <button className={`${styles.pill} ${styles.addBtn}`} onClick={() => setAdding(true)}>
            + своя
          </button>
        )}
        {wiggle && (
          <button className={`${styles.pill} ${styles.doneBtn}`} onClick={() => setWiggle(false)}>
            Готово
          </button>
        )}
      </div>

      {adding && (
        <div className={styles.addPanel}>
          {step === 'label' ? (
            <>
              <div className={styles.addHint}>Название категории</div>
              <div className={styles.inputRow}>
                <input className={styles.input} autoFocus
                  placeholder="Зал, Подписки, Спорт..."
                  value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={handleKeyDown} maxLength={16} />
                <button className={styles.nextBtn2}
                  onClick={() => newLabel.trim() && setStep('icon')}
                  disabled={!newLabel.trim()}>
                  Далее →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.addHint}>
                <span className={styles.chosenIcon}>
                  <CatIcon icon={newIcon} size={18} color="var(--terracotta)" />
                </span>
                Иконка для «{newLabel}»
              </div>
              <div className={styles.iconGrid}>
                {ICON_PICKER.map(({ name, label }) => (
                  <button key={name} title={label}
                    className={`${styles.iconBtn} ${newIcon === name ? styles.iconSel : ''}`}
                    onClick={() => setNewIcon(name)}>
                    <CatIcon icon={name} size={20}
                      color={newIcon === name ? 'var(--terracotta)' : 'var(--brown-light)'}
                      strokeWidth={newIcon === name ? 2 : 1.75} />
                  </button>
                ))}
              </div>
              <div className={styles.emojiActions}>
                <button className={styles.backBtn} onClick={() => setStep('label')}>Назад</button>
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
