import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2Client.getToken(code)

  console.log('======================')
  console.log('GOOGLE_REFRESH_TOKEN:')
  console.log(tokens.refresh_token)
  console.log('======================')
  console.log('.env.local に以下を追加してください:')
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log('======================')

  return new NextResponse(
    `
    <html>
      <body style="font-family:sans-serif;padding:2rem;background:#FFE5F1">
        <div style="background:white;border-radius:1rem;padding:2rem;max-width:500px;margin:0 auto">
          <h1 style="color:#dd488d">✅ 認証成功！</h1>
          <p>ターミナルに <strong>GOOGLE_REFRESH_TOKEN</strong> が表示されています。</p>
          <ol>
            <li>ターミナルを確認する</li>
            <li><code>.env.local</code> の <code>GOOGLE_REFRESH_TOKEN=</code> に値を貼り付ける</li>
            <li>開発サーバーを再起動する</li>
          </ol>
          <p style="color:#888;font-size:0.85rem">Refresh Token: <code>${tokens.refresh_token ?? '（取得できませんでした）'}</code></p>
        </div>
      </body>
    </html>
    `,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
