import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import ListingPage from './pages/ListingPage'

// ─── Constants ───────────────────────────────────────────────────────────────
const DARK_COLOR = '#2A2927'
const BRAND_NAME = 'The Meriden Collection'
const LOGO_TEXT = 'The Meriden Collection'
const ABN = '92 610 393 957'
const HOUSE_IMG = '/building.png'
const BG_IMG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260603_073200_7082add5-f1f8-4873-8696-d6f78a44089b.png&w=1920&q=85'
const GALLERY_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260528_154759_4cdc8175-8261-497c-b688-9477c76545d4.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260528_154751_39b1b9bb-2708-4211-b6a2-d39f93309e52.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260528_154737_eba7900c-0313-483c-a30a-632c747ccc42.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_144009_4348fe33-f885-4345-8e92-3fe1c2625d32.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_145337_e44eaa8c-6bb1-4a6e-a70f-ed0231cbaccb.mp4',
]

const CHAR_INTERVAL = 55
const TYPE_START = 600

type Page = 'home' | 'list' | 'book' | 'contact' | 'listing'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function smoothstep(t: number) { return t * t * (3 - 2 * t) }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// ─── Shared styles ───────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Josefin+Sans:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow-x: clip; background: #FFFFFF; }

  @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .hero-subtitle-desktop { display: none; }
  .hero-subtitle-mobile  { display: none; }

  @media (max-width: 639px) {
    .hero-subtitle-mobile  { display: block !important; }
    .hero-text-block { padding-top: 90px !important; }
    .hero-heading-top { justify-content: flex-start !important; }
    .hero-own-the { font-size: 7.5vw !important; }
    .hero-extraordinary { font-size: 14.5vw !important; white-space: normal !important; word-break: break-word !important; line-height: 0.9 !important; }
  }
  @media (min-width: 640px) and (max-width: 1023px) {
    .hero-subtitle-mobile  { display: block !important; }
    .hero-text-block { padding-top: 110px !important; }
    .hero-heading-top { justify-content: flex-start !important; }
    .hero-own-the { font-size: 5.5vw !important; }
    .hero-extraordinary { font-size: 11vw !important; white-space: normal !important; word-break: break-word !important; line-height: 0.9 !important; }
  }
  @media (min-width: 1024px) {
    .hero-subtitle-desktop { display: block !important; }
    .hero-subtitle-mobile  { display: none !important; }
    .hero-text-block { padding-top: calc(28vh - 50px) !important; }
    .hero-own-the { font-size: 3vw !important; }
    .hero-extraordinary { font-size: clamp(52px, 6.5vw, 9vw) !important; white-space: nowrap !important; line-height: 0.88 !important; }
  }

  @media (max-width: 767px) {
    .s2-content { padding-left: 1.5rem !important; }
    .s2-statement { white-space: normal !important; font-size: clamp(18px, 5vw, 28px) !important; }
    .s2-stats-row { padding-left: 0 !important; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .s2-content { padding-left: 2.5rem !important; }
    .s2-statement { white-space: normal !important; }
    .s2-stats-row { padding-left: 15% !important; }
  }

  @media (max-width: 1023px) {
    .s3-gallery-section { height: auto !important; min-height: 100vh; overflow: visible !important; }
    .s3-ticker-wrap { position: sticky; top: 0; height: 100vh; width: 100%; margin-bottom: -100vh; }
    .s3-gallery-content { height: auto !important; align-items: flex-start !important; padding: 80px 16px 60px !important; }
    .gallery-expand-row { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; height: auto !important; width: 100%; max-width: 700px; }
    .gallery-expand-item { flex: none !important; height: auto !important; aspect-ratio: 4/5; border-radius: 10px; transition: transform 0.3s ease !important; }
    .gallery-expand-item:hover { flex: none !important; transform: scale(1.02) !important; }
    .gallery-expand-item:last-child:nth-child(odd) { grid-column: 1 / -1; max-width: calc(50% - 4px); justify-self: center; }
  }
  @media (max-width: 479px) {
    .s3-gallery-content { padding: 60px 12px 48px !important; }
    .gallery-expand-row { gap: 6px !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  .form-input {
    width: 100%;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 14px;
    color: #000;
    background: transparent;
    border: none;
    border-bottom: 1px solid #ccc;
    padding: 12px 0;
    outline: none;
    transition: border-color 0.2s ease;
    letter-spacing: 0.02em;
  }
  .form-input::placeholder { color: #aaa; font-weight: 300; }
  .form-input:focus { border-color: #2A2927; }
  .form-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #888;
    display: block;
    margin-bottom: 4px;
  }
`

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const duration = 2000
          const tick = (now: number) => {
            const t = clamp((now - start) / duration, 0, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setVal(Math.round(eased * end))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end])

  return <span ref={ref}>{val}{suffix}</span>
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ color }: { color: string }) {
  return (
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.7rem, 1.2vw, 1rem)', color, transition: 'color 0.35s ease', letterSpacing: '0.08em', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {LOGO_TEXT}
    </span>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <footer style={{ background: '#2A2927', borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(40px, 5vw, 64px) clamp(24px, 4vw, 64px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
          <div>
            <Logo color="rgba(255,255,255,0.8)" />
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', letterSpacing: '0.05em' }}>
              {BRAND_NAME}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(24px, 4vw, 60px)', flexWrap: 'wrap' }}>
            {([
              { label: 'Services', page: 'home' as Page },
              { label: 'List with Us', page: 'list' as Page },
              { label: 'Book Now', page: 'book' as Page },
              { label: 'Contact', page: 'contact' as Page },
            ]).map(({ label, page }) => (
              <button
                key={label}
                onClick={() => { onNavigate(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.2s', padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            ABN {ABN}
          </span>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            © {new Date().getFullYear()} {BRAND_NAME}
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Calendly Embed ──────────────────────────────────────────────────────────
function CalendlyEmbed() {
  useEffect(() => {
    if (!document.querySelector('script[src*="calendly"]')) {
      const s = document.createElement('script')
      s.src = 'https://assets.calendly.com/assets/external/widget.js'
      s.async = true
      document.head.appendChild(s)
    }
  }, [])

  return (
    <div
      className="calendly-inline-widget"
      data-url="https://calendly.com/themeridencollection/30min"
      style={{ minWidth: '320px', height: '700px' }}
    />
  )
}

// ─── List with Us Page ───────────────────────────────────────────────────────
function ListPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', bedrooms: '', package: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const requiredFilled = !!(form.name.trim() && form.email.trim() && form.phone.trim() && form.address.trim())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!requiredFilled) return
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '100px' }}>
      <div style={{ maxWidth: submitted ? '860px' : '680px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 48px)', transition: 'max-width 0.3s ease' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '48px', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#000')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {submitted ? (
          <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Almost There</p>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(24px, 3vw, 40px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '12px' }}>
              Schedule Your Assessment
            </h1>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.75, marginBottom: '32px' }}>
              Pick a time that suits you and we'll take it from there.
            </p>
            <CalendlyEmbed />
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Free Assessment</p>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '12px' }}>
              Book Your Free<br />Revenue Assessment
            </h1>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.75, marginBottom: '48px' }}>
              We'll assess your property's earning potential based on location, size, seasonality, and market demand — at no cost.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {/* Name */}
                <div style={{ marginBottom: '32px', gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="book-name">Full Name *</label>
                  <input id="book-name" className="form-input" type="text" placeholder="Jane Smith" value={form.name} onChange={set('name')} required />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="book-email">Email *</label>
                  <input id="book-email" className="form-input" type="email" placeholder="jane@email.com" value={form.email} onChange={set('email')} required />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="book-phone">Phone *</label>
                  <input id="book-phone" className="form-input" type="tel" placeholder="+61 4XX XXX XXX" value={form.phone} onChange={set('phone')} required />
                </div>

                {/* Address */}
                <div style={{ marginBottom: '32px', gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="book-address">Property Address *</label>
                  <input id="book-address" className="form-input" type="text" placeholder="123 Harbour St, Sydney NSW" value={form.address} onChange={set('address')} required />
                </div>

                {/* Bedrooms */}
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="book-bedrooms">Bedrooms</label>
                  <select id="book-bedrooms" className="form-input" value={form.bedrooms} onChange={set('bedrooms')} style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select</option>
                    {['Studio', '1', '2', '3', '4', '5+'].map(v => <option key={v} value={v}>{v === 'Studio' ? 'Studio' : `${v} bed`}</option>)}
                  </select>
                </div>

                {/* Package interest */}
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="book-package">Interested In</label>
                  <select id="book-package" className="form-input" value={form.package} onChange={set('package')} style={{ appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select</option>
                    <option value="essentials">Essentials — 10%</option>
                    <option value="signature">Signature — 16%</option>
                    <option value="unsure">Not sure yet</option>
                  </select>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '48px', gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="book-notes">Anything Else?</label>
                  <textarea
                    id="book-notes"
                    className="form-input"
                    placeholder="Tell us about your property or any questions you have..."
                    rows={3}
                    value={form.notes}
                    onChange={set('notes')}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!requiredFilled}
                style={{
                  width: '100%', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600,
                  fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#fff', background: '#2A2927',
                  padding: '16px', borderRadius: '8px',
                  border: 'none', cursor: requiredFilled ? 'pointer' : 'not-allowed',
                  opacity: requiredFilled ? 1 : 0.38,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { if (requiredFilled) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = requiredFilled ? '1' : '0.38' }}
              >
                Request Free Assessment
              </button>

              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px', letterSpacing: '0.03em' }}>
                No obligation. We'll respond within one business day.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Hostaway Search Bar ──────────────────────────────────────────────────────
function HostawaySearchBar() {
  useEffect(() => {
    const load = () => {
      if ((window as any).searchBar) {
        ;(window as any).searchBar({
          baseUrl: 'https://themeridencollection.com/',
          showLocation: true,
          color: '#2A2927',
          rounded: true,
          openInNewTab: false,
          font: 'Josefin Sans',
        })
      }
    }
    if (!document.querySelector('script[src*="widget.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://d2q3n06xhbi0am.cloudfront.net/widget.js?1640277196'
      s.async = true
      s.onload = load
      document.head.appendChild(s)
    } else {
      load()
    }
    return () => {
      const el = document.getElementById('hostaway-booking-widget')
      if (el) el.innerHTML = ''
    }
  }, [])
  return <div id="hostaway-booking-widget" />
}

// ─── Hostaway Calendar Widget ─────────────────────────────────────────────────
function HostawayCalendar({ listingId }: { listingId: number }) {
  const containerId = `hostaway-calendar-widget-${listingId}`

  useEffect(() => {
    const init = () => {
      if ((window as any).hostawayCalendarWidget) {
        ;(window as any).hostawayCalendarWidget({
          baseUrl: 'https://themeridencollection.com/',
          listingId,
          numberOfMonths: 2,
          openInNewTab: false,
          font: 'Josefin Sans',
          rounded: true,
          button: { action: 'checkout', text: 'Book Now' },
          clearButtonText: 'Clear dates',
          color: { mainColor: '#2A2927', frameColor: '#E4D9BE', textColor: '#000000' },
        })
      }
    }
    if (!document.querySelector('script[src*="calendar.js"]')) {
      const s = document.createElement('script')
      s.src = 'https://d2q3n06xhbi0am.cloudfront.net/calendar.js'
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    } else {
      init()
    }
  }, [listingId])

  return <div id={containerId} />
}

// ─── Book Now Page ────────────────────────────────────────────────────────────
const FALLBACK_LISTINGS = [
  {
    id: 40467,
    name: 'The Meriden Residence',
    city: 'Sydney CBD',
    bedroomsNumber: 2,
    bathroomsNumber: 2,
    personsCapacity: 4,
    description: 'A refined city retreat in the heart of Sydney. Floor-to-ceiling glass, curated interiors, and seamless access to the finest dining and culture the city offers.',
  },
]

interface ApiListing {
  id: number
  name?: string
  city?: string
  bedroomsNumber?: number
  bathroomsNumber?: number
  personsCapacity?: number
  guestsNumber?: number
  description?: string
  imageUrl?: string
}

function BookPage({ onViewListing }: { onViewListing: (id: number) => void }) {
  const [listings, setListings] = useState<ApiListing[]>(FALLBACK_LISTINGS)

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ApiListing[]) => { if (Array.isArray(data) && data.length > 0) setListings(data) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>

      {/* Search header */}
      <div style={{ background: '#2A2927', paddingTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) clamp(24px, 4vw, 64px) clamp(32px, 4vw, 48px)' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '14px' }}>Direct Booking</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(26px, 3.5vw, 48px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '32px' }}>
            Reserve Your Stay
          </h1>
          <HostawaySearchBar />
        </div>
      </div>

      {/* Listings */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(56px, 7vw, 96px) clamp(24px, 4vw, 64px)' }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Our Properties</p>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.8vw, 38px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          Curated Stays, Exceptional Standard
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {listings.map(listing => {
            const beds = listing.bedroomsNumber
            const baths = listing.bathroomsNumber
            const guests = listing.personsCapacity ?? listing.guestsNumber
            return (
              <div key={listing.id} style={{ border: '1px solid #E4D9BE', borderRadius: '20px', overflow: 'hidden' }}>
                {/* Card top: image + details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0' }}>
                  {/* Image */}
                  <div style={{ minHeight: '280px', background: '#E4D9BE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt={listing.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(42,41,39,0.35)' }}>Photo Coming Soon</span>
                    )}
                  </div>
                  {/* Details */}
                  <div style={{ padding: 'clamp(28px, 3vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff' }}>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>{listing.city}</p>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(18px, 2vw, 26px)', color: '#000', marginBottom: '16px', letterSpacing: '-0.01em' }}>{listing.name}</h3>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555', lineHeight: 1.75, marginBottom: '24px' }}>{listing.description}</p>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
                      {[beds && `${beds} Bedroom${beds !== 1 ? 's' : ''}`, baths && `${baths} Bathroom${baths !== 1 ? 's' : ''}`, guests && `Up to ${guests} Guests`].filter(Boolean).map(tag => (
                        <span key={String(tag)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2A2927', letterSpacing: '0.04em' }}>{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => onViewListing(listing.id)}
                      style={{ alignSelf: 'flex-start', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2927', border: '1px solid #2A2927', background: 'transparent', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2A2927'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2A2927' }}
                    >
                      View Property
                    </button>
                  </div>
                </div>
                {/* Quick book calendar */}
                <div style={{ borderTop: '1px solid #E4D9BE', padding: 'clamp(24px, 3vw, 40px)', background: '#FAFAF8' }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', marginBottom: '20px' }}>Quick Book — Select Your Dates</p>
                  <HostawayCalendar listingId={listing.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
function ContactPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(48px, 8vw, 120px)', alignItems: 'start' }}>

        {/* Left — info */}
        <div>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '48px', padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#000')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Get in Touch</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 52px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px' }}>
            We'd love to<br />hear from you.
          </h1>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.8, marginBottom: '48px' }}>
            Whether you're an owner looking to list, a guest with a question, or simply want to learn more about what we do — reach out.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {[
              { label: 'Email', value: 'stay@themeridencollection.com', href: 'mailto:stay@themeridencollection.com' },
              { label: 'Website', value: 'themeridencollection.com', href: 'https://themeridencollection.com' },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa', marginBottom: '4px' }}>{label}</p>
                {href ? (
                  <a href={href} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#000', textDecoration: 'none', letterSpacing: '0.02em', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.5')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{value}</a>
                ) : (
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#000', letterSpacing: '0.02em' }}>{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div>
          {submitted ? (
            <div style={{ animation: 'fadeUp 0.5s ease forwards', paddingTop: '80px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 3vw, 36px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '16px' }}>
                Message received.
              </h2>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
                Thanks for reaching out, {form.name.split(' ')[0]}. We'll be in touch within one business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ paddingTop: '80px' }}>
              <div style={{ marginBottom: '32px' }}>
                <label className="form-label" htmlFor="contact-name">Full Name *</label>
                <input id="contact-name" className="form-input" type="text" placeholder="Jane Smith" value={form.name} onChange={set('name')} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="contact-email">Email *</label>
                  <input id="contact-email" className="form-input" type="email" placeholder="jane@email.com" value={form.email} onChange={set('email')} required />
                </div>
                <div style={{ marginBottom: '32px' }}>
                  <label className="form-label" htmlFor="contact-phone">Phone</label>
                  <input id="contact-phone" className="form-input" type="tel" placeholder="+61 4XX XXX XXX" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label className="form-label" htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" className="form-input" value={form.subject} onChange={set('subject')} style={{ appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Select a topic</option>
                  <option value="listing">I want to list my property</option>
                  <option value="pricing">Pricing & packages</option>
                  <option value="guest">Guest enquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '40px' }}>
                <label className="form-label" htmlFor="contact-message">Message *</label>
                <textarea
                  id="contact-message"
                  className="form-input"
                  placeholder="How can we help?"
                  rows={5}
                  value={form.message}
                  onChange={set('message')}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600,
                  fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#fff', background: '#2A2927',
                  padding: '16px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Send Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [visibleChars, setVisibleChars] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [lifting, setLifting] = useState(false)
  const [liftDone, setLiftDone] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const [navColor, setNavColor] = useState(DARK_COLOR)
  const [houseStyle, setHouseStyle] = useState<React.CSSProperties>({ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(81vw, 1200px)', height: '88vh', overflow: 'hidden', zIndex: 15 })
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null)
  const [houseVisible, setHouseVisible] = useState(true)

  const heroRef = useRef<HTMLElement>(null)
  const darkSectionRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLElement>(null)
  const innerHouseRef = useRef<HTMLDivElement>(null)

  // Preloader
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const n = LOGO_TEXT.length
    for (let i = 0; i < n; i++) {
      timers.push(setTimeout(() => setVisibleChars(i + 1), TYPE_START + i * CHAR_INTERVAL))
    }
    const LIFT_AT = TYPE_START + n * CHAR_INTERVAL + 700
    timers.push(setTimeout(() => setShowCursor(false), LIFT_AT - 150))
    timers.push(setTimeout(() => setLifting(true), LIFT_AT))
    timers.push(setTimeout(() => setHeroVisible(true), LIFT_AT + 1900))
    timers.push(setTimeout(() => setLiftDone(true), LIFT_AT + 2100))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Nav color
  useEffect(() => {
    const onScroll = () => {
      const refs = [darkSectionRef, galleryRef]
      let onDark = false
      for (const r of refs) {
        const el = r.current
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= 0 && rect.bottom > 0) { onDark = true; break }
      }
      setNavColor(onDark ? '#ffffff' : DARK_COLOR)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // House scroll — building exits downward as user scrolls, keeping hero text visible
  const updateHousePosition = useCallback(() => {
    if (!heroRef.current) return

    // Hide once gallery scrolls fully off screen
    if (galleryRef.current) {
      const galleryBottom = galleryRef.current.getBoundingClientRect().bottom
      setHouseVisible(galleryBottom > 0)
      if (galleryBottom <= 0) return
    }

    const vh = window.innerHeight
    const heroRect = heroRef.current.getBoundingClientRect()
    const heroH = heroRef.current.offsetHeight

    // Slide building downward: starts when hero is 15% scrolled, finishes at 75%
    const triggerPoint = -(heroH * 0.15)
    const endPoint = -(heroH * 0.75)
    const rawProgress = (heroRect.top - triggerPoint) / (endPoint - triggerPoint)
    const progress = clamp(rawProgress, 0, 1)
    const t = smoothstep(progress)

    const translateY = t * (vh * 1.15)

    setHouseStyle({
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: `translateX(-50%) translateY(${translateY}px)`,
      width: 'min(81vw, 1200px)',
      height: '88vh',
      overflow: 'hidden',
      zIndex: 15,
      pointerEvents: 'none',
      willChange: 'transform',
    })
  }, [])

  useEffect(() => {
    if (!liftDone) return
    window.addEventListener('scroll', updateHousePosition, { passive: true })
    window.addEventListener('resize', updateHousePosition)
    updateHousePosition()
    return () => {
      window.removeEventListener('scroll', updateHousePosition)
      window.removeEventListener('resize', updateHousePosition)
    }
  }, [liftDone, updateHousePosition])

  const innerHouseStyle: React.CSSProperties = liftDone
    ? { transform: 'translateY(0)', transition: 'none', height: '100%' }
    : lifting
    ? { transform: 'translateY(0)', transition: 'transform 1.5s cubic-bezier(0.45, 0, 0.15, 1) 0.4s', height: '100%' }
    : { transform: 'translateY(102vh)', height: '100%' }

  return (
    <>
      {/* Preloader */}
      {!liftDone && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: DARK_COLOR,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: lifting ? 'translateY(-100%)' : 'translateY(0)',
            transition: lifting && !liftDone ? 'transform 1.5s cubic-bezier(0.45, 0, 0.15, 1)' : 'none',
          }}
          aria-hidden="true"
        >
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: 'white', letterSpacing: '0.06em', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            {LOGO_TEXT.split('').map((ch, i) => (
              <span key={i} style={{ opacity: i < visibleChars ? 1 : 0, transition: 'opacity 0.05s' }}>{ch}</span>
            ))}
            {showCursor && (
              <span style={{ display: 'inline-block', width: '3px', height: '1.1em', background: 'white', borderRadius: '2px', marginLeft: '2px', animation: 'blink 0.7s step-end infinite' }} />
            )}
          </div>
        </div>
      )}

      {/* Nav color is handled by parent nav */}
      <div data-nav-color={navColor} />

      {/* Hero */}
      <section ref={heroRef} id="hero" style={{ position: 'relative', minHeight: '100vh', overflow: 'visible', backgroundImage: `url("${BG_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat' }}>
        <div
          className="hero-text-block"
          style={{ position: 'relative', zIndex: 10, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(-28px)', transition: heroVisible ? 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s' : 'none' }}
        >
          <div className="hero-heading-top" style={{ padding: '0 clamp(24px, 4vw, 64px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '-0.04em' }}>
            <h1 className="hero-own-the" style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, textTransform: 'uppercase', color: '#000', letterSpacing: '-0.03em', lineHeight: 1 }}>MANAGED</h1>
            <p className="hero-subtitle-desktop" style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(10px, 0.95vw, 14px)', maxWidth: '300px', opacity: 0.7, lineHeight: 1.6, marginBottom: '0.2em', letterSpacing: '0.02em', textAlign: 'right', color: '#000' }}>
              Properties handled with vision,<br />precision, and total discretion.
            </p>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h2 className="hero-extraordinary" style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, textTransform: 'uppercase', color: '#000', letterSpacing: '-0.03em', padding: '0 clamp(24px, 4vw, 64px)' }}>
              EXCEPTIONALLY
            </h2>
          </div>
          <p className="hero-subtitle-mobile" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(12px, 3vw, 15px)', opacity: 0.65, marginTop: '0.9em', padding: '0 24px', color: '#000' }}>
            Premium property management with vision,<br />depth, and architectural clarity.
          </p>
        </div>
      </section>

      {/* House — centered narrow high-rise, exits downward on scroll */}
      <div style={{ ...houseStyle, opacity: houseVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <div ref={innerHouseRef} style={innerHouseStyle}>
          <img src={HOUSE_IMG} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', mixBlendMode: 'multiply' }} />
        </div>
      </div>

      {/* Dark sticky section */}
      <div id="story" style={{ position: 'relative', height: '200vh', zIndex: 20 }}>
        <div style={{ height: '4vh', background: '#1a1a1a' }} />
        <div ref={darkSectionRef} className="s2-section" style={{ position: 'sticky', top: 0, height: '100vh', background: '#1a1a1a', overflow: 'hidden' }}>
          <div className="s2-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: `clamp(30px, 4vw, 60px) clamp(24px, 4vw, 64px) clamp(60px, 8vw, 120px)` }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', paddingLeft: '25%' }}>
              <p className="s2-statement" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#f0ece4', letterSpacing: '0.01em', lineHeight: 1.6, fontSize: 'clamp(19px, 2.1vw, 34px)', maxWidth: '680px' }}>
                Every property we manage is held to an unwavering standard of permanence, refinement, and timeless detail.{' '}
                <em>Quality is not an aspiration. It is the only option.</em>
              </p>
              <div className="s2-stats-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 'clamp(48px, 6vw, 80px)' }}>
                {[{ end: 10, suffix: '+', label: 'Curated Locations' }, { end: 2, suffix: '', label: 'Global Markets' }, { end: 82, suffix: '%', label: 'Avg. Occupancy Rate' }].map((stat, i) => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {i > 0 && <div aria-hidden="true" style={{ width: '0.5px', height: '72px', background: 'rgba(255,255,255,0.2)', flexShrink: 0, marginRight: 'clamp(20px, 2.5vw, 40px)' }} />}
                    <div>
                      <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, color: '#f0ece4', fontSize: '2.8rem', lineHeight: 1.1 }}>
                        <CountUp end={stat.end} suffix={stat.suffix} />
                      </div>
                      <div style={{ width: '24px', height: '1px', background: '#c9b99a', margin: '10px 0 8px' }} />
                      <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, color: '#9a8f82', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <section ref={galleryRef} id="services" className="s3-gallery-section" style={{ position: 'relative', zIndex: 25, marginTop: '-100vh', background: '#1a1a1a', height: '100vh', overflow: 'hidden' }}>
        <div className="s3-ticker-wrap" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ display: 'flex' }}>
            {[0, 1].map(copy => (
              <span key={copy} style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: 'clamp(100px, 14vw, 220px)', color: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap', letterSpacing: '-0.02em', userSelect: 'none', paddingRight: '0.3em' }}>
                Meriden.&nbsp;&nbsp;&nbsp;Meriden.&nbsp;&nbsp;&nbsp;Meriden.&nbsp;&nbsp;&nbsp;Meriden.&nbsp;&nbsp;&nbsp;Meriden.
              </span>
            ))}
          </div>
        </div>
        <div className="s3-gallery-content" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'clamp(24px, 4vw, 60px)' }}>
          <div className="gallery-expand-row" style={{ display: 'flex', gap: '6px', height: '70%', maxWidth: '1200px', width: '100%' }}>
            {GALLERY_VIDEOS.map((src, i) => (
              <div key={src} className="gallery-expand-item" onMouseEnter={() => setHoveredVideo(i)} onMouseLeave={() => setHoveredVideo(null)}
                style={{ flex: hoveredVideo === i ? 4 : hoveredVideo !== null ? 0.6 : 1, height: '100%', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <video src={src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" style={{ background: '#FFFFFF', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '1.5rem' }}>Our Packages</p>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(32px, 4vw, 64px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
            Property Management,<br />Done Properly.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Essentials */}
            <div style={{ border: '1px solid #E4D9BE', borderRadius: '16px', padding: 'clamp(32px, 4vw, 48px)', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Essentials</p>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.5vw, 32px)', color: '#000' }}>10%</h3>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: '#666', marginTop: '4px', marginBottom: '1.5rem' }}>of net revenue + GST</p>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '2rem', flexGrow: 1 }}>For owners who manage their own cleaning and maintenance, but want experts driving revenue and guest experience.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2.5rem', flexGrow: 1 }}>
                {['Revenue forecasting & dynamic pricing', 'Multi-platform distribution', 'Professional photography & listing creation', 'Calendar & booking management', 'Guest screening & 24/7 support', 'Monthly performance reports'].map(item => (
                  <li key={item} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: '#444', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2A2927', marginTop: '7px', flexShrink: 0 }} />{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => { onNavigate('list'); window.scrollTo({ top: 0 }) }} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2927', border: '1px solid #2A2927', background: 'transparent', padding: '14px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2A2927'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2A2927' }}>
                Get Started
              </button>
            </div>

            {/* Signature */}
            <div style={{ border: '1px solid #2A2927', borderRadius: '16px', padding: 'clamp(32px, 4vw, 48px)', display: 'flex', flexDirection: 'column', background: '#2A2927' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Signature</p>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.5vw, 32px)', color: '#fff' }}>16%</h3>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', marginBottom: '1.5rem' }}>of net revenue + GST</p>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '2rem', flexGrow: 1 }}>Complete, hands-off management. Includes everything in Essentials, plus full cleaning, linen, and on-ground Sydney management.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2.5rem', flexGrow: 1 }}>
                {['Everything in Essentials', 'Professional cleaning & full linen service', 'Maintenance coordination & minor repairs', 'Stock replenishment & inventory management', 'Biannual deep cleans', 'On-ground Sydney property management'].map(item => (
                  <li key={item} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E4D9BE', marginTop: '7px', flexShrink: 0 }} />{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => { onNavigate('list'); window.scrollTo({ top: 0 }) }} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2927', background: '#E4D9BE', border: 'none', padding: '14px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Get Started
              </button>
            </div>
          </div>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginTop: '24px', textAlign: 'center' }}>$1,000 one-time onboarding fee + GST · No hidden fees</p>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#F1EDE4', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '1.5rem' }}>The Process</p>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
            Listed and earning<br />in as little as 7 days.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { n: '01', title: 'Free Revenue Assessment', body: "We assess your property's earning potential based on location, size, seasonality, and market demand — at no cost." },
              { n: '02', title: 'Onboarding & Styling', body: 'We onboard your property, advise on furnishing and presentation, and style the space for maximum guest appeal.' },
              { n: '03', title: 'Professional Listing Launch', body: 'We photograph and launch across Airbnb, Booking.com, VRBO, and more — with optimised copy, pricing, and positioning.' },
              { n: '04', title: 'Full Guest Management', body: 'From the first enquiry to post-stay reviews, we handle every guest interaction. 24/7, without exception.' },
              { n: '05', title: 'Monthly Payouts', body: 'Receive a clear, detailed monthly statement and consistent payouts. Your property works for you — you just collect.' },
            ].map(step => (
              <div key={step.n}>
                <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(36px, 4vw, 56px)', color: '#E4D9BE', lineHeight: 1, marginBottom: '16px', letterSpacing: '-0.03em' }}>{step.n}</p>
                <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(14px, 1.2vw, 17px)', color: '#000', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#555', lineHeight: 1.75 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="inquire" style={{ background: '#2A2927', padding: 'clamp(80px, 12vw, 160px) clamp(24px, 4vw, 64px)', textAlign: 'center', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 56px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Ready to maximise your Sydney property?
          </h2>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(14px, 1.3vw, 17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Let's start with a free, no-obligation revenue assessment. Find out exactly what your property could be earning.
          </p>
          <button
            onClick={() => { onNavigate('list'); window.scrollTo({ top: 0 }) }}
            style={{ display: 'inline-block', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2A2927', background: '#E4D9BE', padding: '16px 40px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Book a Free Assessment
          </button>
        </div>
      </section>
    </>
  )
}

// ─── App (root) ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [navColor, setNavColor] = useState(DARK_COLOR)
  const [currentListingId, setCurrentListingId] = useState<number | null>(null)
  const [bookingBanner, setBookingBanner] = useState<'success' | 'cancelled' | null>(null)

  // Keep nav color in sync — home page emits it via data attr; other pages are always dark
  useEffect(() => {
    if (page !== 'home') setNavColor(DARK_COLOR)
  }, [page])

  // For home page, watch the data-nav-color div
  useEffect(() => {
    if (page !== 'home') return
    const obs = new MutationObserver(() => {
      const el = document.querySelector('[data-nav-color]')
      if (el) setNavColor(el.getAttribute('data-nav-color') ?? DARK_COLOR)
    })
    const el = document.querySelector('[data-nav-color]')
    if (el) obs.observe(el, { attributes: true })
    return () => obs.disconnect()
  }, [page])

  // Detect Stripe redirect on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const booking = params.get('booking')
    if (booking === 'success' || booking === 'cancelled') {
      setBookingBanner(booking)
      window.history.replaceState({}, '', window.location.pathname)
      if (booking === 'cancelled') setTimeout(() => setBookingBanner(null), 6000)
    }
  }, [])

  const navigate = (p: Page, listingId?: number) => {
    setPage(p)
    setMenuOpen(false)
    if (listingId !== undefined) setCurrentListingId(listingId)
  }

  const navBg = page !== 'home' ? 'rgba(255,255,255,0.95)' : 'transparent'
  const effectiveNavColor = page !== 'home' ? DARK_COLOR : navColor

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Booking confirmation / cancellation banner */}
      {bookingBanner && (
        <div style={{ position: 'fixed', top: '80px', left: 0, right: 0, zIndex: 100001, display: 'flex', justifyContent: 'center', padding: '0 24px', pointerEvents: 'none' }}>
          <div style={{ background: bookingBanner === 'success' ? '#2A2927' : '#7a5c00', color: '#fff', padding: '14px 20px 14px 24px', borderRadius: '10px', fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', pointerEvents: 'auto', maxWidth: '560px', animation: 'fadeUp 0.4s ease forwards' }}>
            <span style={{ flex: 1 }}>
              {bookingBanner === 'success'
                ? 'Your booking is confirmed. A receipt has been sent to your email.'
                : 'Your booking was not completed. You have not been charged.'}
            </span>
            <button onClick={() => setBookingBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '4px', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Global nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(20px, 2.5vw, 24px) clamp(24px, 4vw, 64px)', background: navBg, backdropFilter: page !== 'home' ? 'blur(12px)' : undefined, borderBottom: page !== 'home' ? '1px solid rgba(0,0,0,0.06)' : undefined, transition: 'background 0.3s' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="Home">
          <Logo color={effectiveNavColor} />
        </button>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'none' }} className="desktop-nav">
            {(['home', 'list', 'book', 'contact'] as Page[]).map(p => {
              const label = p === 'home' ? 'Services' : p === 'list' ? 'List with Us' : p === 'book' ? 'Book Now' : 'Contact'
              return (
                <button key={p} onClick={() => navigate(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: page === p ? effectiveNavColor : `${effectiveNavColor}88`, transition: 'color 0.2s', padding: '4px 0' }}>{label}</button>
              )
            })}
          </div>

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}>
            {menuOpen
              ? <X size={24} color={effectiveNavColor} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ display: 'block', width: '28px', height: '1px', background: effectiveNavColor, transition: 'background 0.35s ease' }} />
                  <span style={{ display: 'block', width: '28px', height: '1px', background: effectiveNavColor, transition: 'background 0.35s ease' }} />
                </div>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          {([
            { label: 'Services', page: 'home' as Page },
            { label: 'List with Us', page: 'list' as Page },
            { label: 'Book Now', page: 'book' as Page },
            { label: 'Contact', page: 'contact' as Page },
          ]).map(({ label, page: p }) => (
            <button key={label} onClick={() => { navigate(p); window.scrollTo({ top: 0 }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 8vw, 48px)', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#000')}
            >{label}</button>
          ))}
        </div>
      )}

      {/* Page content */}
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'list' && <ListPage onBack={() => navigate('home')} />}
      {page === 'book' && <BookPage onViewListing={(id) => { navigate('listing', id); window.scrollTo({ top: 0 }) }} />}
      {page === 'contact' && <ContactPage onBack={() => navigate('home')} />}
      {page === 'listing' && currentListingId !== null && <ListingPage listingId={currentListingId} onBack={() => { navigate('book'); window.scrollTo({ top: 0 }) }} />}

      <Footer onNavigate={navigate} />
    </>
  )
}
