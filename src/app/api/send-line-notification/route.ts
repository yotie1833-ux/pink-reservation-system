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

function buildCustomerMessage(payload: NotificationPayload): string {
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

function buildOwnerMessage(payload: NotificationPayload): string {
  const { menuType, duration, price, date, time, customerName } = payload
  const dateObj = new Date(date + 'T00:00:00')
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${dayNames[dateObj.getDay()]}）`
  return [
    '【新規予約が入りました！】',
    '',
    `■ お客様名：${customerName || '未入力'}`,
    `■ メニュー：${menuType}`,
    `■ コース　：${duration}分コース`,
    `■ 料金　　：¥${price.toLocaleString()}`,
    `■ 予約日　：${formattedDate}`,
    `■ 予約時間：${time}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const customerToken = process.env.LINE_CUSTOMER_CHANNEL_ACCESS_TOKEN
  const ownerToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  const payload: NotificationPayload = await req.json()
  console.log('[LINE] 通知送信開始:', payload)

  // お客様への個別通知（Push API）
  if (payload.lineUserId && customerToken) {
    const customerRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        to: payload.lineUserId,
        messages: [{ type: 'text', text: buildCustomerMessage(payload) }],
      }),
    })
    const customerResText = await customerRes.text()
    console.log('[LINE] お客様通知 status:', customerRes.status, customerResText)
  }

  // 占い師さんへの通知（Broadcast API）
  if (ownerToken) {
    const ownerRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        messages: [{ type: 'text', text: buildOwnerMessage(payload) }],
      }),
    })
    const ownerResText = await ownerRes.text()
    console.log('[LINE] 占い師通知 status:', ownerRes.status, ownerResText)
  }

  return NextResponse.json({ success: true })
}
