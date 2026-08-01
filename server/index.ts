import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import listingsRouter from './routes/listings.js'
import checkoutRouter from './routes/checkout.js'
import webhookRouter from './routes/webhook.js'
import inquiryRouter from './routes/inquiry.js'
import contactRouter from './routes/contact.js'
import calendlyRouter from './routes/calendly.js'
import { getListingWithImages, getListingsCached } from './lib/hostaway.js'
import { STATIC_PAGE_META, metaForListing, injectMeta, buildSitemapXml } from './lib/meta.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

// In dev, allow any localhost port (Vite picks a free one)
if (!isProd) {
  app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }))
}

// Webhook needs raw body for Stripe signature verification — before express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRouter)

app.use(express.json())

app.use('/api/listings', listingsRouter)
app.use('/api/checkout', checkoutRouter)
app.use('/api/partner-inquiry', inquiryRouter)
app.use('/api/contact', contactRouter)
app.use('/api/calendly-webhook', calendlyRouter)

// In production, serve the built React app with per-route SEO meta injected into index.html
if (isProd) {
  const distPath = path.join(__dirname, '../dist')
  const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8')

  app.use(express.static(distPath, { index: false }))

  app.get('/sitemap.xml', async (_req, res) => {
    let listingIds: number[] = []
    try {
      const listings = await getListingsCached() as Array<{ id: number }>
      listingIds = listings.map(l => l.id)
    } catch (_) {}
    res.type('application/xml').send(buildSitemapXml(listingIds))
  })

  app.get('/listing/:id', async (req, res) => {
    const id = Number(req.params.id)
    let listing: Record<string, unknown> | null = null
    if (!Number.isNaN(id)) {
      try {
        listing = await getListingWithImages(id)
      } catch (_) {}
    }
    res.send(injectMeta(indexHtml, metaForListing(id, listing)))
  })

  app.get('*', (req, res) => {
    const meta = STATIC_PAGE_META[req.path] ?? STATIC_PAGE_META['/']
    res.send(injectMeta(indexHtml, meta))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`)
})
