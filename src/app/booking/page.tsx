'use client'

import { useState, useEffect } from 'react'
import liff from '@line/liff'
import { supabase } from '@/lib/supabase'

type MenuType = '対面占い'
type Duration = 15 | 30 | 60

type WorkSchedule = {
  work_date: string
  opening_time: string
  closing_time: string
}

const PRICES: Record<MenuType, Record<Duration, number>> = {
  '対面占い': { 15: 1500, 30: 3000, 60: 5000 },
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const fromMinutes = (total: number) => {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateTimeSlots(opening: string, closing: string, duration: number): string[] {
  const openMin = toMinutes(opening)
  const closeMin = toMinutes(closing)
  const slots: string[] = []
  let cur = openMin
  while (cur + duration <= closeMin) {
    slots.push(fromMinutes(cur))
    cur += 30
  }
  return slots
}

const STEPS = ['メニュー', '時間', '日時', '確認']

const PINK = '#dd488d'
const ACCENT_PINK = '#FF69B4'
const GOLD = '#D4AF37'

// ---- sub components ----

function Header() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1.8rem', display: 'inline-block', animation: 'spin 6s linear infinite' }}>🌙</span>
        <h1 style={{ color: PINK, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '0.04em', margin: 0 }}>
          Pink占い予約
        </h1>
        <span style={{ fontSize: '1.8rem', display: 'inline-block', animation: 'spin 4s linear infinite reverse' }}>☀️</span>
      </div>


    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isActive = currentStep === stepNum
        const isDone = currentStep > stepNum
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isDone ? GOLD : isActive ? PINK : '#E5E7EB',
                  color: isDone || isActive ? '#fff' : '#666666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  boxShadow: isActive ? `0 0 0 4px ${PINK}35` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: isActive ? PINK : '#666666',
                  marginTop: '0.3rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 36,
                  height: 2,
                  background: currentStep > stepNum ? GOLD : '#E5E7EB',
                  margin: '0 4px',
                  marginBottom: '1.1rem',
                  transition: 'all 0.3s ease',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Card({ children, justify = 'space-between' }: { children: React.ReactNode; justify?: string }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '1.5rem 1.5rem',
        boxShadow: '0 8px 32px rgba(221,72,141,0.15)',
        maxWidth: '360px',
        width: '100%',
        margin: '0 auto',
        height: 'calc(100vh - 185px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        color: PINK,
        textAlign: 'center',
        fontSize: '1.4rem',
        fontWeight: 'bold',
        marginBottom: '1.25rem',
      }}
    >
      {children}
    </h2>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 2,
        background: disabled
          ? '#E5E7EB'
          : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
        color: disabled ? '#666666' : 'white',
        border: disabled ? 'none' : `2px solid ${GOLD}`,
        borderRadius: '9999px',
        padding: '0.8rem',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 4px 12px ${PINK}40`,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      {!disabled && <span style={{ color: GOLD, fontSize: '0.75rem' }}>✦</span>}
      {children}
      {!disabled && <span style={{ color: GOLD, fontSize: '0.75rem' }}>✦</span>}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: '2px solid #D1D5DB',
        borderRadius: '9999px',
        padding: '0.8rem',
        color: '#4B5563',
        fontWeight: 'bold',
        background: 'white',
        cursor: 'pointer',
        fontSize: '0.95rem',
      }}
    >
      ← 戻る
    </button>
  )
}

// ---- steps ----

function MenuStep({
  menu,
  setMenu,
  onNext,
}: {
  menu: MenuType | null
  setMenu: (m: MenuType) => void
  onNext: () => void
}) {
  const options = [
    { type: '対面占い' as MenuType, icon: '🌙', desc: '直接お会いしてカード占いします\n\n📍 開運サロン HiRAKU\n宮崎市橘通東３丁目1-11\nアゲインビル１階（ホテルメリージュ隣）' },
  ]

  return (
    <Card>
      <StepTitle>占いの種類を選んでください</StepTitle>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {options.map(({ type, icon, desc }) => (
          <button
            key={type}
            onClick={() => setMenu(type)}
            style={{
              width: '100%',
              border: `2px solid ${menu === type ? PINK : GOLD}`,
              borderRadius: '1rem',
              padding: '1rem 1rem',
              background: menu === type ? `${PINK}12` : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: menu === type
                ? `0 0 0 3px ${PINK}25`
                : '0 2px 8px rgba(0,0,0,0.05)',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: 7, left: 10, color: GOLD, fontSize: '0.65rem' }}>✦</span>
            <span style={{ position: 'absolute', top: 7, right: 10, color: GOLD, fontSize: '0.65rem' }}>✦</span>
            <span style={{ position: 'absolute', bottom: 7, left: 10, color: GOLD, fontSize: '0.65rem' }}>✦</span>
            <span style={{ position: 'absolute', bottom: 7, right: 10, color: GOLD, fontSize: '0.65rem' }}>✦</span>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{icon}</div>
            <div style={{ color: '#333333', fontWeight: 'bold', fontSize: '1rem' }}>{type}</div>
            <div
              style={{
                color: '#666666',
                fontSize: '0.85rem',
                marginTop: '0.35rem',
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
              }}
            >
              {desc}
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 'auto', width: '100%', display: 'flex' }}>
        <PrimaryButton onClick={onNext} disabled={!menu}>
          次へ進む →
        </PrimaryButton>
      </div>
    </Card>
  )
}

function DurationStep({
  menu,
  duration,
  setDuration,
  onBack,
  onNext,
}: {
  menu: MenuType
  duration: Duration | null
  setDuration: (d: Duration) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <Card>
      <StepTitle>コースを選んでください</StepTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
        {([15, 30, 60] as Duration[]).map((d) => {
          const p = PRICES[menu][d]
          const isSelected = duration === d
          return (
            <button
              key={d}
              onClick={() => setDuration(d)}
              style={{
                border: `2px solid ${isSelected ? PINK : GOLD}`,
                borderRadius: '1rem',
                padding: '0.9rem 1.25rem',
                background: isSelected ? `${PINK}10` : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: isSelected
                  ? `0 0 0 3px ${PINK}25`
                  : '0 2px 6px rgba(0,0,0,0.05)',
                position: 'relative',
              }}
            >
              {d === 60 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    background: GOLD,
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    letterSpacing: '0.05em',
                  }}
                >
                  お得
                </span>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#333333', fontWeight: 'bold', fontSize: '1rem' }}>{d}分コース</div>
                <div style={{ color: '#666666', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                  {d === 15 ? 'お試しに最適' : d === 30 ? 'じっくり相談' : 'たっぷり鑑定'}
                </div>
              </div>
              <div style={{ color: ACCENT_PINK, fontWeight: 'bold', fontSize: '1.2rem' }}>
                ¥{p.toLocaleString()}
              </div>
            </button>
          )
        })}
      </div>
      <p
        style={{
          color: '#666666',
          fontSize: '0.72rem',
          textAlign: 'center',
          margin: '0.75rem 0 1.25rem',
          lineHeight: 1.6,
        }}
      >
        ※延長をご希望の場合は10分¥1,000〜承ります
        <br />（当日ご相談ください）
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onNext} disabled={!duration}>
          次へ進む →
        </PrimaryButton>
      </div>
    </Card>
  )
}

function DateTimeStep({
  date,
  setDate,
  time,
  setTime,
  onBack,
  onNext,
  workSchedules,
  duration,
}: {
  date: string
  setDate: (d: string) => void
  time: string
  setTime: (t: string) => void
  onBack: () => void
  onNext: () => void
  workSchedules: Record<string, WorkSchedule>
  duration: number
}) {
  const [dateError, setDateError] = useState<string | null>(null)
  const schedule = date ? workSchedules[date] : null
  const timeSlots = schedule ? generateTimeSlots(schedule.opening_time, schedule.closing_time, duration) : []
  const isUnavailable = date ? !workSchedules[date] : false

  const handleDateChange = (newDate: string) => {
    const now = new Date()
    const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const todayJST = jstTime.toISOString().split('T')[0]
    if (newDate < todayJST) {
      setDateError('過去の日付は選択できません。')
      setDate('')
      setTime('')
      return
    }
    setDate(newDate)
    setTime('')
    setDateError(null)
    if (newDate && !workSchedules[newDate]) {
      setDateError('この日は予約を受け付けていません。\n別の日付をお選びください。')
    }
  }

  return (
    <Card>
      <StepTitle>日時を選んでください</StepTitle>
      <div style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', overflow: 'hidden' }}>
          <label
            style={{
              color: '#666666',
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            📅 日付
          </label>
          {date && (
            <div style={{
              width: '100%',
              border: `2px solid ${dateError ? '#FC8181' : PINK}`,
              borderRadius: '1rem',
              padding: '1rem',
              fontSize: '1rem',
              color: '#333',
              background: `${PINK}12`,
              boxSizing: 'border-box' as const,
              textAlign: 'center' as const,
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
          )}
          {Object.keys(workSchedules).length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {Object.values(workSchedules).sort((a, b) => a.work_date.localeCompare(b.work_date)).map((s) => {
                const d = new Date(s.work_date + 'T00:00:00')
                const dayNames2 = ['日','月','火','水','木','金','土']
                return (
                  <button key={s.work_date} onClick={() => handleDateChange(s.work_date)}
                    style={{
                      fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '9999px',
                      border: `1px solid ${date === s.work_date ? PINK : GOLD}`,
                      background: date === s.work_date ? `${PINK}15` : 'white',
                      color: date === s.work_date ? PINK : '#555',
                      cursor: 'pointer', fontWeight: date === s.work_date ? 700 : 400,
                    }}>
                    {d.getMonth()+1}/{d.getDate()}({dayNames2[d.getDay()]})
                  </button>
                )
              })}
            </div>
          )}
          {dateError && (
            <p style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.4rem', textAlign: 'center', whiteSpace: 'pre-line' }}>
              {dateError}
            </p>
          )}
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              color: '#666666',
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            🕐 時間
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={isUnavailable || !date}
            style={{
              width: '100%',
              border: `2px solid ${time ? PINK : GOLD}`,
              borderRadius: '1rem',
              padding: '1.5rem 1rem',
              fontSize: '1rem',
              outline: 'none',
              color: time ? '#333333' : '#666666',
              background: isUnavailable || !date ? '#F5F5F5' : time ? `${PINK}12` : 'white',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              margin: 0,
              WebkitAppearance: 'none',
            }}
          >
            <option value="">時間を選択してください</option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onNext} disabled={!date || !time || isUnavailable || !!dateError}>
          次へ進む →
        </PrimaryButton>
      </div>
    </Card>
  )
}

function ConfirmStep({
  duration,
  date,
  time,
  price,
  customerName,
  phoneNumber,
  setCustomerName,
  setPhoneNumber,
  onBack,
  onConfirm,
  loading,
  error,
}: {
  duration: Duration
  date: string
  time: string
  price: number
  onBack: () => void
  onConfirm: () => void
  loading: boolean
  error: string | null
  customerName: string
  phoneNumber: string
  setCustomerName: (v: string) => void
  setPhoneNumber: (v: string) => void
}) {
  const dateObj2 = new Date(date + 'T00:00:00')
  const dayNames2 = ['日','月','火','水','木','金','土']
  const formattedDate = `${dateObj2.getFullYear()}年${dateObj2.getMonth()+1}月${dateObj2.getDate()}日（${dayNames2[dateObj2.getDay()]}）`

  const rows = [
    { icon: '⏱', label: 'コース', value: `${duration}分コース`, valueColor: '#333333' },
    { icon: '💰', label: '料金', value: `¥${price.toLocaleString()}`, valueColor: ACCENT_PINK },
    { icon: '📅', label: '日付', value: formattedDate, valueColor: '#333333' },
    { icon: '🕐', label: '時間', value: time, valueColor: '#333333' },
  ]

  return (
    <Card>
      <StepTitle>予約内容を確認してください</StepTitle>
      <div style={{ paddingLeft: '1rem', paddingRight: '1rem', marginBottom: '0.25rem' }}>
      {/* お名前・携帯番号 */}
      <div style={{ paddingLeft: '1rem', paddingRight: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ color: '#666666', fontWeight: 'bold', fontSize: '1.05rem', display: 'block', marginBottom: '0.5rem' }}>
            👤 お名前
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="例：田中 花子"
            style={{
              width: '100%',
              border: `2px solid ${customerName ? '#dd488d' : '#BBBBBB'}`,
              borderRadius: '0.75rem',
              padding: '1rem 0.75rem',
              fontSize: '1.1rem',
              outline: 'none',
              color: '#333',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>
        <div>
          <label style={{ color: '#666666', fontWeight: 'bold', fontSize: '1.05rem', display: 'block', marginBottom: '0.5rem' }}>
            📱 携帯番号
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="例：090-1234-5678"
            style={{
              width: '100%',
              border: `2px solid ${phoneNumber ? '#dd488d' : '#BBBBBB'}`,
              borderRadius: '0.75rem',
              padding: '1rem 0.75rem',
              fontSize: '1.1rem',
              outline: 'none',
              color: '#333',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>
      </div>
      <div
        style={{
          border: `2px solid ${GOLD}`,
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          marginTop: '2.5rem',
        }}
      >
        {rows.map(({ icon, label, value, valueColor }, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.3rem 0.75rem',
              background: i % 2 === 0 ? 'white' : `${PINK}05`,
              gap: '0.75rem',
            }}
          >
            <div style={{ flexShrink: 0, color: '#666666', fontSize: '0.82rem', fontWeight: 600, width: '4.5rem' }}>
              {icon}&nbsp;{label}
            </div>
            <div style={{ flex: 1, color: valueColor, fontWeight: 'bold', fontSize: '0.92rem', textAlign: 'left' }}>{value}</div>
          </div>
        ))}
      </div>
      </div>

      {error && (
        <p style={{ color: '#e53e3e', fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <BackButton onClick={onBack} />
        <button
          onClick={onConfirm}
          disabled={loading || !customerName || !phoneNumber}
          style={{
            flex: 2,
            background: loading ? '#E5E7EB' : `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
            color: loading ? '#666666' : 'white',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.8rem',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 16px ${PINK}45`,
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? '送信中...' : '予約を確定する ✨'}
        </button>
      </div>
    </Card>
  )
}

function CompletedScreen({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFE5F1, #FFD6E8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '1.5rem',
          padding: '1.5rem 1.5rem',
          textAlign: 'center',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(221,72,141,0.15)',
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
        <h2 style={{ color: PINK, fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          予約が完了しました！
        </h2>
        <p style={{ color: '#666666', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          ご予約ありがとうございます。
          <br />
          当日を楽しみにお待ちください。
        </p>
        <div
          style={{
            background: '#F0FFF4',
            border: '1px solid #68D391',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            marginBottom: '1.75rem',
          }}
        >
          <p style={{ color: '#276749', fontSize: '0.8rem', margin: 0, lineHeight: 1.7 }}>
            📩 予約の詳細をLINEにお送りしました。
            <br />
            内容をご確認ください。
          </p>
        </div>
        <button
          onClick={onReset}
          style={{
            width: '100%',
            background: `linear-gradient(135deg, ${PINK}, ${ACCENT_PINK})`,
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.85rem',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${PINK}40`,
          }}
        >
          トップに戻る
        </button>
      </div>
    </div>
  )
}

// ---- main ----

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [menu, setMenu] = useState<MenuType | null>(null)
  const [duration, setDuration] = useState<Duration | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [workSchedules, setWorkSchedules] = useState<Record<string, WorkSchedule>>({})

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
        } else {
          liff.login()
        }
      } catch (e) {
        console.error('[LIFF] 初期化エラー:', e)
      }
    }
    initLiff()
  }, [])

  useEffect(() => {
    const fetchWorkSchedules = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .gte('work_date', today)
      if (data) {
        const map: Record<string, WorkSchedule> = {}
        data.forEach((r: WorkSchedule) => { map[r.work_date] = r })
        setWorkSchedules(map)
      }
      if (error) {
        console.error('[出勤日] 取得エラー:', error.message)
      }
    }
    fetchWorkSchedules()
  }, [])

  const price = menu && duration ? PRICES[menu][duration] : 0

  const handleConfirm = async () => {
    console.log('[予約確定] ボタンクリック')

    if (!menu || !duration) {
      console.warn('[予約確定] menu または duration が未選択:', { menu, duration })
      return
    }

    // ── 過去日付チェック ──
    const todayStr = new Date().toISOString().split('T')[0]
    if (date < todayStr) {
      setError('過去の日付は予約できません。別の日付をお選びください。')
      setLoading(false)
      return
    }

    // ── 出勤日チェック ──
    if (!workSchedules[date]) {
      setError('申し訳ございません。選択された日は予約を受け付けていません。別の日付をお選びください。')
      return
    }

    // ── 営業時間チェック ──
    const ws = workSchedules[date]
    const openTime = ws.opening_time.slice(0, 5)
    const closeTime = ws.closing_time.slice(0, 5)
    if (time < openTime || time > closeTime) {
      setError(`この日の受付時間は${openTime}〜${closeTime}です。別の時間をお選びください。`)
      return
    }

    setLoading(true)
    setError(null)

    // ── 重複チェック ──
    console.log('[重複チェック] 選択日時:', date, time)
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('reservation_time, duration, status')
      .eq('reservation_date', date)
      .neq('status', 'cancelled')

    console.log('[重複チェック] 既存予約:', existing)

    if (fetchError) {
      console.error('[重複チェック] 取得エラー:', fetchError.message)
      setLoading(false)
      setError('予約状況の確認に失敗しました。もう一度お試しください。')
      return
    }

    const selectedStart = toMinutes(time)
    const selectedEnd = selectedStart + duration

    const isConflict = (existing ?? []).some((r) => {
      const existStart = toMinutes(r.reservation_time)
      const existEnd = existStart + r.duration
      // 時間帯が重なる場合: 既存の開始 < 選択の終了 かつ 既存の終了 > 選択の開始
      return existStart < selectedEnd && existEnd > selectedStart
    })

    console.log('[重複チェック] 結果:', isConflict ? '重複あり' : '重複なし')

    if (isConflict) {
      setLoading(false)
      setError('申し訳ございません。選択された時間は既に予約が入っています。別の時間をお選びください。')
      return
    }

    // ── 予約保存 ──
    const payload = {
      menu_type: menu,
      duration,
      price,
      reservation_date: date,
      reservation_time: time,
      customer_name: customerName,
      phone_number: phoneNumber,
      customer_line_id: lineUserId,
    }
    console.log('[Supabase] 送信データ:', payload)

    const { data, error: dbError } = await supabase
      .from('reservations')
      .insert(payload)
      .select()

    console.log('[Supabase] レスポンス data:', data)
    console.log('[Supabase] レスポンス error:', dbError)

    setLoading(false)

    if (dbError) {
      console.error('[Supabase] エラー詳細:', dbError.message, dbError.details, dbError.hint)
      setError('予約の送信に失敗しました。もう一度お試しください。')
      return
    }

    // ── LINE通知送信 ──
    console.log('[LINE] 通知送信開始')
    try {
      const lineRes = await fetch('/api/send-line-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuType: menu,
          duration,
          price,
          date,
          time,
          lineUserId,
          customerName,
          phoneNumber,
        }),
      })
      if (!lineRes.ok) {
        const errBody = await lineRes.text()
        console.error('[LINE] 送信失敗:', errBody)
      } else {
        console.log('[LINE] 送信成功')
      }
    } catch (lineErr) {
      console.error('[LINE] 送信例外:', lineErr)
    }

    // ── Google Calendar イベント作成 ──
    console.log('[Google Calendar] イベント作成開始')
    try {
      const calRes = await fetch('/api/create-calendar-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuType: menu,
          duration,
          price,
          date,
          time,
          lineUserId,
          customerName,
          phoneNumber,
        }),
      })
      const calData = await calRes.json()
      if (calData.skipped) {
        console.log('[Google Calendar] スキップ（トークン未設定）')
      } else if (calData.success) {
        console.log('[Google Calendar] 作成成功:', calData.eventLink)
      } else {
        console.error('[Google Calendar] 作成失敗:', calData)
      }
    } catch (calErr) {
      console.error('[Google Calendar] 送信例外:', calErr)
    }

    console.log('[予約確定] 成功 → 完了画面へ')
    setCompleted(true)
  }

  const reset = () => {
    setStep(1)
    setMenu(null)
    setDuration(null)
    setDate('')
    setTime('')
    setCustomerName('')
    setPhoneNumber('')
    setCompleted(false)
    setError(null)
  }

  if (completed) {
    return <CompletedScreen onReset={reset} />
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFE5F1, #FFD6E8)',
          padding: '1rem 1rem',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <Header />
          <StepIndicator currentStep={step} />

          {step === 1 && (
            <MenuStep
              menu={menu}
              setMenu={(m) => { setMenu(m) }}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && menu && (
            <DurationStep
              menu={menu}
              duration={duration}
              setDuration={(d) => setDuration(d)}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <DateTimeStep
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              workSchedules={workSchedules}
              duration={duration ?? 30}
            />
          )}
          {step === 4 && menu && duration && (
            <ConfirmStep
              duration={duration}
              date={date}
              time={time}
              price={price}
              customerName={customerName}
              phoneNumber={phoneNumber}
              setCustomerName={setCustomerName}
              setPhoneNumber={setPhoneNumber}
              onBack={() => setStep(3)}
              onConfirm={handleConfirm}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </>
  )
}
