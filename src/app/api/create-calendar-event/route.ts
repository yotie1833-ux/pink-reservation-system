import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

type EventPayload = {
  menuType: string
  duration: number
  price: number
  date: string
  time: string
}

export async function POST(req: NextRequest) {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!refreshToken) {
    console.warn('[Google Calendar] GOOGLE_REFRESH_TOKEN 未設定 - スキップ')
    return NextResponse.json({ skipped: true, reason: 'refresh token not configured' })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const payload: EventPayload = await req.json()
  const { menuType, duration, price, date, time } = payload

  console.log('[Google Calendar] イベント作成開始:', payload)

  const startDateTime = new Date(`${date}T${time}:00+09:00`)
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)

  const event = {
    summary: `【予約】${menuType} ${duration}分コース`,
    description: [
      `■ メニュー：${menuType}`,
      `■ コース　：${duration}分コース`,
      `■ 料金　　：¥${price.toLocaleString()}`,
      `■ 予約日時：${date} ${time}`,
    ].join('\n'),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Asia/Tokyo',
    },
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  })

  console.log('[Google Calendar] 作成成功:', response.data.htmlLink)

  return NextResponse.json({ success: true, eventLink: response.data.htmlLink })
}
