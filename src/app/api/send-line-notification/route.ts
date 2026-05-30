import { NextRequest, NextResponse } from 'next/server'

type NotificationPayload = {
  menuType: string
  duration: number
  price: number
  date: string
  time: string
  lineUserId?: string
  customerName?: string
}

function buildMessage(payload: NotificationPayload): string {
  const { menuType, duration, price, date, time, customerName } = payload

  const dateObj = new Date(date + 'T00:00:00')
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${dayNames[dateObj.getDay()]}）`

  return [
    '【ご予約完了のお知らせ】',
    '',
    `${customerName ? customerName + ' 様' : 'お客様'}、ご予約ありがとうございます ✨`,
    '',
    `■ メニュー：${menuType}`,
    `■ コース　：${duration}分コース`,
    `■ 料金　　：¥${price.toLocaleString()}`,
    `■ 予約日　：${formattedDate}`,
    `■ 予約時間：${time}`,
    '',
    'ご不明な点はLINEにてお気軽にご連絡ください♡',
    '',
    'お話しできるのを楽しみにしています✨',
    '',
    'Pink -ピンク-',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const customerToken = process.env.LINE_CUSTOMER_CHANNEL_ACCESS_TOKEN

  if (!customerToken) {
    console.error('[LINE] LINE_CUSTOMER_CHANNEL_ACCESS_TOKEN が設定されていません')
    return NextResponse.json({ error: 'LINE token not configured' }, { status: 500 })
  }

  const payload: NotificationPayload = await req.json()
  console.log('[LINE] 通知送信開始:', payload)

  const message = buildMessage(payload)

  if (!payload.lineUserId) {
    console.warn('[LINE] lineUserId が未設定のため通知をスキップ')
    return NextResponse.json({ skipped: true })
  }

  // お客様への個別通知（Push API）
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      to: payload.lineUserId,
      messages: [{ type: 'text', text: message }],
    }),
  })

  const resText = await res.text()
  console.log('[LINE] レスポンス status:', res.status)
  console.log('[LINE] レスポンス body:', resText)

  if (!res.ok) {
    return NextResponse.json(
      { error: 'LINE API エラー', status: res.status, body: resText },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
