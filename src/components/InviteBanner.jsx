import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './InviteBanner.module.css'

export default function InviteBanner({ userId }) {
  const [inviteCode, setInviteCode] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { generateCode() }, [])

  async function generateCode() {
    // Check existing invite
    const { data: existing } = await supabase
      .from('invites')
      .select('code')
      .eq('created_by', userId)
      .eq('used', false)
      .single()

    if (existing) {
      setInviteCode(existing.code)
      return
    }

    // Create new invite
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data } = await supabase
      .from('invites')
      .insert({ code, created_by: userId, used: false })
      .select()
      .single()

    if (data) setInviteCode(data.code)
  }

  const inviteUrl = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.emoji}>💌</div>
        <div className={styles.title}>Пригласи партнёра</div>
        <div className={styles.sub}>
          Отправь ссылку — и вы сможете вести общий бюджет вместе
        </div>

        {inviteCode && (
          <div className={styles.linkBox}>
            <div className={styles.linkText}>{inviteUrl}</div>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>
        )}

        {!inviteCode && (
          <div className={styles.loading}>генерируем ссылку...</div>
        )}
      </div>
    </div>
  )
}
