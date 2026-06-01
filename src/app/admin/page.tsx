'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ---- types ----

type Reservation = {
  id: string
  menu_type: string
  duration: number
  price: number
  reservation_date: string
  reservation_time: string
  customer_name: string | null
  phone_number: string | null
  customer_line_id: string | null
  status: string
  created_at: string
}

// ---- constants ----

const PINK = '#dd488d'
const ACCENT_PINK = '#FF69B4'
const GOLD = '#D4AF37'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: '確定', color: '#276749', bg: '#F0FFF4' },
  cancelled: { label: 'キャンセル', color: '#9B2C2C', bg: '#FFF5F5' },
  completed: { label: '完了', color: '#2B6CB0', bg: '#EBF8FF' },
}

const PRICES: Record<string, Record<number, number>> = {
  '対面占い': { 15: 1500, 30: 3000, 60: 5000 },
  '電話占い': { 15: 1250, 30: 2500, 60: 4000 },
}

const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
]

// ---- sub components ----

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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: '#555', bg: '#f5f5f5' }
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: '0.72rem',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: '9999px',
      border: `1px solid ${s.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function StatusSelect({ id, status, onChange }: {
  id: string
  status: string
  onChange: (id: string, newStatus: string) => void
}) {
  const s = STATUS_LABEL[status] ?? { label: status, color: '#555', bg: '#f5f5f5' }
  return (
    <select
      value={status}
      onChange={(e) => onChange(id, e.target.value)}
      style={{
        border: `2px solid ${s.color}70`,
        borderRadius: '9999px',
        padding: '3px 10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        paddingRight: '1.5rem',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.4rem center',
      }}
    >
      <option value="confirmed">確定</option>
      <option value="cancelled">キャンセル</option>
    </select>
  )
}

function DetailModal({ reservation, onClose, onDelete }: {
  reservation: Reservation
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const rows = [
    { label: '予約日', value: new Date(reservation.reservation_date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) },
    { label: '予約時間', value: reservation.reservation_time.slice(0, 5) },
    { label: 'お名前', value: reservation.customer_name ?? '未入力' },
    { label: 'メニュー', value: reservation.menu_type },
    { label: 'コース', value: `${reservation.duration}分` },
    { label: '電話番号', value: reservation.phone_number ?? '未入力' },
    { label: 'ステータス', value: <StatusBadge status={reservation.status} /> },
    { label: '登録日時', value: new Date(reservation.created_at).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '1.25rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ color: PINK, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>予約詳細</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ border: `1px solid ${GOLD}60`, borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
          {rows.map(({ label, value }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.55rem 1rem',
              background: i % 2 === 0 ? 'white' : `${PINK}05`,
            }}>
              <div style={{ width: '5.5rem', flexShrink: 0, color: '#666', fontSize: '0.78rem', fontWeight: 600 }}>{label}</div>
              <div style={{ flex: 1, color: '#333', fontSize: '0.88rem', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '9999px',
              border: '2px solid #D1D5DB', background: 'white',
              color: '#4B5563', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            閉じる
          </button>
          <button
            onClick={() => { onDelete(reservation.id); onClose() }}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: '9999px',
              border: 'none', background: '#FED7D7',
              color: '#9B2C2C', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ reservation, onClose, onSaved }: {
  reservation: Reservation
  onClose: () => void
  onSaved: () => void
}) {
  const [date, setDate] = useState(reservation.reservation_date)
  const [time, setTime] = useState(reservation.reservation_time)
  const [menuType, setMenuType] = useState(reservation.menu_type)
  const [duration, setDuration] = useState(reservation.duration)
  const [price, setPrice] = useState(reservation.price)
  const [status, setStatus] = useState(reservation.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // メニューまたはコース変更時に料金を自動計算
  useEffect(() => {
    const auto = PRICES[menuType]?.[duration]
    if (auto !== undefined) setPrice(auto)
  }, [menuType, duration])

  const handleSave = async () => {
    if (!date || !time) {
      setError('予約日と時間は必須です。')
      return
    }
    setSaving(true)
    setError(null)
    const { error: dbError } = await supabase
      .from('reservations')
      .update({ reservation_date: date, reservation_time: time, menu_type: menuType, duration, price, status })
      .eq('id', reservation.id)
    setSaving(false)
    if (dbError) {
      setError('保存に失敗しました：' + dbError.message)
      return
    }
    onSaved()
    onClose()
  }

  const fieldLabel: React.CSSProperties = {
    color: '#666', fontSize: '0.78rem', fontWeight: 600,
    display: 'block', marginBottom: '0.3rem',
  }
  const fieldInput: React.CSSProperties = {
    width: '100%', borderRadius: '0.6rem', padding: '0.5rem 0.75rem',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#333',
    background: 'white',
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: PINK, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>✏️ 予約の編集</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* 予約日 */}
          <div>
            <label style={fieldLabel}>📅 予約日</label>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...fieldInput, border: `2px solid ${date ? PINK : '#D1D5DB'}` }}
            />
          </div>

          {/* 予約時間 */}
          <div>
            <label style={fieldLabel}>🕐 予約時間</label>
            <select value={time} onChange={(e) => setTime(e.target.value)}
              style={{ ...fieldInput, border: `2px solid ${time ? PINK : '#D1D5DB'}` }}>
              <option value="">時間を選択</option>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* メニュー */}
          <div>
            <label style={fieldLabel}>🌙 メニュー</label>
            <select value={menuType} onChange={(e) => setMenuType(e.target.value)}
              style={{ ...fieldInput, border: `2px solid ${PINK}` }}>
              <option value="対面占い">対面占い</option>
              <option value="電話占い">電話占い</option>
            </select>
          </div>

          {/* コース */}
          <div>
            <label style={fieldLabel}>⏱ コース</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              style={{ ...fieldInput, border: `2px solid ${PINK}` }}>
              <option value={15}>15分コース</option>
              <option value={30}>30分コース</option>
              <option value={60}>60分コース</option>
            </select>
          </div>

          {/* 料金 */}
          <div>
            <label style={fieldLabel}>💰 料金（自動計算・手動変更可）</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.9rem' }}>¥</span>
              <input
                type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                style={{ ...fieldInput, border: `2px solid ${GOLD}`, paddingLeft: '1.6rem' }}
              />
            </div>
          </div>

          {/* ステータス */}
          <div>
            <label style={fieldLabel}>📋 ステータス</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{ ...fieldInput, border: `2px solid ${STATUS_LABEL[status]?.color ?? '#D1D5DB'}70`, color: STATUS_LABEL[status]?.color ?? '#333', background: STATUS_LABEL[status]?.bg ?? 'white', fontWeight: 700 }}>
              <option value="confirmed">確定</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.75rem' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.7rem', borderRadius: '9999px', border: '2px solid #D1D5DB', background: 'white', color: '#4B5563', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, padding: '0.7rem', borderRadius: '9999px', border: saving ? 'none' : `2px solid ${GOLD}`, background: saving ? '#E5E7EB' : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`, color: saving ? '#666' : 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
          >
            {saving ? '保存中...' : '✦ 保存する ✦'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- main ----

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState('')
  const [filterMenu, setFilterMenu] = useState('')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [editing, setEditing] = useState<Reservation | null>(null)

  useEffect(() => {
    if (localStorage.getItem('admin_auth') !== 'true') {
      window.location.href = '/admin/login'
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    window.location.href = '/admin/login'
  }

  const fetchReservations = async () => {
    setLoading(true)
    setError(null)
    const { data, error: dbError } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false })
    console.log('[fetch] エラー:', dbError)
    console.log('[fetch] データ:', data)
    if (data && data.length > 0) {
      console.log('[fetch] 1件目のキー:', Object.keys(data[0]))
      console.log('[fetch] 1件目のid:', data[0].id)
    }
    if (dbError) {
      setError('データの取得に失敗しました。')
    } else {
      setReservations(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchReservations() }, [])

  const handleDelete = async (id: string) => {
    console.log('[削除] 受け取ったID:', id, '型:', typeof id)
    if (id === undefined || id === null || id === '') {
      console.error('[削除] IDが無効です')
      alert('削除できません：IDが取得できませんでした。')
      return
    }
    if (!confirm(`この予約を削除しますか？\nID: ${id}`)) return
    console.log('[削除] Supabaseへ送信: id =', id)
    const { error: dbError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
    console.log('[削除] レスポンス error:', dbError)
    if (dbError) {
      console.error('[削除] エラー詳細:', dbError.message, dbError.details)
      alert('削除に失敗しました：' + dbError.message)
      return
    }
    console.log('[削除] 成功 → 一覧を再取得')
    await fetchReservations()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error: dbError } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id)
    if (dbError) {
      alert('ステータスの更新に失敗しました：' + dbError.message)
      return
    }
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
  }

  const handleExportCsv = () => {
    const headers = ['予約日', '時間', 'メニュー', 'コース', '料金', 'ステータス', '作成日時']
    const rows = filtered.map((r) => [
      r.reservation_date,
      r.reservation_time,
      r.menu_type,
      `${r.duration}分`,
      r.price.toString(),
      STATUS_LABEL[r.status]?.label ?? r.status,
      new Date(r.created_at).toLocaleString('ja-JP'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    link.href = url
    link.download = `reservations_${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = reservations.filter((r) => {
    if (filterDate && r.reservation_date !== filterDate) return false
    if (filterMenu && r.menu_type !== filterMenu) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFE5F1, #FFD6E8)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <AdminHeader />
        <NavTabs active="list" onLogout={handleLogout} />

        {/* フィルター */}
        <div style={{
          background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 16px rgba(221,72,141,0.1)', marginBottom: '1.25rem',
          display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ color: '#666', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
              📅 日付で絞り込み
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                width: '100%', border: `2px solid ${filterDate ? PINK : '#D1D5DB'}`,
                borderRadius: '0.6rem', padding: '0.5rem 0.75rem',
                fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#333',
              }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ color: '#666', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
              🔍 メニューで絞り込み
            </label>
            <select
              value={filterMenu}
              onChange={(e) => setFilterMenu(e.target.value)}
              style={{
                width: '100%', border: `2px solid ${filterMenu ? PINK : '#D1D5DB'}`,
                borderRadius: '0.6rem', padding: '0.5rem 0.75rem',
                fontSize: '0.9rem', outline: 'none', background: 'white',
                boxSizing: 'border-box', color: '#333',
              }}
            >
              <option value="">すべて</option>
              <option value="対面占い">対面占い</option>
              <option value="電話占い">電話占い</option>
            </select>
          </div>
          <button
            onClick={() => { setFilterDate(''); setFilterMenu('') }}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '9999px',
              border: `2px solid ${GOLD}`, background: 'white',
              color: '#555', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            リセット
          </button>
          <button
            onClick={fetchReservations}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '9999px',
              border: 'none', background: `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
              color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            更新
          </button>
          <button
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '9999px',
              border: `2px solid ${GOLD}`, background: 'white',
              color: filtered.length === 0 ? '#bbb' : '#555',
              fontWeight: 700, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', whiteSpace: 'nowrap',
            }}
          >
            📥 CSV
          </button>
        </div>

        {/* 件数 */}
        <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'right' }}>
          {loading ? '読み込み中...' : `${filtered.length} 件`}
        </p>

        {/* エラー */}
        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FC8181', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', color: '#9B2C2C', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* テーブル */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 16px rgba(221,72,141,0.1)', overflow: 'hidden' }}>
          {/* PC テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})` }}>
                  {['予約日', '時間', 'お名前', 'メニュー', 'コース', '料金', 'ステータス', '操作'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', color: 'white', fontSize: '0.8rem',
                      fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                      予約データがありません
                    </td>
                  </tr>
                )}
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : `${PINK}05`, borderBottom: `1px solid ${PINK}15` }}>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#333', whiteSpace: 'nowrap' }}>
                      {new Date(r.reservation_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#333' }}>
                      {r.reservation_time}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#333' }}>
                      {r.customer_name ?? '—'}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: PINK, fontWeight: 600 }}>
                      {r.menu_type}
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#333' }}>
                      {r.duration}分
                    </td>
                    <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: ACCENT_PINK, fontWeight: 700 }}>
                      ¥{r.price.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <StatusSelect id={r.id} status={r.status} onChange={handleStatusChange} />
                    </td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelected(r)}
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '9999px',
                            border: `2px solid ${GOLD}`, background: 'white',
                            color: '#555', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => setEditing(r)}
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '9999px',
                            border: `2px solid ${PINK}`, background: `${PINK}10`,
                            color: PINK, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '9999px',
                            border: 'none', background: '#FED7D7',
                            color: '#9B2C2C', fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 件数サマリー */}
        {!loading && filtered.length > 0 && (
          <div style={{
            marginTop: '1rem', background: 'white', borderRadius: '1rem',
            padding: '1rem 1.5rem', boxShadow: '0 4px 16px rgba(221,72,141,0.1)',
            display: 'flex', gap: '2rem', flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ color: '#666', fontSize: '0.78rem' }}>合計件数</span>
              <span style={{ color: PINK, fontWeight: 700, fontSize: '1.1rem', marginLeft: '0.5rem' }}>{filtered.length}件</span>
            </div>
            <div>
              <span style={{ color: '#666', fontSize: '0.78rem' }}>合計売上</span>
              <span style={{ color: ACCENT_PINK, fontWeight: 700, fontSize: '1.1rem', marginLeft: '0.5rem' }}>
                ¥{filtered.reduce((sum, r) => sum + r.price, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <DetailModal
          reservation={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}

      {/* 編集モーダル */}
      {editing && (
        <EditModal
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchReservations}
        />
      )}
    </div>
  )
}
