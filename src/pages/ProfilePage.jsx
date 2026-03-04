import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './SettingsPage.module.css'

const AVATAR_COLORS = ['#C96A3A','#8BA888','#7B9EC9','#C97BAA','#C9A83A','#7BC9C0']

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) { setProfile(data); setName(data.name||''); setGender(data.gender||'') }})
  }, [])

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles').update({ name, gender }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAvatar(e) {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setProfile(p => ({ ...p, avatar_url: publicUrl }))
    }
    setUploading(false)
  }

  const avatarColor = AVATAR_COLORS[(user.id?.charCodeAt(0)||0) % AVATAR_COLORS.length]
  const initials = (name || user.email || '?')[0].toUpperCase()

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>←</button>
          <div className={styles.headerTitle}>Профиль</div>
          <div />
        </div>

        <div className={styles.section}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatarWrap} onClick={() => fileRef.current?.click()}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className={styles.avatarImg} alt="avatar" />
                : <div className={styles.avatarPlaceholder} style={{ background: avatarColor }}>{initials}</div>}
              <div className={styles.avatarOverlay}>{uploading ? '...' : '📷'}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar} />
            <div className={styles.avatarHint}>нажми чтобы сменить фото</div>
          </div>

          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Имя</label>
              <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Твоё имя" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Пол</label>
              <div className={styles.genderRow}>
                {[{v:'female',l:'👩 Женский'},{v:'male',l:'👨 Мужской'},{v:'other',l:'🧑 Другой'}].map(g => (
                  <button key={g.v} type="button"
                    className={`${styles.genderBtn} ${gender === g.v ? styles.genderSel : ''}`}
                    onClick={() => setGender(g.v)}>{g.l}</button>
                ))}
              </div>
            </div>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
