import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const events = body.events ?? []

  for (const event of events) {
    const userId = event.source?.userId

    if (userId) {
      console.log('======================')
      console.log('管理者のUser ID:')
      console.log(userId)
      console.log('======================')

      // 返信
      const replyToken = event.replyToken
      if (replyToken) {
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            replyToken,
            messages: [
              {
                type: 'text',
                text: 'User IDを取得しました！ターミナルを確認してください。',
              },
            ],
          }),
        })
      }
    }
  }

  return NextResponse.json({ status: 'ok' })
}
