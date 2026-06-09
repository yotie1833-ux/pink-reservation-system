'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const PINK = '#dd488d'
const ACCENT_PINK = '#FF69B4'
const GOLD = '#D4AF37'

type WorkSchedule = {
  work_date: string
  opening_time: string
  closing_time: string
}

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
        <a href="/admin" style={{
          flex: 1, textAlign: 'center', padding: '0.65rem', borderRadius: '0.7rem',
          fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
          background: active === 'list' ? `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})` : 'transparent',
          color: active === 'list' ? 'white' : '#888',
        }}>📋 予約一覧</a>
        <a href="/admin/settings" style={{
          flex: 1, textAlign: 'center', padding: '0.65rem', borderRadius: '0.7rem',
          fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
          background: active === 'settings' ? `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})` : 'transparent',
          color: active === 'settings' ? 'white' : '#888',
        }}>⚙️ 設定</a>
      </div>
      <button onClick={onLogout} style={{
        padding: '0.6rem 1rem', borderRadius: '9999px',
        border: '2px solid #D1D5DB', background: 'white',
        color: '#888', fontWeight: 700, fontSize: '0.82rem',
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}>ログアウト</button>
    </div>
  )
}

function CalendarPicker({
  year, month, schedules, onToggleDate, onTimeChange,
}: {
  year: number
  month: number
  schedules: Record<string, WorkSchedule>
  onToggleDate: (dateStr: string) => void
  onTimeChange: (dateStr: string, field: 'opening_time' | 'closing_time', value: string) => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['日','月','火','水','木','金','土'].map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, padding: '4px 0',
            color: i === 0 ? '#e53e3e' : i === 6 ? '#3182ce' : '#666',
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = !!schedules[dateStr]
          const isPast = dateStr < today
          const dow = idx % 7
          return (
            <div key={idx}>
              <button
                onClick={() => !isPast && onToggleDate(dateStr)}
                disabled={isPast}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: '0.5rem',
                  border: isSelected ? `2px solid ${PINK}` : '1px solid #e5e7eb',
                  background: isSelected ? `${PINK}18` : isPast ? '#f5f5f5' : 'white',
                  color: isPast ? '#ccc' : isSelected ? PINK : dow === 0 ? '#e53e3e' : dow === 6 ? '#3182ce' : '#333',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '0.85rem', cursor: isPast ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >{day}</button>
              {isSelected && (
                <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <input type="time" value={schedules[dateStr].opening_time}
                    onChange={(e) => onTimeChange(dateStr, 'opening_time', e.target.value)}
                    style={{ width: '100%', fontSize: '0.65rem', border: `1px solid ${PINK}`, borderRadius: '4px', padding: '2px 4px', color: '#333', boxSizing: 'border-box' as const }} />
                  <input type="time" value={schedules[dateStr].closing_time}
                    onChange={(e) => onTimeChange(dateStr, 'closing_time', e.target.value)}
                    style={{ width: '100%', fontSize: '0.65rem', border: `1px solid ${GOLD}`, borderRadius: '4px', padding: '2px 4px', color: '#333', boxSizing: 'border-box' as const }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [schedules, setSchedules] = useState<Record<string, WorkSchedule>>({})
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
    const fetch = async () => {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('work_schedules').select('*')
      if (data) {
        const map: Record<string, WorkSchedule> = {}
        data.forEach((r: WorkSchedule) => {
          if (r.work_date >= todayStr) {
            map[r.work_date] = r
          }
        })
        setSchedules(map)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleToggleDate = (dateStr: string) => {
    setSchedules((prev) => {
      const next = { ...prev }
      if (next[dateStr]) {
        delete next[dateStr]
      } else {
        next[dateStr] = { work_date: dateStr, opening_time: '10:00', closing_time: '18:00' }
      }
      return next
    })
  }

  const handleTimeChange = (dateStr: string, field: 'opening_time' | 'closing_time', value: string) => {
    setSchedules((prev) => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const rows = Object.values(schedules)
    const { data: existing } = await supabase.from('work_schedules').select('work_date')
    const existingDates = (existing ?? []).map((r: { work_date: string }) => r.work_date)
    const newDates = rows.map((r) => r.work_date)
    const toDelete = existingDates.filter((d: string) => !newDates.includes(d))
    if (toDelete.length > 0) {
      await supabase.from('work_schedules').delete().in('work_date', toDelete)
    }
    if (rows.length > 0) {
      const rowsWithId = rows.map((r) => ({ ...r, id: crypto.randomUUID() }))
      const { error } = await supabase.from('work_schedules').upsert(rowsWithId, { onConflict: 'work_date' })
      if (error) {
        setMessage({ type: 'error', text: '保存に失敗しました：' + error.message })
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setMessage({ type: 'success', text: '出勤日を保存しました ✓' })
    setTimeout(() => setMessage(null), 3000)
  }

  const monthLabel = `${viewYear}年${viewMonth + 1}月`
  const selectedCount = Object.keys(schedules).filter((d) => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)).length

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
              <h2 style={{ color: PINK, fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${GOLD}40` }}>
                📅 出勤日・時間の設定
              </h2>
              <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                日付をクリックして出勤日をON/OFFできます。出勤日には開始・終了時間を設定してください。
              </p>

              {/* 月ナビゲーション */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={() => {
                  if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
                  else setViewMonth(m => m - 1)
                }} style={{ padding: '0.4rem 0.9rem', borderRadius: '9999px', border: '2px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>‹</button>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: PINK, fontWeight: 700, fontSize: '1.1rem' }}>{monthLabel}</span>
                  {selectedCount > 0 && <span style={{ marginLeft: '0.5rem', background: `${PINK}15`, color: PINK, fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>{selectedCount}日出勤</span>}
                </div>
                <button onClick={() => {
                  if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
                  else setViewMonth(m => m + 1)
                }} style={{ padding: '0.4rem 0.9rem', borderRadius: '9999px', border: '2px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>›</button>
              </div>

              <CalendarPicker
                year={viewYear}
                month={viewMonth}
                schedules={schedules}
                onToggleDate={handleToggleDate}
                onTimeChange={handleTimeChange}
              />

              {/* 出勤日一覧 */}
              {Object.keys(schedules).length > 0 && (
                <div style={{ marginTop: '1.5rem', borderTop: `1px solid ${GOLD}30`, paddingTop: '1rem' }}>
                  <p style={{ color: '#666', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.6rem' }}>📋 登録済み出勤日一覧</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Object.values(schedules).sort((a, b) => a.work_date.localeCompare(b.work_date)).map((s) => {
                      const d = new Date(s.work_date + 'T00:00:00')
                      const dayNames = ['日','月','火','水','木','金','土']
                      return (
                        <span key={s.work_date} style={{
                          background: `${PINK}10`, border: `1px solid ${PINK}40`,
                          borderRadius: '0.5rem', padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem', color: PINK, fontWeight: 600,
                        }}>
                          {d.getMonth() + 1}/{d.getDate()}({dayNames[d.getDay()]}) {s.opening_time}〜{s.closing_time}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {message && (
                <div style={{
                  marginTop: '1rem',
                  background: message.type === 'success' ? '#F0FFF4' : '#FFF5F5',
                  border: `1px solid ${message.type === 'success' ? '#68D391' : '#FC8181'}`,
                  borderRadius: '0.75rem', padding: '0.75rem 1rem',
                  color: message.type === 'success' ? '#276749' : '#9B2C2C',
                  fontSize: '0.85rem', textAlign: 'center',
                }}>
                  {message.text}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} style={{
                marginTop: '1.5rem', width: '100%', padding: '0.85rem',
                background: saving ? '#E5E7EB' : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
                color: saving ? '#666' : 'white',
                border: saving ? 'none' : `2px solid ${GOLD}`,
                borderRadius: '9999px', fontWeight: 700,
                fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? '保存中...' : '✦ 出勤日を保存する ✦'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
