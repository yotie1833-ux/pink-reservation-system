import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const customerToken = process.env.LINE_CUSTOMER_CHANNEL_ACCESS_TOKEN!

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 日本時間で「明日」の日付を取得
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const tomorrow = new Date(jst)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  console.log('[Reminder] 対象日付:', tomorrowStr)

  // 明日の予約をSupabaseから取得
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', tomorrowStr)
    .neq('status', 'cancelled')

  if (error) {
    console.error('[Reminder] Supabase取得エラー:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  console.log('[Reminder] 対象予約件数:', reservations?.length ?? 0)

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const dateObj = new Date(tomorrowStr + 'T00:00:00')
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${dayNames[dateObj.getDay()]}）`

  let successCount = 0
  let skipCount = 0

  for (const r of reservations ?? []) {
    if (!r.customer_line_id) {
      console.log('[Reminder] LINE ID未取得のためスキップ:', r.customer_name)
      skipCount++
      continue
    }

    const message = [
      '【明日のご予約リマインド】',
      '',
      `${r.customer_name ? r.customer_name + ' 様' : 'お客様'}、明日のご予約をお知らせします ✨`,
      '',
      `■ メニュー：${r.menu_type}`,
      `■ コース　：${r.duration}分コース`,
      `■ 料金　　：¥${r.price.toLocaleString()}`,
      `■ 予約日　：${formattedDate}`,
      `■ 予約時間：${r.reservation_time}`,
      '',
      '📍 開運サロン HiRAKU',
      '宮崎市橘通東３丁目1-11',
      'アゲインビル１階（ホテルメリージュ隣）',
      '',
      'ご不明な点はLINEにてお気軽にご連絡ください♡',
      '',
      'お会いできるのを楽しみにしています✨',
      '',
      'Pink -ピンク-',
    ].join('\n')

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        to: r.customer_line_id,
        messages: [{ type: 'text', text: message }],
      }),
    })

    const resText = await res.text()
    console.log(`[Reminder] ${r.customer_name} → status:${res.status}`, resText)

    if (res.ok) {
      successCount++
    }
  }

  return NextResponse.json({
    success: true,
    date: tomorrowStr,
    total: reservations?.length ?? 0,
    sent: successCount,
    skipped: skipCount,
  })
}
