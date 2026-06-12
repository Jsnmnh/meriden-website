import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import listingsRouter from './routes/listings.js'
import checkoutRouter from './routes/checkout.js'
import webhookRouter from './routes/webhook.js'

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

// In production, serve the built React app
if (isProd) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`)
})
