import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { sendMail, bookingConfirmationHtml, bookingOwnerNotificationHtml, refundConfirmationHtml, refundNotificationHtml, paymentFailedNotificationHtml } from '../lib/mailer.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })

const router = Router()

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Must use raw body for signature verification — mount BEFORE express.json()
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification')
    res.json({ received: true })
    return
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    console.error('Webhook signature verification failed:', msg)
    res.status(400).send(`Webhook Error: ${msg}`)
    return
  }

  // Respond immediately so Stripe doesn't time out waiting for email sends
  res.json({ received: true })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      console.log('Booking confirmed:', {
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
        ...meta,
      })

      const reservationRef = session.id.slice(-8).toUpperCase()
      const guestEmail = meta.guestEmail || session.customer_email || (session as any).customer_details?.email || ''
      const guestName = meta.guestName || (session as any).customer_details?.name || 'Guest'
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''
      const totalAud = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00'
      const checkIn = meta.checkIn ? formatDate(meta.checkIn) : '—'
      const checkOut = meta.checkOut ? formatDate(meta.checkOut) : '—'

      console.log('Sending emails — guestEmail:', guestEmail || '(none)', '| notificationEmail:', notificationEmail || '(none)')

      Promise.allSettled([
        guestEmail
          ? sendMail({
              to: guestEmail,
              subject: `Booking Confirmed — ${meta.listingName ?? 'The Meriden Collection'}`,
              html: bookingConfirmationHtml({
                guestName,
                listingName: meta.listingName ?? 'The Meriden Collection',
                reservationRef,
                checkIn,
                checkOut,
                guests: meta.guests ?? '—',
                nights: meta.nights ?? '—',
              }),
            })
          : Promise.resolve(),
        notificationEmail
          ? sendMail({
              to: notificationEmail,
              subject: `New Booking — ${guestName} · ${meta.checkIn ?? reservationRef}`,
              html: bookingOwnerNotificationHtml({
                guestName,
                guestEmail,
                guestPhone: meta.guestPhone ?? '—',
                listingName: meta.listingName ?? 'Unknown listing',
                checkIn,
                checkOut,
                guests: meta.guests ?? '—',
                nights: meta.nights ?? '—',
                totalAud,
                reservationRef,
                specialRequests: meta.specialRequests ?? '',
              }),
            })
          : Promise.resolve(),
      ]).then(results => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') console.error(`Booking email ${i} failed:`, r.reason)
          else console.log(`Booking email ${i} sent OK`)
        })
      })

      // TODO: create Hostaway reservation
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout expired:', session.id)
      break
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const guestEmail = charge.billing_details?.email || charge.receipt_email || ''
      const guestName = charge.billing_details?.name || 'Guest'
      const amountRefunded = `$${(charge.amount_refunded / 100).toFixed(2)} ${charge.currency.toUpperCase()}`
      const reservationRef = charge.id.slice(-8).toUpperCase()
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''

      console.log('Refund processed:', { chargeId: charge.id, amountRefunded: charge.amount_refunded })

      Promise.allSettled([
        guestEmail
          ? sendMail({
              to: guestEmail,
              subject: `Refund Processed — The Meriden Collection`,
              html: refundConfirmationHtml({ guestName, amount: amountRefunded, reservationRef }),
            })
          : Promise.resolve(),
        notificationEmail
          ? sendMail({
              to: notificationEmail,
              subject: `Refund Issued — ${guestName} · ${amountRefunded}`,
              html: refundNotificationHtml({ guestName, guestEmail, amount: amountRefunded, reservationRef, chargeId: charge.id }),
            })
          : Promise.resolve(),
      ]).then(results => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') console.error(`Refund email ${i} error:`, r.reason)
        })
      })
      break
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const guestEmail = pi.last_payment_error?.payment_method?.billing_details?.email || ''
      const amount = `$${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`
      const errorMessage = pi.last_payment_error?.message || 'Unknown error'
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || ''

      console.log('Payment failed:', { paymentIntentId: pi.id, error: errorMessage })

      if (notificationEmail) {
        sendMail({
          to: notificationEmail,
          subject: `Payment Failed — ${amount}`,
          html: paymentFailedNotificationHtml({ paymentIntentId: pi.id, amount, guestEmail, errorMessage }),
        }).catch(err => console.error('Payment failed email error:', err))
      }
      break
    }
    default:
      break
  }
})

export default router
