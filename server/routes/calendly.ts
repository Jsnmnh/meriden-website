import { Router, Request, Response } from 'express'
import { sendMail, calendlyBookingHtml } from '../lib/mailer.js'

const router = Router()

function formatCalendlyTime(isoString: string, timezone: string) {
  try {
    return new Date(isoString).toLocaleString('en-AU', {
      timeZone: timezone || 'Australia/Sydney',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch {
    return isoString
  }
}

router.post('/', async (req: Request, res: Response) => {
  const { event, payload } = req.body ?? {}

  if (event !== 'invitee.created') {
    res.json({ received: true })
    return
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''
  if (!notificationEmail) {
    res.json({ received: true })
    return
  }

  const inviteeName: string = payload?.name ?? 'Unknown'
  const inviteeEmail: string = payload?.email ?? ''
  const eventName: string = payload?.scheduled_event?.name ?? 'Consultation'
  const timezone: string = payload?.timezone ?? 'Australia/Sydney'
  const startIso: string = payload?.scheduled_event?.start_time ?? ''
  const endIso: string = payload?.scheduled_event?.end_time ?? ''

  try {
    await sendMail({
      to: notificationEmail,
      subject: `Calendly Booking — ${inviteeName}`,
      html: calendlyBookingHtml({
        inviteeName,
        inviteeEmail,
        eventName,
        startTime: formatCalendlyTime(startIso, timezone),
        endTime: formatCalendlyTime(endIso, timezone),
        timezone,
      }),
    })
  } catch (err) {
    console.error('Calendly email error:', err)
  }

  res.json({ received: true })
})

export default router
