import { Router, Request, Response } from 'express'
import { getListings, getListing, getCalendar } from '../lib/hostaway.js'
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
    const data = await getListing(id)
    set(key, data, LISTING_TTL)
    res.json(data)
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

export default router
