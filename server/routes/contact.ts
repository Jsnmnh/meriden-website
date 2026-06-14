import { Router, Request, Response } from 'express'
import { sendMail, contactNotificationHtml, contactAutoReplyHtml } from '../lib/mailer.js'

const router = Router()

interface ContactBody {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

router.post('/', async (req: Request, res: Response) => {
  const data = req.body as ContactBody
  if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''

  res.json({ ok: true })

  Promise.allSettled([
    sendMail({
      to: notificationEmail,
      subject: `Contact Form — ${data.name}${data.subject ? ` · ${data.subject}` : ''}`,
      html: contactNotificationHtml({
        name: data.name, email: data.email,
        phone: data.phone ?? '', subject: data.subject ?? '', message: data.message,
      }),
      replyTo: data.email,
    }),
    sendMail({
      to: data.email,
      subject: `Message received — The Meriden Collection`,
      html: contactAutoReplyHtml(data.name),
      replyTo: notificationEmail,
    }),
  ]).then(([notifyResult, autoReplyResult]) => {
    if (notifyResult.status === 'rejected') console.error('Notify email error:', notifyResult.reason)
    if (autoReplyResult.status === 'rejected') console.error('Auto-reply error:', autoReplyResult.reason)
  })
})

export default router
