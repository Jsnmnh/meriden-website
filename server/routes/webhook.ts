import { Router, Request, Response } from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })

const router = Router()

// Must use raw body for signature verification — mount BEFORE express.json()
router.post('/', (req: Request, res: Response) => {
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Booking confirmed:', {
        sessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
        ...session.metadata,
      })
      // TODO: send confirmation email, create Hostaway reservation
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout expired:', session.id)
      break
    }
    default:
      break
  }

  res.json({ received: true })
})

export default router
