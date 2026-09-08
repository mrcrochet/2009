'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from '../../account/account.module.css'

export function SignInForm({ claim }: { claim: string | null }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const supabase = createClient()
    if (!supabase) {
      setMessage('accounts are not configured')
      setState('error')
      return
    }
    setState('sending')
    const next = `/account${claim ? `?claim=${encodeURIComponent(claim)}` : ''}`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) {
      setMessage(error.message)
      setState('error')
      return
    }
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <section className={styles.card}>
        <div className={styles.cardTitle}>Check your email</div>
        <div className={styles.mono}>A sign-in link is on its way to {email}.</div>
      </section>
    )
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <label className={styles.mono} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          background: '#080a0c',
          border: '1px solid #2c333a',
          color: '#dbe3e8',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      />
      <div className={styles.row}>
        <button type="submit" className="hal-cta" disabled={state === 'sending'}>
          {state === 'sending' ? 'SENDING…' : 'SEND THE LINK'}
        </button>
      </div>
      {message ? <div className={styles.mono}>{message}</div> : null}
    </form>
  )
}
