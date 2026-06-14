import { Router, Request, Response } from 'express'
import { getListings, getListing, getListingImages, getCalendar, getReviews } from '../lib/hostaway.js'
import { get, set } from '../lib/cache.js'

const router = Router()
const LISTING_TTL = 15 * 60 * 1000

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = get<unknown[]>('listings')
    if (cached) return res.json(cached)
    const data = await getListings()
    set('listings', data, LISTING_TTL)
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    const key = `listing:${id}`
    const cached = get<unknown>(key)
    if (cached) return res.json(cached)
    const data = await getListing(id) as Record<string, unknown>
    const imgs = data.listingImages as unknown[] | undefined
    if (!imgs || (Array.isArray(imgs) && imgs.length === 0)) {
      try {
        const imgData = await getListingImages(id)
        if (Array.isArray(imgData) && imgData.length > 0) data.listingImages = imgData
      } catch (_) {}
    }
    set(key, data, LISTING_TTL)
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

router.get('/:id/debug', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    const data = await getListing(id) as Record<string, unknown>
    const summary: Record<string, unknown> = {}
    for (const key of Object.keys(data)) {
      const val = data[key]
      if (Array.isArray(val)) summary[key] = `[Array(${val.length})] first: ${JSON.stringify(val[0]).slice(0, 120)}`
      else if (val !== null && typeof val === 'object') summary[key] = `[Object] ${JSON.stringify(val).slice(0, 120)}`
      else summary[key] = val
    }
    res.json(summary)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

router.get('/:id/reviews', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    const key = `reviews:${id}`
    const cached = get<unknown[]>(key)
    if (cached) return res.json(cached)
    const data = await getReviews(id) as Array<Record<string, unknown>>
    const filtered = Array.isArray(data)
      ? data.filter(r => Number(r.listingMapId) === id)
      : []
    set(key, filtered, LISTING_TTL)
    res.json(filtered)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

router.get('/:id/availability', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { startDate, endDate } = req.query as Record<string, string>
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }
  try {
    const data = await getCalendar(id, startDate, endDate)
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

router.get('/:id/calendar-debug', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const today = new Date()
  const start = today.toISOString().slice(0, 10)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().slice(0, 10)
  try {
    const data = await getCalendar(id, start, end) as Record<string, unknown>[]
    // Return first 10 entries showing all fields
    res.json((data ?? []).slice(0, 10))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
})

export default router
