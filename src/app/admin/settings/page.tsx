'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const PINK = '#dd488d'
const ACCENT_PINK = '#FF69B4'
const GOLD = '#D4AF37'

const DAYS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']

function AdminHeader() {
  return (
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
  )
}

function NavTabs({ active, onLogout }: { active: 'list' | 'settings'; onLogout: () => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', alignItems: 'center' }}>
      <div style={{
        display: 'flex', gap: '0.4rem', flex: 1,
        background: 'white', borderRadius: '1rem', padding: '0.4rem',
        boxShadow: '0 4px 16px rgba(221,72,141,0.1)',
      }}>
        <a
          href="/admin"
          style={{
            flex: 1, textAlign: 'center', padding: '0.65rem', borderRadius: '0.7rem',
            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            background: active === 'list' ? `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})` : 'transparent',
            color: active === 'list' ? 'white' : '#888',
            transition: 'all 0.2s ease',
          }}
        >
          📋 予約一覧
        </a>
        <a
          href="/admin/settings"
          style={{
            flex: 1, textAlign: 'center', padding: '0.65rem', borderRadius: '0.7rem',
            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            background: active === 'settings' ? `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})` : 'transparent',
            color: active === 'settings' ? 'white' : '#888',
            transition: 'all 0.2s ease',
          }}
        >
          ⚙️ 設定
        </a>
      </div>
      <button
        onClick={onLogout}
        style={{
          padding: '0.6rem 1rem', borderRadius: '9999px',
          border: '2px solid #D1D5DB', background: 'white',
          color: '#888', fontWeight: 700, fontSize: '0.82rem',
          cursor: 'pointer', whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        ログアウト
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('18:00')
  const [closedDays, setClosedDays] = useState<string[]>(['日曜日'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (localStorage.getItem('admin_auth') !== 'true') {
      window.location.href = '/admin/login'
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    window.location.href = '/admin/login'
  }

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').limit(1).single()
      if (data) {
        setOpeningTime(data.opening_time)
        setClosingTime(data.closing_time)
        setClosedDays(data.closed_days ?? [])
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const toggleDay = (day: string) => {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      opening_time: openingTime,
      closing_time: closingTime,
      closed_days: closedDays,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: '保存に失敗しました：' + error.message })
    } else {
      setMessage({ type: 'success', text: '設定を保存しました ✓' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFE5F1, #FFD6E8)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <AdminHeader />
        <NavTabs active="settings" onLogout={handleLogout} />

        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 16px rgba(221,72,141,0.1)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '2rem 0' }}>読み込み中...</p>
          ) : (
            <>
              {/* 営業時間 */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  color: PINK, fontSize: '1rem', fontWeight: 700,
                  marginBottom: '1rem', paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${GOLD}40`,
                }}>
                  🕐 営業時間
                </h2>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ color: '#666', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      開始時間
                    </label>
                    <input
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      style={{
                        width: '100%', border: `2px solid ${PINK}`, borderRadius: '0.6rem',
                        padding: '0.55rem 0.75rem', fontSize: '1rem', outline: 'none',
                        color: '#333', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ color: '#666', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      終了時間
                    </label>
                    <input
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      style={{
                        width: '100%', border: `2px solid ${PINK}`, borderRadius: '0.6rem',
                        padding: '0.55rem 0.75rem', fontSize: '1rem', outline: 'none',
                        color: '#333', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.6rem' }}>
                  ※ 予約可能な最終枠は「終了時間 − コース時間」になります
                </p>
              </div>

              {/* 定休日 */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  color: PINK, fontSize: '1rem', fontWeight: 700,
                  marginBottom: '1rem', paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${GOLD}40`,
                }}>
                  📅 定休日
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {DAYS.map((day) => {
                    const checked = closedDays.includes(day)
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '0.5rem 1rem', borderRadius: '9999px',
                          border: `2px solid ${checked ? PINK : '#D1D5DB'}`,
                          background: checked ? `${PINK}15` : 'white',
                          color: checked ? PINK : '#555',
                          fontWeight: checked ? 700 : 400,
                          cursor: 'pointer', fontSize: '0.9rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {day.replace('曜日', '')}
                      </button>
                    )
                  })}
                </div>
                <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.75rem' }}>
                  ※ 選択した曜日は予約を受け付けません（ピンク色がON）
                </p>
              </div>

              {/* メッセージ */}
              {message && (
                <div style={{
                  background: message.type === 'success' ? '#F0FFF4' : '#FFF5F5',
                  border: `1px solid ${message.type === 'success' ? '#68D391' : '#FC8181'}`,
                  borderRadius: '0.75rem', padding: '0.75rem 1rem',
                  color: message.type === 'success' ? '#276749' : '#9B2C2C',
                  fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center',
                }}>
                  {message.text}
                </div>
              )}

              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%', padding: '0.85rem',
                  background: saving ? '#E5E7EB' : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
                  color: saving ? '#666' : 'white',
                  border: saving ? 'none' : `2px solid ${GOLD}`,
                  borderRadius: '9999px', fontWeight: 700,
                  fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : `0 4px 12px ${PINK}40`,
                  transition: 'all 0.2s ease',
                }}
              >
                {saving ? '保存中...' : '✦ 設定を保存する ✦'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
