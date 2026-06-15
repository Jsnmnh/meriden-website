import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import ListingPage from './pages/ListingPage'

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ListingErrorBoundary extends React.Component<{ children: React.ReactNode; onReset: () => void }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', paddingTop: '80px' }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '18px', color: '#000' }}>Something went wrong loading this property.</p>
          <button onClick={() => { this.setState({ hasError: false }); this.props.onReset() }} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid #2A2927', background: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
            Back to Properties
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DARK_COLOR = '#2A2927'
const BRAND_NAME = 'The Meriden Collection'
const LOGO_TEXT = 'The Meriden Collection'
const ABN = '92 610 393 957'
const HOUSE_IMG = '/building.png'
const BG_IMG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260603_073200_7082add5-f1f8-4873-8696-d6f78a44089b.png&w=1920&q=85'
const GALLERY_PHOTOS = [
  { src: '/gallery/pool.jpg',          alt: 'Rooftop infinity pool overlooking Sydney CBD' },
  { src: '/gallery/sunset-living.jpg', alt: 'Living room with floor-to-ceiling sunset views' },
  { src: '/gallery/balcony.jpg',       alt: 'Private balcony with city skyline at sunset' },
  { src: '/gallery/open-plan.jpg',     alt: 'Open-plan living with telescope and city views' },
  { src: '/gallery/interior.jpg',      alt: 'Curated interior with luxury styling' },
]

const CHAR_INTERVAL = 55
const TYPE_START = 600

type Page = 'home' | 'services' | 'list' | 'book' | 'contact' | 'listing' | 'privacy' | 'terms' | 'about'

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
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }
  @keyframes shimmer-filter {
    0%, 38%, 100% { filter: brightness(1); }
    50%           { filter: brightness(1.22); }
    62%           { filter: brightness(1); }
  }

  .hero-subtitle-desktop { display: none; }
  .hero-subtitle-mobile  { display: none; }

  @media (max-width: 639px) {
    .hero-subtitle-mobile  { display: block !important; }
    .hero-text-block { padding-top: 90px !important; }
    .hero-heading-top { justify-content: flex-start !important; }
    .hero-own-the { font-size: 7.5vw !important; }
    .hero-extraordinary { font-size: 10vw !important; white-space: nowrap !important; line-height: 0.9 !important; }
  }
  @media (min-width: 640px) and (max-width: 1023px) {
    .hero-subtitle-mobile  { display: block !important; }
    .hero-text-block { padding-top: 110px !important; }
    .hero-heading-top { justify-content: flex-start !important; }
    .hero-own-the { font-size: 5.5vw !important; }
    .hero-extraordinary { font-size: 11vw !important; white-space: nowrap !important; line-height: 0.9 !important; }
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
    .s2-inner { padding-left: 0 !important; }
  }
  @media (max-width: 480px) {
    .s2-stats-row { flex-wrap: wrap !important; gap: 28px !important; }
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

  .testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  @media (max-width: 860px) { .testi-grid { grid-template-columns: 1fr; } }

  .why-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
  .why-grid > *:nth-child(1), .why-grid > *:nth-child(2) { grid-column: span 3; }
  .why-grid > *:nth-child(3), .why-grid > *:nth-child(4), .why-grid > *:nth-child(5) { grid-column: span 2; }
  @media (max-width: 900px) {
    .why-grid { grid-template-columns: repeat(2, 1fr); }
    .why-grid > * { grid-column: span 1 !important; }
  }
  @media (max-width: 560px) {
    .why-grid { grid-template-columns: 1fr; }
  }
`

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
          const start = performance.now()
          const duration = 2000
          const tick = (now: number) => {
            const t = clamp((now - start) / duration, 0, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setVal(Math.round(eased * end))
            if (t < 1) { rafRef.current = requestAnimationFrame(tick) }
          }
          rafRef.current = requestAnimationFrame(tick)
        } else {
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
          setVal(0)
        }
      },
      { threshold: 0 }
    )
    obs.observe(el)
    return () => { obs.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [end])

  return <span ref={ref}>{val}{suffix}</span>
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────
function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ rx: 0, ry: 0, sx: 50, sy: 50, on: false })
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    setT({ rx: -y * 10, ry: x * 10, sx: (x + 0.5) * 100, sy: (y + 0.5) * 100, on: true })
  }
  const onLeave = () => setT({ rx: 0, ry: 0, sx: 50, sy: 50, on: false })
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{
      ...style,
      transform: `perspective(1000px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.on ? 1.02 : 1})`,
      transition: t.on ? 'transform 0.12s ease' : 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
      position: 'relative', transformStyle: 'preserve-3d',
    }}>
      {children}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: `radial-gradient(circle at ${t.sx}% ${t.sy}%, rgba(255,255,255,0.13), transparent 60%)`,
        opacity: t.on ? 1 : 0, transition: 'opacity 0.3s ease',
      }} />
    </div>
  )
}

// ─── Magnetic ─────────────────────────────────────────────────────────────────
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [xy, setXy] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const el = ref.current; if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      const R = 90
      setXy(dist < R ? { x: dx * (1 - dist / R) * 0.45, y: dy * (1 - dist / R) * 0.45 } : { x: 0, y: 0 })
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])
  const idle = Math.abs(xy.x) < 0.5 && Math.abs(xy.y) < 0.5
  return (
    <div ref={ref} style={{ display: 'inline-block', transform: `translate(${xy.x}px,${xy.y}px)`, transition: idle ? 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)' : 'transform 0.1s ease' }}>
      {children}
    </div>
  )
}

// ─── ScrollReveal ─────────────────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? 'perspective(1000px) rotateX(0deg) translateY(0)' : 'perspective(1000px) rotateX(10deg) translateY(36px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      transformOrigin: 'top center',
    }}>
      {children}
    </div>
  )
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
// ─── Legal page shared primitives ────────────────────────────────────────────
const legalBody: React.CSSProperties = { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#444', lineHeight: 1.85, margin: 0 }
const legalHeading: React.CSSProperties = { fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '15px', color: '#000', letterSpacing: '0.02em', marginTop: '40px', marginBottom: '12px' }
const legalList: React.CSSProperties = { listStyle: 'none', padding: 0, margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }

function LegalBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '48px', padding: 0, transition: 'color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#000')}
      onMouseLeave={e => (e.currentTarget.style.color = '#888')}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  )
}

function LegalItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2A2927', flexShrink: 0, marginTop: '8px' }} />
      <span style={legalBody}>{text}</span>
    </li>
  )
}

// ─── Privacy Policy ───────────────────────────────────────────────────────────
function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '100px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 48px)' }}>
        <LegalBackButton onBack={onBack} />
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Legal</p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '32px' }}>Privacy Policy</h1>
        <p style={legalBody}>At The Meriden Collection (ABN: 92 610 393 957), we are committed to protecting the privacy of our guests, clients, and website visitors. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you stay at one of our properties, make a booking, or interact with us online.</p>
        <p style={{ ...legalBody, marginTop: '16px' }}>If you have any questions about this policy, please contact us at: <a href="mailto:stay@themeridencollection.com" style={{ color: '#2A2927', fontWeight: 400 }}>stay@themeridencollection.com</a></p>

        <h2 style={legalHeading}>Compliance With Australian Law</h2>
        <p style={legalBody}>We comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs) when handling your personal information. This means we only collect, use, and disclose personal information that is reasonably necessary for our business activities and in a manner that is lawful, fair, and transparent.</p>

        <h2 style={legalHeading}>Consent</h2>
        <p style={legalBody}>By making a booking, staying at our properties, or using our website, you agree to this Privacy Policy and how we handle your personal information.</p>

        <h2 style={legalHeading}>Information We Collect</h2>
        <p style={legalBody}>We may collect personal information from you in several ways, including when you:</p>
        <ul style={legalList}>
          {['Make a booking through our website, booking platforms (e.g., Airbnb, Booking.com), or directly with us', 'Stay at one of our properties', 'Contact us for enquiries or support', 'Subscribe to marketing updates or newsletters'].map(t => <LegalItem key={t} text={t} />)}
        </ul>
        <p style={{ ...legalBody, marginTop: '16px' }}>This information may include:</p>
        <ul style={legalList}>
          {['Your name, email address, and postal address', 'Payment details (processed securely through third-party providers)', 'Booking details such as check-in/check-out dates, property rented, and guest numbers', 'Identification details if required by law or building management (e.g., driver\'s licence, passport)', 'Any additional information you provide in communications with us'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>How We Use Your Information</h2>
        <p style={legalBody}>We use your personal information to:</p>
        <ul style={legalList}>
          {['Process and manage bookings', 'Provide customer service and respond to enquiries', 'Verify your identity if required for property access', 'Comply with legal obligations (e.g., strata, council, or government regulations)', 'Communicate important updates about your booking or stay', 'Improve our services, website, and guest experience', 'Send promotional materials if you have opted in'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>Sharing of Information</h2>
        <p style={legalBody}>We do not sell or rent your personal information. We may share your information only with:</p>
        <ul style={legalList}>
          {['Trusted third-party service providers (e.g., cleaners, maintenance staff) where necessary to manage your stay', 'Booking platforms (Airbnb, Booking.com, etc.) as per their terms', 'Legal or regulatory authorities if required by law'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>Data Security</h2>
        <p style={legalBody}>We take reasonable steps to protect your information from misuse, loss, unauthorised access, modification, or disclosure. Payment information is handled only by secure third-party processors.</p>

        <h2 style={legalHeading}>Cookies & Website Analytics</h2>
        <p style={legalBody}>Our website may use cookies to improve functionality and user experience. These do not identify you personally. Analytics may be used to understand website traffic and performance.</p>

        <h2 style={legalHeading}>Your Privacy Rights</h2>
        <p style={legalBody}>In accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles, you have the right to:</p>
        <ul style={legalList}>
          {['Access the personal information we hold about you', 'Request corrections to your information if it is inaccurate', 'Request that we delete your information where legally possible', 'Opt out of marketing communications at any time'].map(t => <LegalItem key={t} text={t} />)}
        </ul>
        <p style={{ ...legalBody, marginTop: '16px' }}>We will respond to all requests within a reasonable period and in line with our legal obligations.</p>

        <h2 style={legalHeading}>Children's Privacy</h2>
        <p style={legalBody}>Our services are not directed at children under 18, and we do not knowingly collect their information. Guests must be at least 18 years old to make a booking.</p>

        <h2 style={legalHeading}>Changes to This Policy</h2>
        <p style={legalBody}>We may update this Privacy Policy from time to time. The latest version will always be available on our website.</p>

        <h2 style={legalHeading}>Contact Us</h2>
        <p style={legalBody}>If you have questions, concerns, or requests about your personal information, please contact us at: <a href="mailto:stay@themeridencollection.com" style={{ color: '#2A2927', fontWeight: 400 }}>stay@themeridencollection.com</a></p>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #E4D9BE' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#aaa', letterSpacing: '0.04em' }}>The Meriden Collection · ABN 92 610 393 957</p>
        </div>
      </div>
    </div>
  )
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────
function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '100px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 48px)' }}>
        <LegalBackButton onBack={onBack} />
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Legal</p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '32px' }}>Terms & Conditions</h1>
        <p style={legalBody}>Welcome to The Meriden Collection (ABN: 92 610 393 957). These Terms and Conditions outline the rules, obligations, and rights that apply when you book and stay at one of our properties. By making a booking, staying with us, or using our website, you agree to be bound by these Terms and Conditions. If you do not agree, you must not proceed with your booking.</p>

        <h2 style={legalHeading}>1. Bookings and Payments</h2>
        <ul style={legalList}>
          {['All bookings must be made by individuals aged 18 years or older.', 'Full payment is required at the time of booking unless otherwise agreed.', 'Prices are quoted in Australian Dollars (AUD) and may be subject to change before confirmation.', 'We reserve the right to cancel a booking if payment is not received in full.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>2. Check-In and Check-Out</h2>
        <ul style={legalList}>
          {['Standard check-in time: 3:00 PM (unless otherwise agreed).', 'Standard check-out time: 10:00 AM (unless otherwise agreed).', 'Early check-in or late check-out may be available upon request and may incur additional charges.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>3. Guest Responsibilities</h2>
        <ul style={legalList}>
          {['Guests must respect the property, neighbours, and building by-laws at all times.', 'Parties, excessive noise, and disruptive behaviour are strictly prohibited.', 'Smoking is not permitted inside the property.', 'Only the number of guests stated in the booking may stay overnight. Additional guests must be approved in writing and may incur extra charges.', 'Guests must keep the property secure and return all keys, fobs, or access devices on departure.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>4. Cleaning and Damages</h2>
        <ul style={legalList}>
          {['A standard cleaning fee applies to each booking.', 'Guests are expected to leave the property in a reasonable condition. Excessive cleaning may incur extra charges.', 'Any damage, loss, or breakage caused during your stay must be reported immediately. Guests are liable for repair or replacement costs.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>5. Cancellations and Refunds</h2>
        <ul style={legalList}>
          {['Cancellations made in accordance with the cancellation policy stated at the time of booking will be eligible for a refund (if applicable).', 'Refunds will be processed back to the original payment method.', 'No-shows or early departures are non-refundable.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>6. Liability</h2>
        <ul style={legalList}>
          {['To the maximum extent permitted by law, The Meriden Collection is not liable for any injury, loss, or damage suffered by guests during their stay, unless caused by our negligence.', 'Guests are responsible for their personal belongings. We do not accept liability for loss or theft.'].map(t => <LegalItem key={t} text={t} />)}
        </ul>

        <h2 style={legalHeading}>7. Privacy</h2>
        <p style={legalBody}>Your personal information will be handled in accordance with our Privacy Policy, available on our website.</p>

        <h2 style={legalHeading}>8. Changes to Terms</h2>
        <p style={legalBody}>The Meriden Collection may update these Terms and Conditions from time to time. The version published on our website at the time of your booking will apply.</p>

        <h2 style={legalHeading}>Contact Us</h2>
        <p style={legalBody}>For questions about these Terms and Conditions, please contact us at: <a href="mailto:stay@themeridencollection.com" style={{ color: '#2A2927', fontWeight: 400 }}>stay@themeridencollection.com</a></p>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #E4D9BE' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#aaa', letterSpacing: '0.04em' }}>The Meriden Collection · ABN 92 610 393 957</p>
        </div>
      </div>
    </div>
  )
}

function AboutPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  usePageMeta('About | The Meriden Collection', 'The Meriden Collection is Sydney\'s premium short-term rental management company — built on precision, discretion, and results that speak for themselves.')
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '100px' }}>

      {/* Hero */}
      <section style={{ background: '#2A2927', padding: 'clamp(64px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(228,217,190,0.06), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>About Us</p>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(32px, 5vw, 72px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, maxWidth: '800px', marginBottom: '32px' }}>
              Built for the properties<br />that deserve more.
            </h1>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: '560px' }}>
              The Meriden Collection was founded on a simple belief: that premium Sydney properties deserve management that matches their standard — not an algorithm and a call centre.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Pull quote */}
      <section style={{ background: '#F7F4EF', padding: 'clamp(64px, 8vw, 120px) clamp(24px, 4vw, 64px)', borderBottom: '1px solid #E8E2D9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(60px, 8vw, 100px)', lineHeight: 0.8, color: '#E4D9BE', display: 'block', marginBottom: '24px' }}>"</span>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px, 3vw, 36px)', color: '#2A2927', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
              We don't manage properties at volume. We take on the ones we can genuinely improve — and then we make sure every detail is right.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: '#F7F4EF', padding: 'clamp(64px, 8vw, 100px) clamp(24px, 4vw, 64px)', borderTop: '1px solid #E8E2D9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '48px' }}>
            {[
              { value: '4.8★', label: 'Average guest rating across our portfolio' },
              { value: '50%+', label: 'Average income uplift vs long-term lease' },
              { value: '<7 days', label: 'From signed agreement to first live booking' },
              { value: '24/7', label: 'Guest support and on-ground Sydney team' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 80}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 48px)', color: '#2A2927', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '12px' }}>{s.value}</p>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#777', lineHeight: 1.7 }}>{s.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* What we do */}

      <section style={{ background: '#2A2927', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>What We Stand For</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(26px, 3vw, 46px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
              The values behind<br />every decision we make.
            </h2>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2px' }}>
            {[
              { title: 'Discretion', body: 'Your property, your guests, and your income are private. We operate with complete confidentiality and do not discuss client portfolios.' },
              { title: 'Precision', body: 'From nightly pricing to linen presentation, details matter. We hold our operations to a standard that reflects the quality of the properties we manage.' },
              { title: 'Accountability', body: 'If something goes wrong, we fix it — not with excuses but with action. Our owners never chase us for answers; we come to them first.' },
              { title: 'Results', body: 'Everything we do is measured against one question: did this improve outcomes for the owner? If it didn\'t, we change it.' },
            ].map((v, i) => (
              <ScrollReveal key={v.title} delay={i * 70}>
                <div style={{ padding: 'clamp(32px, 3vw, 48px) clamp(24px, 2.5vw, 40px)', borderLeft: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(16px, 1.5vw, 20px)', color: '#E4D9BE', marginBottom: '16px', letterSpacing: '-0.01em' }}>{v.title}</h3>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(13px, 1.1vw, 15px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.85 }}>{v.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(48px, 8vw, 100px)', alignItems: 'start' }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '20px' }}>Our Approach</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(24px, 3vw, 42px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '28px' }}>
              Selective by design.<br />Focused on results.
            </h2>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#555', lineHeight: 1.85, marginBottom: '20px' }}>
              We are not a mass-market property management platform. We deliberately limit how many properties we take on, because quality of management — not quantity of listings — is what drives results for our owners.
            </p>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#555', lineHeight: 1.85 }}>
              Every property in our portfolio receives the same level of attention: professional photography, precision pricing, rigorous guest screening, and on-ground Sydney support available around the clock.
            </p>
          </ScrollReveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { n: '01', title: 'Precision Pricing', body: 'Our dynamic pricing model analyses live market data, local events, and seasonal demand daily — not weekly — to ensure your property is always priced to maximise occupancy without leaving money on the table.' },
              { n: '02', title: 'Guest Excellence', body: 'We screen every guest, manage every communication, and resolve every issue — so you never have to. Our average guest review score across the portfolio sits above 4.8.' },
              { n: '03', title: 'Owner Transparency', body: 'You receive a clear monthly statement, direct payouts, and full access to your calendar. No surprises, no chasing, no ambiguity about what your property earned and why.' },
            ].map((item, i) => (
              <ScrollReveal key={item.n} delay={i * 80}>
                <div style={{ padding: '28px 32px', border: '1px solid #E8E2D9', borderRadius: '16px', background: '#FAFAF8' }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '28px', color: '#E4D9BE', marginBottom: '10px', letterSpacing: '-0.02em' }}>{item.n}</p>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(14px, 1.2vw, 17px)', color: '#000', marginBottom: '10px' }}>{item.title}</h3>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#666', lineHeight: 1.8 }}>{item.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(26px, 3.5vw, 48px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '20px' }}>
              Ready to see what your property could earn?
            </h2>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#666', lineHeight: 1.8, marginBottom: '40px' }}>
              Book a free, no-obligation revenue assessment with our team.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { onNavigate('list'); window.scrollTo({ top: 0 }) }}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff', background: '#2A2927', padding: '16px 40px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Book Free Assessment
              </button>
              <button
                onClick={() => { onNavigate('contact'); window.scrollTo({ top: 0 }) }}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2A2927', background: 'transparent', padding: '16px 40px', borderRadius: '8px', border: '1px solid #2A2927', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2A2927'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2A2927' }}
              >
                Get in Touch
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

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
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', letterSpacing: '0.05em' }}>
              ABN {ABN}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '24px' }}>
            <div style={{ display: 'flex', gap: 'clamp(24px, 4vw, 60px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {([
                { label: 'Home', page: 'home' as Page },
                { label: 'Services', page: 'services' as Page },
                { label: 'About', page: 'about' as Page },
                { label: 'Partner with Us', page: 'list' as Page },
                { label: 'Book a Stay', page: 'book' as Page },
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
            <div style={{ display: 'flex', gap: '16px' }}>
              <a
                href="https://www.instagram.com/themeridencollection/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s', display: 'flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61590543269717"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s', display: 'flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {([
              { label: 'Privacy Policy', page: 'privacy' as Page },
              { label: 'Terms & Conditions', page: 'terms' as Page },
            ]).map(({ label, page }) => (
              <button
                key={label}
                onClick={() => { onNavigate(page); window.scrollTo({ top: 0 }) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            © {new Date().getFullYear()} {BRAND_NAME}
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Calendly Embed ──────────────────────────────────────────────────────────
function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (meta) meta.content = description
    return () => { document.title = 'The Meriden Collection' }
  }, [title, description])
}

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
  usePageMeta('Partner with Us | The Meriden Collection', 'Book a free revenue assessment with The Meriden Collection. Sydney property owners are switching from long-term leases and earning significantly more.')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', bedrooms: '', package: '', notes: '', weeklyRent: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [weeklyRent, setWeeklyRent] = useState(700)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const requiredFilled = !!(form.name.trim() && form.email.trim() && form.phone.trim() && form.address.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requiredFilled) return
    setSubmitting(true)
    try {
      await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, weeklyRent: String(weeklyRent) }),
      })
    } catch (_) {}
    setSubmitting(false)
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

            <div style={{ marginTop: '56px', paddingTop: '48px', borderTop: '1px solid #E4D9BE' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>What to Expect</p>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(18px, 2vw, 24px)', color: '#000', letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: '32px' }}>
                During your 30-minute consultation, we'll cover:
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  'Whether your property is suitable for short-term stays',
                  'Your property\'s earning potential based on location and size',
                  'Estimated market positioning and nightly rate range',
                  'Building and strata considerations specific to your property',
                  'Management options, packages, and next steps',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2A2927', flexShrink: 0, marginTop: '7px' }} />
                    <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555', lineHeight: 1.75, letterSpacing: '0.01em' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Social proof */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
              {[
                { name: 'Gerald M.', loc: 'Surry Hills', result: '+77% more income' },
                { name: 'Beena N.', loc: 'Darlinghurst', result: '+76% more income' },
                { name: 'Jack S.', loc: 'Southbank', result: '+87% more income' },
              ].map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F7F4EF', borderRadius: '100px', padding: '8px 16px', border: '1px solid #E4D9BE' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E4D9BE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '11px', color: '#2A2927' }}>{t.name[0]}</span>
                  </div>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '12px', color: '#2A2927' }}>{t.name}, {t.loc}</span>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '11px', color: '#2a7a4b', letterSpacing: '0.04em' }}>{t.result}</span>
                </div>
              ))}
            </div>

            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '16px' }}>Free Assessment</p>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '12px' }}>
              Book Your Free<br />Revenue Assessment
            </h1>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.75, marginBottom: '40px' }}>
              We'll assess your property's earning potential based on location, size, seasonality, and market demand — at no cost.
            </p>

            {/* Revenue calculator */}
            <div style={{ background: '#F7F4EF', border: '1px solid #E4D9BE', borderRadius: '16px', padding: '28px 32px', marginBottom: '48px' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '20px' }}>Quick Estimate</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#333' }}>Current weekly rent</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '18px', color: '#2A2927' }}>${weeklyRent.toLocaleString()}/wk</span>
              </div>
              <input
                type="range" min={300} max={3000} step={50} value={weeklyRent}
                onChange={e => setWeeklyRent(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2A2927', marginBottom: '24px', cursor: 'pointer' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E8E2D9' }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', marginBottom: '6px' }}>Long-term lease</p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '22px', color: '#888' }}>${Math.round(weeklyRent * 4.33).toLocaleString()}<span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px' }}>/mo</span></p>
                </div>
                <div style={{ background: '#2A2927', borderRadius: '10px', padding: '16px 20px' }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Meriden STR (est.)</p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '22px', color: '#E4D9BE' }}>Up to ${Math.round(weeklyRent * 1.5 * 4.33).toLocaleString()}<span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>/mo</span></p>
                </div>
              </div>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#bbb', marginTop: '12px', letterSpacing: '0.02em' }}>
                Estimate based on average uplift across our Sydney portfolio. Actual results vary by property.
              </p>
            </div>

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
                disabled={!requiredFilled || submitting}
                style={{
                  width: '100%', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600,
                  fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#fff', background: '#2A2927',
                  padding: '16px', borderRadius: '8px',
                  border: 'none', cursor: requiredFilled && !submitting ? 'pointer' : 'not-allowed',
                  opacity: requiredFilled && !submitting ? 1 : 0.38,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { if (requiredFilled && !submitting) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = requiredFilled && !submitting ? '1' : '0.38' }}
              >
                {submitting ? 'Sending…' : 'Request Free Assessment'}
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
const FALLBACK_LISTINGS: ApiListing[] = []

interface ApiListing {
  id: number
  name?: string
  city?: string
  bedroomsNumber?: number
  bathroomsNumber?: number
  personCapacity?: number
  guestsNumber?: number
  description?: string
  price?: number
  listingImages?: Array<{ url: string; sortOrder?: number }>
  listingAmenities?: Array<{ amenityName: string }>
}

type AvailCalEntry = {
  date: string
  isAvailable?: number | boolean
  status?: string
  isBlockedGuest?: number | boolean
  isBlockedOwner?: number | boolean
  minimumStay?: number
}

function isDateUnavailable(entry: AvailCalEntry): boolean {
  return (
    entry.isAvailable === 0 || entry.isAvailable === false ||
    entry.isBlockedGuest === 1 || entry.isBlockedGuest === true ||
    entry.isBlockedOwner === 1 || entry.isBlockedOwner === true ||
    entry.status === 'reserved' || entry.status === 'unavailable' ||
    entry.status === 'booked' || entry.status === 'blocked'
  )
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function BookPage({ onViewListing }: { onViewListing: (id: number, images?: Array<{ url: string; sortOrder?: number }>, amenities?: Array<{ amenityName: string }>) => void }) {
  usePageMeta('Book a Stay | The Meriden Collection', 'Browse and book luxury short-term stays in Sydney directly with The Meriden Collection. Best rates guaranteed when booking direct.')
  const [listings, setListings] = useState<ApiListing[]>(FALLBACK_LISTINGS)
  const [searchForm, setSearchForm] = useState({ checkIn: '', checkOut: '', guests: '2' })
  const [searching, setSearching] = useState(false)
  const [availableIds, setAvailableIds] = useState<Set<number> | null>(null)
  const [activeFilter, setActiveFilter] = useState<{ checkIn: string; checkOut: string; guests: number } | null>(null)

  const todayStr = fmtDate(new Date())

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: ApiListing[]) => { if (Array.isArray(data) && data.length > 0) setListings(data) })
      .catch(() => {})
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const { checkIn, checkOut, guests } = searchForm
    if (!checkIn || !checkOut || checkIn >= checkOut) return
    setSearching(true)
    setAvailableIds(null)

    const nights: string[] = []
    const cur = new Date(checkIn)
    const end = new Date(checkOut)
    while (cur < end) { nights.push(fmtDate(cur)); cur.setDate(cur.getDate() + 1) }

    const results = await Promise.all(
      listings.map(async (l) => {
        const cap = l.personCapacity ?? l.guestsNumber ?? 99
        if (cap < Number(guests)) return { id: l.id, available: false }
        try {
          const r = await fetch(`/api/listings/${l.id}/availability?startDate=${checkIn}&endDate=${checkOut}`)
          if (!r.ok) return { id: l.id, available: true }
          const data: AvailCalEntry[] = await r.json()
          const unavailSet = new Set(data.filter(isDateUnavailable).map(d => d.date))
          if (!nights.every(n => !unavailSet.has(n))) return { id: l.id, available: false }
          const checkInEntry = data.find(d => d.date === checkIn)
          const minStay = checkInEntry?.minimumStay ?? 1
          if (nights.length < minStay) return { id: l.id, available: false }
          return { id: l.id, available: true }
        } catch {
          return { id: l.id, available: true }
        }
      })
    )

    setAvailableIds(new Set(results.filter(r => r.available).map(r => r.id)))
    setActiveFilter({ checkIn, checkOut, guests: Number(guests) })
    setSearching(false)
  }

  const clearSearch = () => {
    setAvailableIds(null)
    setActiveFilter(null)
    setSearchForm(f => ({ ...f, checkIn: '', checkOut: '' }))
  }

  const filteredListings = availableIds ? listings.filter(l => availableIds.has(l.id)) : listings

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 300,
    fontSize: '14px',
    padding: '11px 14px',
    width: '100%',
    outline: 'none',
    colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 300,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>

      {/* Search header */}
      <div style={{ background: '#2A2927', paddingTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) clamp(24px, 4vw, 64px) clamp(32px, 4vw, 48px)' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '14px' }}>Direct Booking</p>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(26px, 3.5vw, 48px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '32px' }}>
            Reserve Your Stay
          </h1>

          <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Check-in</label>
              <input
                type="date"
                style={inputStyle}
                value={searchForm.checkIn}
                min={todayStr}
                onChange={e => setSearchForm(f => ({ ...f, checkIn: e.target.value, checkOut: f.checkOut && f.checkOut <= e.target.value ? '' : f.checkOut }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Check-out</label>
              <input
                type="date"
                style={inputStyle}
                value={searchForm.checkOut}
                min={searchForm.checkIn || todayStr}
                onChange={e => setSearchForm(f => ({ ...f, checkOut: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Guests</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                value={searchForm.guests}
                onChange={e => setSearchForm(f => ({ ...f, guests: e.target.value }))}
              >
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n} style={{ background: '#2A2927' }}>{n} guest{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={!searchForm.checkIn || !searchForm.checkOut || searching}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2A2927', background: '#E4D9BE', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: !searchForm.checkIn || !searchForm.checkOut || searching ? 'not-allowed' : 'pointer', opacity: !searchForm.checkIn || !searchForm.checkOut || searching ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}
              >
                {searching ? 'Checking…' : 'Search'}
              </button>
              {activeFilter && (
                <button type="button" onClick={clearSearch} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Listings */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(56px, 7vw, 96px) clamp(24px, 4vw, 64px)' }}>
        {activeFilter ? (
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginBottom: 'clamp(40px, 5vw, 64px)', letterSpacing: '0.02em' }}>
            {filteredListings.length > 0
              ? `${filteredListings.length} propert${filteredListings.length !== 1 ? 'ies' : 'y'} available · ${new Date(activeFilter.checkIn + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${new Date(activeFilter.checkOut + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · ${activeFilter.guests} guest${activeFilter.guests !== 1 ? 's' : ''}`
              : `No properties available for those dates — try different dates`}
          </p>
        ) : (
          <>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '12px' }}>Our Properties</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.8vw, 38px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
              Curated Stays, Exceptional Standard
            </h2>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {filteredListings.map(listing => {
            const beds = listing.bedroomsNumber
            const baths = listing.bathroomsNumber
            const guests = listing.personCapacity ?? listing.guestsNumber
            const imgUrl = listing.listingImages?.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
            return (
              <TiltCard key={listing.id} style={{ border: '1px solid #E4D9BE', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0' }}>
                  {/* Image */}
                  <div style={{ minHeight: '300px', background: '#E4D9BE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={listing.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(42,41,39,0.35)' }}>Photo Coming Soon</span>
                    )}
                  </div>
                  {/* Details */}
                  <div style={{ padding: 'clamp(28px, 3vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', margin: 0 }}>{listing.city}</p>
                      <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2a7a4b', background: '#e8f5ee', borderRadius: '100px', padding: '4px 10px' }}>Book Direct · Best Rate</span>
                    </div>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(18px, 2vw, 26px)', color: '#000', marginBottom: '20px', letterSpacing: '-0.01em' }}>{listing.name}</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
                      {[beds && `${beds} Bedroom${beds !== 1 ? 's' : ''}`, baths && `${baths} Bathroom${baths !== 1 ? 's' : ''}`, guests && `Up to ${guests} Guests`].filter(Boolean).map(tag => (
                        <span key={String(tag)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#555', letterSpacing: '0.04em' }}>{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => onViewListing(listing.id, listing.listingImages, listing.listingAmenities)}
                      style={{ alignSelf: 'flex-start', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A2927', border: '1px solid #2A2927', background: 'transparent', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2A2927'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2A2927' }}
                    >
                      View Property
                    </button>
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
function ContactPage({ onBack }: { onBack: () => void }) {
  usePageMeta('Contact | The Meriden Collection', 'Get in touch with The Meriden Collection. Premium short-term rental management in Sydney.')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch (_) {}
    setSubmitting(false)
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
              { label: 'Phone', value: '0493 966 175', href: 'tel:+61493966175' },
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

              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>
                We typically respond within a few hours during business hours.
              </p>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600,
                  fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#fff', background: '#2A2927',
                  padding: '16px', borderRadius: '8px',
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1, transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.opacity = '1' }}
              >
                {submitting ? 'Sending…' : 'Send Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'How much does property management cost?',
    a: 'We offer two packages: Essentials at 10% of net revenue + GST for owners who self-manage cleaning, and Signature at 16% for a fully hands-off experience including professional cleaning, linen, and on-ground Sydney management. Both include a one-time $1,000 + GST onboarding fee. No hidden charges.',
  },
  {
    q: 'Do I keep control of my calendar?',
    a: 'Yes — completely. You can block dates for personal use at any time by contacting us directly or through your owner portal. Your property, your schedule.',
  },
  {
    q: 'What types of properties do you manage?',
    a: 'We specialise in premium apartments and residences in central Sydney locations — properties that appeal to discerning travellers, business guests, and couples seeking a refined short-term stay. We are selective about the properties we take on to maintain our standard of excellence.',
  },
  {
    q: 'How do you handle guest communication and issues?',
    a: 'We manage every guest interaction from the first enquiry through to the post-stay review. This includes check-in instructions, in-stay support, and issue resolution — 24/7, without exception. You will never need to deal with a guest directly unless you choose to.',
  },
  {
    q: 'Can I still use my property for personal stays?',
    a: 'Absolutely. Simply let us know when you\'d like to reserve it and we\'ll ensure the property is guest-ready for your arrival. There is no limit on personal use — just give us reasonable notice.',
  },
  {
    q: 'How quickly can we get started?',
    a: 'After a brief consultation and free revenue assessment, onboarding typically takes less than one week. We handle photography, listing creation, platform setup, and pricing — your property could be live and earning within days.',
  },
  {
    q: 'Is short-term rental right for my property?',
    a: 'If your property is in a central Sydney location, well-presented, and reasonably furnished, it is very likely a strong candidate for short-term rental. We conduct a free, no-obligation revenue assessment before any commitment — so you can see the numbers clearly before deciding. Location, layout, and presentation all factor in, and our team will give you an honest appraisal of what your property can realistically earn.',
  },
  {
    q: 'I have an existing long-term tenant — what are my options?',
    a: "Transitioning from a long-term lease to short-term rental is more straightforward than most owners expect. Once your tenancy reaches its end date, we can begin onboarding immediately — typically having your property listed and earning within a week. If you'd like to plan ahead, we recommend reaching out 4–6 weeks before your lease expires so we can coordinate styling, photography, and platform setup in advance. We'll walk you through every step.",
  },
  {
    q: 'What about strata and building by-laws?',
    a: "This is one of the most common questions we receive, and the answer depends on your specific building's by-laws and the applicable state legislation. In New South Wales, the short-term rental accommodation (STRA) framework allows eligible properties to operate legally, subject to strata and council rules. We can help you understand what applies to your building and guide you through the registration process where required. We only take on properties that can operate compliantly.",
  },
]

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', padding: '24px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 500, fontSize: 'clamp(14px, 1.2vw, 17px)', color: '#000', lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #2A2927', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', background: open ? '#2A2927' : 'transparent' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1={open ? '2' : '0'} x2="6" y2={open ? '10' : '12'} stroke={open ? '#fff' : '#2A2927'} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: open ? 0 : 1, transition: 'opacity 0.2s' }} />
            <line x1="0" y1="6" x2="12" y2="6" stroke={open ? '#fff' : '#2A2927'} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? '400px' : '0', transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555', lineHeight: 1.85, paddingBottom: '24px' }}>{a}</p>
      </div>
    </div>
  )
}

// ─── Services Page ────────────────────────────────────────────────────────────
function ServicesPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  usePageMeta('Services | The Meriden Collection', 'Premium short-term rental management packages for Sydney property owners. Earn up to 50% more than long-term leasing.')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const ctaSectionRef = useRef<HTMLElement>(null)
  const ctaTarget = useRef({ x: 0, y: 0 })
  const ctaCurr = useRef({ x: 0, y: 0 })
  const [ctaXy, setCtaXy] = useState({ x: 0, y: 0 })

  // CTA button chase
  useEffect(() => {
    let id: number
    const tick = () => {
      ctaCurr.current.x += (ctaTarget.current.x - ctaCurr.current.x) * 0.07
      ctaCurr.current.y += (ctaTarget.current.y - ctaCurr.current.y) * 0.07
      setCtaXy({ x: ctaCurr.current.x, y: ctaCurr.current.y })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{ paddingTop: '80px' }}>
      {/* Why Owners Choose Us */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30, borderTop: '1px solid #F0ECE4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '1.2rem' }}>Why Choose Us</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
              The Meriden difference.
            </h2>
          </ScrollReveal>
          <div className="why-grid">
            {([
              {
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A2927" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                ),
                title: 'Earn 50% More',
                body: 'Our dynamic pricing engine and multi-platform distribution strategy consistently deliver 50% more revenue than self-managing. We optimise nightly rates in real time based on demand, seasonality, and local events — so every night earns exactly what it should.',
              },
              {
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A2927" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                ),
                title: 'Professional Listings',
                body: 'Every listing starts with premium photography and professionally written, platform-optimised copy paired with a pricing strategy built to convert. We then continuously monitor and adjust each listing so it consistently outranks the competition across every channel.',
              },
              {
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A2927" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: 'Full-Service Guest Management',
                body: 'Our local teams are on standby around the clock to manage every stage of the guest journey. From the first enquiry and seamless check-in through to in-stay support and post-stay review responses — every touchpoint is handled professionally on your behalf.',
              },
              {
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A2927" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ),
                title: 'Passive Income',
                body: 'No late-night calls. No maintenance emergencies. No unexpected surprises at all. Just clear, consistent monthly payouts deposited directly to you while your property earns around the clock.',
              },
              {
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A2927" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                  </svg>
                ),
                title: 'Stress-Free Management',
                body: 'From compliance and cleaning coordination to dynamic pricing and maintenance scheduling — we run the entire operation end to end, so you own a high-performing asset without carrying the day-to-day burden of managing one.',
              },
            ] as const).map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <TiltCard style={{ border: '1px solid #E4D9BE', borderRadius: '20px', padding: 'clamp(28px, 3vw, 44px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F7F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(15px, 1.4vw, 19px)', color: '#000', letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: '14px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#666', lineHeight: 1.8, flex: 1 }}>
                    {item.body}
                  </p>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section style={{ background: '#F1EDE4', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '1.5rem' }}>The Process</p>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
            Listed and earning<br />in as little as <CountUp end={7} /> days.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { n: '01', title: 'Free Revenue Assessment', body: "We conduct a detailed assessment of your property's earning potential, drawing on location data, comparable listings, seasonality patterns, and live market demand — all at no cost and no obligation." },
              { n: '02', title: 'Onboarding & Styling', body: 'We guide you through every step of onboarding, offering tailored advice on furnishing, layout, and presentation to ensure the space photographs beautifully and consistently attracts high-quality guests.' },
              { n: '03', title: 'Professional Listing Launch', body: 'We handle professional photography, write compelling platform-optimised copy, calibrate your opening pricing strategy, and launch simultaneously across Airbnb, Booking.com, VRBO, Stayz, and more.' },
              { n: '04', title: 'Full Guest Management', body: 'From the first enquiry through check-in, in-stay requests, and post-stay reviews — every guest interaction is managed by our team, around the clock, without exception, and without involving you.' },
              { n: '05', title: 'Monthly Payouts', body: 'Each month you receive a clear, itemised performance statement alongside your direct payout. No chasing, no surprises — just transparent reporting and consistent income while your property continues working for you.' },
            ].map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 100}>
                <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(36px, 4vw, 56px)', color: '#E4D9BE', lineHeight: 1, marginBottom: '16px', letterSpacing: '-0.03em' }}>{step.n}</p>
                <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(14px, 1.2vw, 17px)', color: '#000', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#555', lineHeight: 1.75 }}>{step.body}</p>
              </ScrollReveal>
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
            <TiltCard style={{ border: '1px solid #E4D9BE', borderRadius: '16px', padding: 'clamp(32px, 4vw, 48px)', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Essentials</p>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.5vw, 32px)', color: '#000' }}>10%</h3>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: '#666', marginTop: '4px', marginBottom: '1.5rem' }}>of net revenue + GST</p>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '2rem', flexGrow: 1 }}>Designed for owners who handle their own cleaning and maintenance, but want proven experts managing revenue strategy, platform distribution, and the full guest experience from first enquiry to final review.</p>
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
            </TiltCard>

            {/* Signature */}
            <TiltCard style={{ border: '1px solid #2A2927', borderRadius: '16px', padding: 'clamp(32px, 4vw, 48px)', display: 'flex', flexDirection: 'column', background: '#2A2927' }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Signature</p>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.5vw, 32px)', color: '#fff' }}>16%</h3>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', marginBottom: '1.5rem' }}>of net revenue + GST</p>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '2rem', flexGrow: 1 }}>Our most comprehensive offering — complete, truly hands-off management from arrival to departure. Includes everything in Essentials, plus professional cleaning, full linen service, and dedicated on-ground Sydney management after every stay.</p>
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
            </TiltCard>
          </div>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginTop: '24px', textAlign: 'center' }}>$1,000 one-time onboarding fee + GST · No hidden fees</p>
        </div>
      </section>


      {/* Featured In */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(48px, 6vw, 72px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30, borderTop: '1px solid #F0ECE4' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#aaa', textAlign: 'center', marginBottom: '40px' }}>Listed & Distributed On</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
            {[
              { src: '/logos/airbnb.webp',         alt: 'Airbnb',          h: 30 },
              { src: '/logos/bookingcom.png',       alt: 'Booking.com',     h: 28 },
              { src: '/logos/vrbo.png',             alt: 'VRBO',            h: 30 },
              { src: '/logos/stayz.png',            alt: 'Stayz',           h: 30 },
              { src: '/logos/marriottbonvoy.png',   alt: 'Marriott Bonvoy', h: 34 },
              { src: '/logos/google.webp',          alt: 'Google',          h: 28 },
            ].map(({ src, alt, h }) => (
              <img key={alt} src={src} alt={alt} style={{ height: `${h}px`, objectFit: 'contain' }} />
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section style={{ background: '#2A2927', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1.2rem' }}>Owner Stories</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', color: '#f0ece4', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(48px, 6vw, 80px)' }}>
              What our owners say.
            </h2>
          </ScrollReveal>
          <div className="testi-grid">
            {([
              {
                quote: "I spent two years managing it myself, convinced I had it under control. The first month with Meriden showed me exactly what I'd been leaving on the table. Their photography transformed the listing overnight and the pricing strategy operates at a level I simply didn't have access to on my own. The results haven't stopped climbing since.",
                name: 'Gerald M.',
                location: 'Surry Hills',
                bed: '2 bed · 2 bath',
                from: '$5,200',
                to: '$9,200',
              },
              {
                quote: "I was genuinely unsure whether a one-bedroom could justify professional management. That doubt lasted about a week. Bookings filled faster than I'd ever seen, the calibre of guests improved noticeably, and I haven't had to deal with a single issue personally since handing over the keys. It's completely passive now.",
                name: 'Jack S.',
                location: 'Southbank',
                bed: '1 bed · 1 bath',
                from: '$2,300',
                to: '$4,300',
              },
              {
                quote: "I had a long-term tenant for three years before making the switch. The late-night maintenance calls, the pricing guesswork, the endless back-and-forth with guests — all of it just stopped. Meriden absorbed the entire operation and the income has consistently outpaced anything I achieved managing it myself. I genuinely wish I had made the switch sooner.",
                name: 'Beena N.',
                location: 'Darlinghurst',
                bed: '2 bed · 2 bath',
                from: '$5,000',
                to: '$8,800',
              },
            ] as const).map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <TiltCard style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: 'clamp(32px, 3.5vw, 48px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '72px', lineHeight: 0.75, color: '#c9b99a', display: 'block', marginBottom: '24px' }}>"</span>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(16px, 1.4vw, 18px)', color: '#e0d9ce', lineHeight: 1.8, flex: 1, marginBottom: '32px' }}>
                    {t.quote}
                  </p>
                  <div>
                    <div style={{ width: '32px', height: '1px', background: '#c9b99a', marginBottom: '20px' }} />
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', letterSpacing: '0.08em', color: '#f0ece4', marginBottom: '4px' }}>{t.name}</p>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>{t.location} · {t.bed}</p>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', letterSpacing: '0.02em', color: '#c9b99a' }}>
                      {t.from} <span style={{ opacity: 0.5, margin: '0 6px' }}>→</span> {t.to}<span style={{ fontSize: '11px', opacity: 0.6 }}> /mo</span>
                    </p>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(48px, 8vw, 100px)', alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '1.5rem' }}>FAQs</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Questions we<br />get asked most.
            </h2>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#888', lineHeight: 1.8 }}>
              Can't find what you're looking for? Reach out at{' '}
              <a href="mailto:stay@themeridencollection.com" style={{ color: '#2A2927', fontWeight: 400, textDecoration: 'none', borderBottom: '1px solid #2A2927' }}>stay@themeridencollection.com</a>
            </p>
          </div>
          <div>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={item.q}
                q={item.q}
                a={item.a}
                open={openFaqIndex === i}
                onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section
        ref={ctaSectionRef as React.RefObject<HTMLElement>}
        id="inquire"
        style={{ background: '#2A2927', padding: 'clamp(80px, 12vw, 160px) clamp(24px, 4vw, 64px)', textAlign: 'center', position: 'relative', zIndex: 30 }}
        onMouseMove={e => {
          const r = ctaSectionRef.current?.getBoundingClientRect(); if (!r) return
          ctaTarget.current = {
            x: (e.clientX - (r.left + r.width / 2)) * 0.45,
            y: (e.clientY - (r.top + r.height / 2)) * 0.45,
          }
        }}
        onMouseLeave={() => { ctaTarget.current = { x: 0, y: 0 } }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(28px, 4vw, 56px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Ready to maximise your Sydney property?
          </h2>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(14px, 1.3vw, 17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Let's start with a free, no-obligation revenue assessment. Find out exactly what your property could be earning.
          </p>
          <div style={{ display: 'inline-block', transform: `translate(${ctaXy.x}px,${ctaXy.y}px)` }}>
            <button
              onClick={() => { onNavigate('list'); window.scrollTo({ top: 0 }) }}
              style={{ display: 'inline-block', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2A2927', background: '#E4D9BE', padding: '16px 40px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Book a Free Assessment
            </button>
          </div>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(12px, 1vw, 14px)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em', marginTop: '20px', lineHeight: 1.6 }}>
            Even if your property is currently tenanted, we can help you plan the transition.
          </p>
        </div>
      </section>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  usePageMeta('The Meriden Collection | Premium STR Management in Sydney', 'Sydney\'s premium short-term rental management company. Earn up to 50% more than long-term leasing — fully managed, hassle-free.')
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 })
  const bldLightTarget = useRef({ x: 50, y: 50 })
  const bldLightCurr = useRef({ x: 50, y: 50 })
  const [bldLight, setBldLight] = useState({ x: 50, y: 50 })
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

  // Building light RAF
  useEffect(() => {
    let id: number
    const tick = () => {
      bldLightCurr.current.x += (bldLightTarget.current.x - bldLightCurr.current.x) * 0.08
      bldLightCurr.current.y += (bldLightTarget.current.y - bldLightCurr.current.y) * 0.08
      setBldLight({ x: bldLightCurr.current.x, y: bldLightCurr.current.y })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
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
    ? { height: '100%', animation: 'float 7s ease-in-out infinite', position: 'relative' }
    : lifting
    ? { transform: 'translateY(0)', transition: 'transform 1.5s cubic-bezier(0.45, 0, 0.15, 1) 0.4s', height: '100%', position: 'relative' }
    : { transform: 'translateY(102vh)', height: '100%', position: 'relative' }

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
      <section
        ref={heroRef}
        id="hero"
        onMouseMove={e => {
          const r = heroRef.current?.getBoundingClientRect(); if (!r) return
          setHeroMouse({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 })
          const br = innerHouseRef.current?.getBoundingClientRect()
          if (br) {
            bldLightTarget.current = {
              x: ((e.clientX - br.left) / br.width) * 100,
              y: ((e.clientY - br.top) / br.height) * 100,
            }
          }
        }}
        style={{ position: 'relative', minHeight: '100vh', overflow: 'visible', backgroundImage: `url("${BG_IMG}")`, backgroundSize: 'cover', backgroundPosition: `calc(50% + ${heroMouse.x * -22}px) calc(50% + ${heroMouse.y * -14}px)`, backgroundRepeat: 'no-repeat', transition: 'background-position 0.9s cubic-bezier(0.25,0.46,0.45,0.94)' }}
      >
        <div
          className="hero-text-block"
          style={{ position: 'relative', zIndex: 10, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(-28px)', transition: heroVisible ? 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s' : 'none' }}
        >
          <div className="hero-heading-top" style={{ padding: '0 clamp(24px, 4vw, 64px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '-0.04em' }}>
            <h1 className="hero-own-the" style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, textTransform: 'uppercase', color: '#000', letterSpacing: '-0.03em', lineHeight: 1 }}>MANAGED</h1>
            <p className="hero-subtitle-desktop" style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(12px, 1.2vw, 16px)', maxWidth: '320px', opacity: 0.7, lineHeight: 1.6, marginBottom: '0.2em', letterSpacing: '0.02em', textAlign: 'right', color: '#000' }}>
              Sydney owners are switching from<br />long-term leases — and earning up to<br />50% more.
            </p>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h2 className="hero-extraordinary" style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, textTransform: 'uppercase', color: '#000', letterSpacing: '-0.03em', padding: '0 clamp(24px, 4vw, 64px)' }}>
              EXCEPTIONALLY
            </h2>
          </div>
          <p className="hero-subtitle-mobile" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(13px, 3.5vw, 17px)', opacity: 0.65, marginTop: '0.9em', padding: '0 24px', color: '#000' }}>
            Sydney owners are switching from long-term leases — and earning up to 50% more.
          </p>
        </div>
      </section>

      {/* House — centered narrow high-rise, exits downward on scroll */}
      <div style={{ ...houseStyle, opacity: houseVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        {/* Parallax layer — shifts with hero mouse */}
        <div style={{ height: '100%', transform: liftDone ? `translate(${heroMouse.x * 22}px, ${heroMouse.y * 12}px)` : 'none', transition: 'transform 0.9s cubic-bezier(0.25,0.46,0.45,0.94)' }}>
          <div ref={innerHouseRef} style={innerHouseStyle}>
            <div style={{ width: '100%', height: '100%', mixBlendMode: 'multiply' }}>
              <img
                src={HOUSE_IMG}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
              />
            </div>
            {liftDone && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(circle at ${bldLight.x}% ${bldLight.y}%, rgba(255,248,225,0.28), transparent 55%)`,
                maskImage: `url(${HOUSE_IMG})`,
                WebkitMaskImage: `url(${HOUSE_IMG})`,
                maskSize: 'cover',
                WebkitMaskSize: 'cover',
                maskPosition: 'top center',
                WebkitMaskPosition: 'top center',
                mixBlendMode: 'screen',
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Dark sticky section */}
      <div id="story" style={{ position: 'relative', height: '200vh', zIndex: 20 }}>
        <div style={{ height: '4vh', background: '#1a1a1a' }} />
        <div ref={darkSectionRef} className="s2-section" style={{ position: 'sticky', top: 0, height: '100vh', background: '#1a1a1a', overflow: 'hidden' }}>
          <div className="s2-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: `clamp(30px, 4vw, 60px) clamp(24px, 4vw, 64px) clamp(60px, 8vw, 120px)` }}>
            <div className="s2-inner" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', paddingLeft: '25%' }}>
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

              {/* +50% callout */}
              <div style={{ marginTop: 'clamp(40px, 5vw, 64px)', paddingTop: 'clamp(32px, 4vw, 48px)', borderTop: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 'clamp(20px, 3vw, 40px)' }}>
                <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, color: '#f0ece4', fontSize: '2.8rem', lineHeight: 1.1, flexShrink: 0 }}>+<CountUp end={50} suffix="%" /></div>
                <div>
                  <div style={{ width: '32px', height: '1px', background: '#c9b99a', marginBottom: '10px' }} />
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, color: '#9a8f82', fontSize: 'clamp(12px, 1.1vw, 14px)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.6 }}>
                    More revenue on average — <span style={{ color: '#c9b99a' }}>with zero work on your end.</span>
                  </p>
                </div>
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
            {GALLERY_PHOTOS.map((photo, i) => (
              <div key={photo.src} className="gallery-expand-item" onMouseEnter={() => setHoveredVideo(i)} onMouseLeave={() => setHoveredVideo(null)}
                style={{ flex: hoveredVideo === i ? 4 : hoveredVideo !== null ? 0.6 : 1, height: '100%', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <img src={photo.src} alt={photo.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traditional Lease vs Meriden STR Comparison */}
      <section style={{ background: '#F7F4EF', padding: 'clamp(80px, 10vw, 140px) clamp(24px, 4vw, 64px)', position: 'relative', zIndex: 30, borderTop: '1px solid #E8E2D9' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '1.2rem' }}>The Numbers Don’t Lie</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(26px, 3vw, 46px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'clamp(40px, 5vw, 64px)' }}>
              Why owners are leaving<br />long-term leasing behind.
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Josefin Sans', sans-serif" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 300, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', width: '36%', borderBottom: '2px solid #E0D9CE' }}></th>
                    <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 600, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888', background: '#EDE8DF', borderRadius: '6px 6px 0 0', borderBottom: '2px solid #D5CAB8' }}>Traditional Lease</th>
                    <th style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 600, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2A2927', background: '#E4D9BE', borderRadius: '6px 6px 0 0', borderBottom: '2px solid #C9B99A' }}>Meriden STR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Rental Income', lease: 'Baseline fixed rate', str: 'Up to 50% more' },
                    { label: 'Lease Flexibility', lease: 'Fixed 12-month term', str: 'Fully dynamic — adjust anytime' },
                    { label: 'Property Access', lease: 'No access during tenancy', str: 'Block dates and use whenever you like' },
                    { label: 'Property Condition', lease: 'Tenant-controlled', str: 'Professionally cleaned after every stay' },
                    { label: 'Income Growth', lease: 'CPI-linked increases only', str: 'Nightly market pricing — optimised in real time' },
                    { label: 'Owner Involvement', lease: 'Maintenance calls & disputes', str: 'Zero — we handle everything' },
                  ].map((row, i) => (
                    <tr key={row.label} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 400, fontSize: 'clamp(13px, 1.1vw, 15px)', color: '#333', borderBottom: '1px solid #E8E2D9' }}>{row.label}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 'clamp(12px, 1vw, 14px)', color: '#888', background: 'rgba(237,232,223,0.35)', borderBottom: '1px solid #E8E2D9' }}>{row.lease}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 'clamp(12px, 1vw, 14px)', fontWeight: 500, color: '#2A2927', background: 'rgba(228,217,190,0.3)', borderBottom: '1px solid #D5CAB8' }}>{row.str}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Personal use callout pill */}
          <ScrollReveal delay={100}>
            <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '14px', background: '#2A2927', borderRadius: '100px', padding: '16px 28px', width: 'fit-content' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>🗝️</span>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(13px, 1.1vw, 15px)', color: '#E4D9BE', letterSpacing: '0.01em', lineHeight: 1.5, margin: 0 }}>
                Your property, your calendar — block dates and use your home anytime, for as long as you like.
              </p>
            </div>
          </ScrollReveal>
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
  const [currentListingImages, setCurrentListingImages] = useState<Array<{ url: string; sortOrder?: number }> | undefined>(undefined)
  const [currentListingAmenities, setCurrentListingAmenities] = useState<Array<{ amenityName: string }> | undefined>(undefined)
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

  const navigate = (p: Page, listingId?: number, listingImages?: Array<{ url: string; sortOrder?: number }>, listingAmenities?: Array<{ amenityName: string }>) => {
    setPage(p)
    setMenuOpen(false)
    if (listingId !== undefined) setCurrentListingId(listingId)
    if (listingImages !== undefined) setCurrentListingImages(listingImages)
    if (listingAmenities !== undefined) setCurrentListingAmenities(listingAmenities)
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
            {(['home', 'services', 'about', 'list', 'book', 'contact'] as Page[]).map(p => {
              const label = p === 'home' ? 'Home' : p === 'services' ? 'Services' : p === 'about' ? 'About' : p === 'list' ? 'Partner with Us' : p === 'book' ? 'Book a Stay' : 'Contact'
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
            { label: 'Home', page: 'home' as Page },
                { label: 'Services', page: 'services' as Page },
            { label: 'About', page: 'about' as Page },
            { label: 'Partner with Us', page: 'list' as Page },
            { label: 'Book a Stay', page: 'book' as Page },
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

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/61493966175"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 99998, width: '56px', height: '56px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 28px rgba(37,211,102,0.55)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(37,211,102,0.4)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Page content */}
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'services' && <ServicesPage onNavigate={navigate} />}
      {page === 'about' && <AboutPage onNavigate={navigate} />}
      {page === 'list' && <ListPage onBack={() => navigate('home')} />}
      {page === 'book' && <BookPage onViewListing={(id, images, amenities) => { navigate('listing', id, images, amenities); window.scrollTo({ top: 0 }) }} />}
      {page === 'contact' && <ContactPage onBack={() => navigate('home')} />}
      {page === 'privacy' && <PrivacyPolicyPage onBack={() => navigate('home')} />}
      {page === 'terms' && <TermsPage onBack={() => navigate('home')} />}
      {page === 'listing' && currentListingId !== null && (
        <ListingErrorBoundary onReset={() => navigate('book')}>
          <ListingPage
            listingId={currentListingId}
            initialImages={currentListingImages}
            initialAmenities={currentListingAmenities}
            onBack={() => { navigate('book'); window.scrollTo({ top: 0 }) }}
            onViewListing={(id, images, amenities) => { navigate('listing', id, images, amenities); window.scrollTo({ top: 0 }) }}
          />
        </ListingErrorBoundary>
      )}

      <Footer onNavigate={navigate} />
    </>
  )
}
