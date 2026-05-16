import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// このエンドポイントにアクセスすると Google の認証画面にリダイレクトされます
// http://localhost:3000/api/google-auth にアクセスして認証を完了してください
export async function GET() {
  console.log('======================')
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID)
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET)
  console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI)
  console.log('======================')

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  })

  console.log('生成された認証URL:', authUrl)

  return NextResponse.redirect(authUrl)
}
