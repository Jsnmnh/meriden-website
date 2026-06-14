import { Router, Request, Response } from 'express'
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sendMail, assessmentNotificationHtml, inquiryAutoReplyHtml } from '../lib/mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

interface InquiryBody {
  name: string
  email: string
  phone: string
  address: string
  bedrooms: string
  package: string
  notes: string
  weeklyRent: string
}

async function appendToSheet(data: InquiryBody) {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) { console.warn('GOOGLE_SHEET_ID not set — skipping sheet'); return }

  let credentials: Record<string, unknown>
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const jsonFile = path.join(__dirname, '../../google-service-account.json')

  if (jsonEnv) {
    credentials = JSON.parse(jsonEnv)
  } else if (fs.existsSync(jsonFile)) {
    credentials = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
  } else {
    console.warn('Google service account credentials not found — skipping sheet')
    return
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const ts = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', timeStyle: 'short' })

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[ts, data.name, data.email, data.phone, data.address, data.bedrooms, data.package, data.weeklyRent ? `$${data.weeklyRent}/wk` : '', data.notes]],
    },
  })
}

router.post('/', async (req: Request, res: Response) => {
  const data = req.body as InquiryBody
  if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim() || !data.address?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''

  const [notifyResult, autoReplyResult, sheetResult] = await Promise.allSettled([
    sendMail({
      to: notificationEmail,
      subject: `New Assessment Request — ${data.name} · ${data.address}`,
      html: assessmentNotificationHtml({
        name: data.name, email: data.email, phone: data.phone,
        address: data.address, bedrooms: data.bedrooms,
        pkg: data.package, weeklyRent: data.weeklyRent, notes: data.notes,
      }),
      replyTo: data.email,
    }),
    sendMail({
      to: data.email,
      subject: `We've received your enquiry — The Meriden Collection`,
      html: inquiryAutoReplyHtml(data.name),
      replyTo: notificationEmail,
    }),
    appendToSheet(data),
  ])

  if (notifyResult.status === 'rejected') console.error('Notify email error:', notifyResult.reason)
  if (autoReplyResult.status === 'rejected') console.error('Auto-reply error:', autoReplyResult.reason)
  if (sheetResult.status === 'rejected') console.error('Sheet error:', sheetResult.reason)

  res.json({ ok: true })
})

export default router
