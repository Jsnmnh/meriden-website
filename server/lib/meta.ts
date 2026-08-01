export const BASE_URL = 'https://themeridencollection.com'
const DEFAULT_IMAGE = `${BASE_URL}/gallery/pool.jpg`

export interface PageMeta {
  path: string
  title: string
  description: string
  image?: string
}

export const STATIC_PAGE_META: Record<string, PageMeta> = {
  '/': {
    path: '/',
    title: 'Airbnb & Short-Term Rental Management Sydney | The Meriden Collection',
    description: "Sydney's premium short-term rental management company. Earn up to 50% more than long-term leasing — fully managed, hassle-free.",
  },
  '/services': {
    path: '/services',
    title: 'STR Management Services Sydney | The Meriden Collection',
    description: 'Fully managed Airbnb service covering listing optimisation, dynamic pricing, guest communication, cleaning and maintenance. View our Essentials and Signature packages.',
  },
  '/about': {
    path: '/about',
    title: 'About Us | The Meriden Collection Sydney',
    description: "Meet the team behind Sydney's premium short-term rental management company — dedicated to maximising your property's earning potential.",
  },
  '/partner': {
    path: '/partner',
    title: 'List Your Property | Short-Term Rental Management Sydney',
    description: 'Partner with The Meriden Collection. Get a free property assessment and discover how much your Sydney property could earn on Airbnb.',
  },
  '/schedule': {
    path: '/schedule',
    title: 'Schedule a Free Consultation | The Meriden Collection',
    description: "Book a free 30-minute consultation with our Sydney STR management team. We'll assess your property and outline your earning potential.",
  },
  '/book': {
    path: '/book',
    title: 'Book a Luxury Stay in Sydney | The Meriden Collection',
    description: 'Browse and book premium short-term rentals in Sydney through The Meriden Collection. Exceptional properties, fully managed.',
  },
  '/contact': {
    path: '/contact',
    title: 'Contact Us | The Meriden Collection Sydney',
    description: 'Get in touch with The Meriden Collection. We manage short-term rentals across Sydney — reach us by email, phone or via our contact form.',
  },
  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy | The Meriden Collection',
    description: 'Privacy policy for The Meriden Collection — how we collect, use and protect your personal information.',
  },
  '/terms': {
    path: '/terms',
    title: 'Terms & Conditions | The Meriden Collection',
    description: 'Terms and conditions for using The Meriden Collection website and booking services.',
  },
  '/thankyou': {
    path: '/thankyou',
    title: 'Thank You | The Meriden Collection',
    description: 'Thank you for getting in touch with The Meriden Collection.',
  },
}

export function metaForListing(id: number, listing: Record<string, unknown> | null): PageMeta {
  const name = (listing?.name as string) || 'Luxury Stay'
  const city = (listing?.city as string) || 'Sydney'
  const rawDesc = ((listing?.description as string) || '').replace(/\s+/g, ' ').trim()
  const description = rawDesc
    ? (rawDesc.length > 155 ? `${rawDesc.slice(0, 152)}...` : rawDesc)
    : 'View this premium short-term rental property managed by The Meriden Collection in Sydney.'
  const images = (listing?.listingImages as Array<{ url: string; sortOrder?: number }> | undefined) ?? []
  const image = images.length > 0
    ? [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0].url
    : undefined

  return {
    path: `/listing/${id}`,
    title: `${name} — ${city} | The Meriden Collection`,
    description,
    image,
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const STATIC_SITEMAP_ENTRIES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/services', priority: '0.9', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/partner', priority: '0.9', changefreq: 'monthly' },
  { path: '/schedule', priority: '0.8', changefreq: 'monthly' },
  { path: '/book', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
]

export function buildSitemapXml(listingIds: number[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    ...STATIC_SITEMAP_ENTRIES.map(e => ({ loc: `${BASE_URL}${e.path}`, priority: e.priority, changefreq: e.changefreq })),
    ...listingIds.map(id => ({ loc: `${BASE_URL}/listing/${id}`, priority: '0.8', changefreq: 'daily' })),
  ]
  const body = urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function injectMeta(html: string, meta: PageMeta): string {
  const url = `${BASE_URL}${meta.path}`
  const image = meta.image ?? DEFAULT_IMAGE
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)

  return html
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
    .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`)
    .replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${image}"`)
}
