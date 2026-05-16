'use client'

import { useState } from 'react'

const PINK = '#dd488d'
const ACCENT_PINK = '#FF69B4'
const GOLD = '#D4AF37'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.success) {
      localStorage.setItem('admin_auth', 'true')
      window.location.href = '/admin'
    } else {
      setError('パスワードが正しくありません。')
    }
  }

  const disabled = !password || loading

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFE5F1, #FFD6E8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '1.5rem',
        padding: '2.5rem 2rem', maxWidth: '360px', width: '100%',
        boxShadow: '0 8px 32px rgba(221,72,141,0.15)',
      }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🌙</span>
            <h1 style={{ color: PINK, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.04em', margin: 0 }}>
              予約管理
            </h1>
            <span style={{ fontSize: '1.6rem' }}>☀️</span>
          </div>
          <p style={{ color: PINK, fontSize: '0.85rem', letterSpacing: '0.25em', margin: '0.2rem 0 0.6rem' }}>
            Pink -ピンク-
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ color: GOLD, fontSize: '1rem' }}>✦</span>
            ))}
          </div>
        </div>

        <h2 style={{ color: '#333', fontSize: '1rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.75rem' }}>
          🔐 管理者ログイン
        </h2>

        {/* パスワード入力 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#666', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="パスワードを入力してください"
            style={{
              width: '100%',
              border: `2px solid ${error ? '#FC8181' : password ? PINK : '#D1D5DB'}`,
              borderRadius: '0.75rem',
              padding: '0.65rem 0.75rem',
              fontSize: '1rem', outline: 'none',
              color: '#333', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.75rem' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={disabled}
          style={{
            width: '100%', padding: '0.85rem',
            background: disabled ? '#E5E7EB' : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
            color: disabled ? '#666' : 'white',
            border: disabled ? 'none' : `2px solid ${GOLD}`,
            borderRadius: '9999px', fontWeight: 700,
            fontSize: '1rem', cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: disabled ? 'none' : `0 4px 12px ${PINK}40`,
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? 'ログイン中...' : '✦ ログイン ✦'}
        </button>
      </div>
    </div>
  )
}
