import { Router, Request, Response } from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })

interface CheckoutBody {
  listingId: number
  listingName: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  pricePerNight: number
  totalNightlyCost?: number
  cleaningFee: number
  gst: number
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string
  specialRequests?: string
}

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as CheckoutBody
  const {
    listingId, listingName, checkIn, checkOut, guests, nights,
    pricePerNight, totalNightlyCost, cleaningFee, gst,
    guestFirstName, guestLastName, guestEmail, guestPhone, specialRequests,
  } = body
  const accommodationAmount = totalNightlyCost ?? nights * pricePerNight

  if (!listingId || !checkIn || !checkOut || !nights || nights < 1) {
    return res.status(400).json({ error: 'Missing required booking fields' })
  }

  const origin = req.headers.origin ?? 'http://localhost:5173'
  const guestName = `${guestFirstName} ${guestLastName}`.trim()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: guestEmail || undefined,
      billing_address_collection: 'required',
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: Math.round(accommodationAmount * 100),
            product_data: {
              name: `${listingName ?? 'The Meriden Collection'} — ${nights} night${nights !== 1 ? 's' : ''}`,
              description: `${checkIn} to ${checkOut} · ${guests} guest${guests !== 1 ? 's' : ''}`,
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'aud',
            unit_amount: Math.round(cleaningFee * 100),
            product_data: { name: 'Cleaning fee' },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'aud',
            unit_amount: Math.round(gst * 100),
            product_data: { name: 'GST (10%)' },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?booking=cancelled`,
      metadata: {
        listingId: String(listingId),
        listingName: listingName ?? 'The Meriden Collection',
        checkIn,
        checkOut,
        guests: String(guests),
        nights: String(nights),
        guestName,
        guestEmail: guestEmail ?? '',
        guestPhone: guestPhone ?? '',
        specialRequests: specialRequests ?? '',
      },
    })

    res.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    console.error('Checkout error:', msg)
    res.status(500).json({ error: msg })
  }
})

export default router
