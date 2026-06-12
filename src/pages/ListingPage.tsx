import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ListingData {
  id: number
  name?: string
  description?: string
  city?: string
  country?: string
  bedroomsNumber?: number
  bathroomsNumber?: number
  personsCapacity?: number
  guestsNumber?: number
  price?: number
  cleaningFee?: number
  imageUrl?: string
  images?: Array<{ url: string; sortOrder?: number }>
  amenities?: string[]
}

type AvailStatus = 'available' | 'unavailable'

// ─── Constants ────────────────────────────────────────────────────────────────
const DARK = '#2A2927'
const CREAM = '#E4D9BE'

const FALLBACK: ListingData = {
  id: 40467,
  name: 'The Meriden Residence',
  description: 'A refined city retreat in the heart of Sydney. Floor-to-ceiling glass, curated interiors, and seamless access to the finest dining and culture the city offers.',
  city: 'Sydney',
  country: 'Australia',
  bedroomsNumber: 2,
  bathroomsNumber: 2,
  personsCapacity: 4,
  price: 350,
  cleaningFee: 150,
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isPast(d: Date): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d < today
}

function isBetween(d: Date, a: Date, b: Date): boolean {
  return d > a && d < b
}

// ─── Calendar month ───────────────────────────────────────────────────────────
function CalendarMonth({
  year, month, checkIn, checkOut, hover, avail,
  onPick, onHover, onPrev, onNext,
}: {
  year: number; month: number
  checkIn: Date | null; checkOut: Date | null; hover: Date | null
  avail: Record<string, AvailStatus>
  onPick: (d: Date) => void; onHover: (d: Date | null) => void
  onPrev?: () => void; onNext?: () => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Date(year, month, 1).toLocaleString('en-AU', { month: 'long' })
  const rangeEnd = checkOut ?? hover

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <div style={{ width: '100%' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous month"
          style={{ background: 'none', border: 'none', cursor: onPrev ? 'pointer' : 'default', padding: '4px', display: 'flex', alignItems: 'center', color: onPrev ? '#555' : 'transparent', borderRadius: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => { if (onPrev) e.currentTarget.style.color = DARK }}
          onMouseLeave={e => { e.currentTarget.style.color = onPrev ? '#555' : 'transparent' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: DARK }}>
          {monthLabel} {year}
        </span>
        <button
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next month"
          style={{ background: 'none', border: 'none', cursor: onNext ? 'pointer' : 'default', padding: '4px', display: 'flex', alignItems: 'center', color: onNext ? '#555' : 'transparent', borderRadius: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => { if (onNext) e.currentTarget.style.color = DARK }}
          onMouseLeave={e => { e.currentTarget.style.color = onNext ? '#555' : 'transparent' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: "'Josefin Sans', sans-serif", fontSize: '10px', fontWeight: 400, color: '#bbb', letterSpacing: '0.04em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const ds = fmt(date)
          const past = isPast(date)
          const unavail = avail[ds] === 'unavailable'
          const disabled = past || unavail
          const isIn = checkIn && sameDay(date, checkIn)
          const isOut = checkOut && sameDay(date, checkOut)
          const inRange = checkIn && rangeEnd && !isIn && !isOut && isBetween(date, checkIn, rangeEnd)
          const isHov = hover && !checkOut && sameDay(date, hover)

          const bg = isIn || isOut ? DARK : isHov ? '#c5baa8' : inRange ? '#f0ece4' : 'transparent'
          const color = isIn || isOut ? '#fff' : disabled ? '#d5d5d5' : '#000'

          return (
            <div
              key={ds}
              onClick={() => !disabled && onPick(date)}
              onMouseEnter={() => !disabled && onHover(date)}
              onMouseLeave={() => onHover(null)}
              role="button"
              aria-label={ds}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) onPick(date) }}
              style={{
                textAlign: 'center',
                padding: '8px 2px',
                borderRadius: '6px',
                background: bg,
                color,
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: '12px',
                fontWeight: isIn || isOut ? 600 : 300,
                cursor: disabled ? 'default' : 'pointer',
                textDecoration: unavail && !past ? 'line-through' : 'none',
                transition: 'background 0.12s, color 0.12s',
                userSelect: 'none',
                outline: 'none',
              }}
            >
              {date.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Listing Page ─────────────────────────────────────────────────────────────
export default function ListingPage({ listingId, onBack }: { listingId: number; onBack: () => void }) {
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [avail, setAvail] = useState<Record<string, AvailStatus>>({})
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [activeImg, setActiveImg] = useState(0)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestForm, setGuestForm] = useState({ firstName: '', lastName: '', email: '', phone: '', specialRequests: '' })
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const today = new Date()
  const minCal = new Date(today.getFullYear(), today.getMonth(), 1)
  const [calMonth, setCalMonth] = useState(minCal)

  // Fetch listing
  useEffect(() => {
    setLoading(true)
    fetch(`/api/listings/${listingId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: ListingData) => setListing(d))
      .catch(() => setListing(FALLBACK))
      .finally(() => setLoading(false))
  }, [listingId])

  // Fetch availability (next 6 months)
  useEffect(() => {
    const start = fmt(today)
    const end = fmt(new Date(today.getFullYear(), today.getMonth() + 6, 0))
    fetch(`/api/listings/${listingId}/availability?startDate=${start}&endDate=${end}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Array<{ date: string; status: AvailStatus }>) => {
        const map: Record<string, AvailStatus> = {}
        if (Array.isArray(data)) data.forEach(item => { if (item.date) map[item.date] = item.status })
        setAvail(map)
      })
      .catch(() => {})
  }, [listingId])

  const handlePick = (date: Date) => {
    setCheckoutError(null)
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date); setCheckOut(null)
    } else {
      if (date <= checkIn) { setCheckIn(date) }
      else { setCheckOut(date) }
    }
  }

  const handleReserve = () => {
    if (!checkIn || !checkOut) return
    setCheckoutError(null)
    setShowGuestForm(true)
  }

  const submitCheckout = async () => {
    if (!checkIn || !checkOut || !listing) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          listingName: listing.name ?? 'The Meriden Residence',
          checkIn: fmt(checkIn),
          checkOut: fmt(checkOut),
          guests,
          nights,
          pricePerNight,
          cleaningFee,
          gst: Math.round(gst),
          guestFirstName: guestForm.firstName,
          guestLastName: guestForm.lastName,
          guestEmail: guestForm.email,
          guestPhone: guestForm.phone,
          specialRequests: guestForm.specialRequests,
        }),
      })
      if (!res.ok) throw new Error('Unable to start checkout')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const l = listing ?? FALLBACK
  const maxGuests = l.personsCapacity ?? l.guestsNumber ?? 10
  const pricePerNight = l.price ?? 0
  const cleaningFee = l.cleaningFee ?? 100
  const nights = checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000) : 0
  const subtotal = nights * pricePerNight + (nights > 0 ? cleaningFee : 0)
  const gst = subtotal * 0.1
  const total = subtotal + gst

  const images: string[] = []
  if (l.images && l.images.length > 0) {
    const sorted = [...l.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    images.push(...sorted.map(i => i.url))
  } else if (l.imageUrl) {
    images.push(l.imageUrl)
  }

  const canPrevCal = calMonth > minCal
  const maxCalMonth = new Date(today.getFullYear(), today.getMonth() + 6, 1)
  const canNextCal = addMonths(calMonth, 1) < maxCalMonth

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' }}>Loading&hellip;</p>
      </div>
    )
  }

  const guestReady = guestForm.firstName.trim() && guestForm.lastName.trim() && guestForm.email.trim() && guestForm.phone.trim()

  return (
    <>
    {/* Guest details modal */}
    {showGuestForm && (
      <div
        onClick={e => { if (e.target === e.currentTarget) setShowGuestForm(false) }}
        style={{ position: 'fixed', inset: 0, zIndex: 90000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        <div style={{ background: '#fff', borderRadius: '16px', padding: 'clamp(28px, 4vw, 44px)', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
          <button
            onClick={() => setShowGuestForm(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px', display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#000')}
            onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
          >
            <X size={18} />
          </button>

          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Step 1 of 2</p>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#000', letterSpacing: '-0.02em', marginBottom: '24px' }}>Guest Details</h2>

          {/* Booking summary */}
          <div style={{ background: '#F9F7F4', borderRadius: '10px', padding: '16px 20px', marginBottom: '28px' }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '13px', color: '#000', marginBottom: '6px' }}>{l.name}</p>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#666', marginBottom: '6px' }}>
              {checkIn?.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' — '}
              {checkOut?.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{nights} night{nights !== 1 ? 's' : ''} · {guests} guest{guests !== 1 ? 's' : ''}
            </p>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#000' }}>${total.toFixed(0)} AUD total</p>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="g-first">First Name *</label>
              <input id="g-first" className="form-input" type="text" placeholder="Jane" value={guestForm.firstName} onChange={e => setGuestForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="g-last">Last Name *</label>
              <input id="g-last" className="form-input" type="text" placeholder="Smith" value={guestForm.lastName} onChange={e => setGuestForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '24px', gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="g-email">Email *</label>
              <input id="g-email" className="form-input" type="email" placeholder="jane@email.com" value={guestForm.email} onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '24px', gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="g-phone">Phone *</label>
              <input id="g-phone" className="form-input" type="tel" placeholder="+61 4XX XXX XXX" value={guestForm.phone} onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div style={{ marginBottom: '32px', gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="g-requests">
                Special Requests{' '}
                <span style={{ color: '#ccc', fontWeight: 300, letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                id="g-requests"
                className="form-input"
                placeholder="Early check-in, dietary requirements, accessibility needs…"
                rows={3}
                value={guestForm.specialRequests}
                onChange={e => setGuestForm(f => ({ ...f, specialRequests: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {checkoutError && (
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#c0392b', marginBottom: '12px' }}>{checkoutError}</p>
          )}

          <button
            onClick={submitCheckout}
            disabled={!guestReady || checkoutLoading}
            style={{
              width: '100%',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 600, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#fff', background: DARK, padding: '15px', borderRadius: '8px', border: 'none',
              cursor: guestReady && !checkoutLoading ? 'pointer' : 'not-allowed',
              opacity: guestReady ? 1 : 0.38,
              transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
            onMouseEnter={e => { if (guestReady && !checkoutLoading) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = guestReady ? '1' : '0.38' }}
          >
            {checkoutLoading ? (
              <>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Processing…
              </>
            ) : 'Proceed to Payment →'}
          </button>

          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#aaa', textAlign: 'center', marginTop: '12px' }}>
            Card details and billing address collected securely by Stripe on the next step.
          </p>
        </div>
      </div>
    )}

    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '80px' }}>

      {/* Back */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px clamp(24px, 4vw, 64px) 0' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#000')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
        >
          <ArrowLeft size={14} />
          Back to Properties
        </button>
      </div>

      {/* Gallery */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 clamp(24px, 4vw, 64px)' }}>
        {images.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: images.length > 2 ? '2fr 1fr 1fr' : images.length === 2 ? '3fr 2fr' : '1fr', gridTemplateRows: images.length > 1 ? '260px 260px' : '420px', gap: '8px', borderRadius: '16px', overflow: 'hidden' }}>
              {images.slice(0, 5).map((url, i) => (
                <div
                  key={url}
                  onClick={() => setActiveImg(i)}
                  style={{ gridRow: i === 0 && images.length > 2 ? '1 / 3' : undefined, overflow: 'hidden', background: CREAM, cursor: 'pointer' }}
                >
                  <img
                    src={url}
                    alt={`${l.name} photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
              ))}
            </div>
            {/* Lightbox — simple full-screen on click */}
            {activeImg !== null && images.length > 1 && (
              <div
                onClick={() => setActiveImg(0)}
                style={{ display: 'none' }} // placeholder — full lightbox is v2
              />
            )}
          </>
        ) : (
          <div style={{ height: '420px', background: CREAM, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(42,41,39,0.35)' }}>Photos Coming Soon</span>
          </div>
        )}
      </div>

      {/* Content + booking panel */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(36px, 4vw, 56px) clamp(24px, 4vw, 64px) clamp(64px, 8vw, 96px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'start' }}>

          {/* ── Left: details ── */}
          <div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
              {[l.city, l.country].filter(Boolean).join(', ')}
            </p>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(22px, 2.8vw, 36px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
              {l.name}
            </h1>

            {/* Property stats */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingBottom: '28px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
              {[
                l.bedroomsNumber != null && `${l.bedroomsNumber} bedroom${l.bedroomsNumber !== 1 ? 's' : ''}`,
                l.bathroomsNumber != null && `${l.bathroomsNumber} bathroom${l.bathroomsNumber !== 1 ? 's' : ''}`,
                maxGuests && `Up to ${maxGuests} guests`,
              ].filter(Boolean).map(tag => (
                <span key={String(tag)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555' }}>{tag}</span>
              ))}
            </div>

            {/* Description */}
            {l.description && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '14px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>About This Property</h2>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555', lineHeight: 1.9 }}>{l.description}</p>
              </div>
            )}

            {/* Amenities */}
            {l.amenities && l.amenities.length > 0 && (
              <div>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '20px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Amenities</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {l.amenities.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: DARK, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#444' }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: booking panel ── */}
          <div style={{ position: 'sticky', top: '104px' }}>
            <div style={{ border: `1px solid ${CREAM}`, borderRadius: '16px', padding: 'clamp(20px, 2vw, 28px)', background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '22px', color: '#000' }}>
                  {pricePerNight > 0 ? `$${pricePerNight.toLocaleString()}` : 'Contact for price'}
                </span>
                {pricePerNight > 0 && (
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#888' }}>AUD / night</span>
                )}
              </div>

              {/* Date display */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${CREAM}`, borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderRight: `1px solid ${CREAM}` }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Check-in</p>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: checkIn ? '#000' : '#bbb' }}>
                    {checkIn ? checkIn.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Add date'}
                  </p>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Check-out</p>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: checkOut ? '#000' : '#bbb' }}>
                    {checkOut ? checkOut.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Add date'}
                  </p>
                </div>
              </div>

              {/* Guest count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${CREAM}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', marginBottom: '2px' }}>Guests</p>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#000' }}>{guests} guest{guests !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                    aria-label="Decrease guests"
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${guests > 1 ? '#ccc' : '#eee'}`, background: 'none', cursor: guests > 1 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: guests > 1 ? '#000' : '#ddd', fontSize: '16px', lineHeight: 1, transition: 'border-color 0.15s, color 0.15s' }}
                  >−</button>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#000', minWidth: '16px', textAlign: 'center' }}>{guests}</span>
                  <button
                    onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}
                    aria-label="Increase guests"
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${guests < maxGuests ? '#ccc' : '#eee'}`, background: 'none', cursor: guests < maxGuests ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: guests < maxGuests ? '#000' : '#ddd', fontSize: '16px', lineHeight: 1, transition: 'border-color 0.15s, color 0.15s' }}
                  >+</button>
                </div>
              </div>

              {/* Calendar */}
              <div style={{ marginBottom: '16px' }}>
                <CalendarMonth
                  year={calMonth.getFullYear()}
                  month={calMonth.getMonth()}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  hover={hover}
                  avail={avail}
                  onPick={handlePick}
                  onHover={setHover}
                  onPrev={canPrevCal ? () => setCalMonth(m => addMonths(m, -1)) : undefined}
                  onNext={canNextCal ? () => setCalMonth(m => addMonths(m, 1)) : undefined}
                />
              </div>

              {/* Clear dates */}
              {(checkIn || checkOut) && (
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <button
                    onClick={() => { setCheckIn(null); setCheckOut(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.08em', color: '#aaa', textDecoration: 'underline', padding: 0 }}
                  >
                    Clear dates
                  </button>
                </div>
              )}

              {/* Price breakdown */}
              {nights > 0 && (
                <div style={{ borderTop: `1px solid ${CREAM}`, paddingTop: '16px', marginBottom: '16px' }}>
                  {[
                    [`$${pricePerNight.toLocaleString()} × ${nights} night${nights !== 1 ? 's' : ''}`, nights * pricePerNight],
                    ['Cleaning fee', cleaningFee],
                    ['GST (10%)', gst],
                  ].map(([label, val]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#666' }}>{label}</span>
                      <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#000' }}>${Number(val).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${CREAM}`, paddingTop: '12px' }}>
                    <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#000' }}>Total</span>
                    <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: '#000' }}>${total.toFixed(0)} AUD</span>
                  </div>
                </div>
              )}

              {/* Reserve button */}
              <button
                disabled={!checkIn || !checkOut || checkoutLoading}
                onClick={handleReserve}
                style={{
                  width: '100%',
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: DARK,
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: checkIn && checkOut && !checkoutLoading ? 'pointer' : 'not-allowed',
                  opacity: checkIn && checkOut ? 1 : 0.38,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => { if (checkIn && checkOut && !checkoutLoading) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = checkIn && checkOut ? '1' : '0.38' }}
              >
                {checkoutLoading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </>
                ) : checkIn && checkOut ? 'Reserve Now' : 'Select Dates to Reserve'}
              </button>

              {checkoutError && (
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#c0392b', textAlign: 'center', marginTop: '8px' }}>
                  {checkoutError}
                </p>
              )}

              {checkIn && checkOut && !checkoutError && (
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#aaa', textAlign: 'center', marginTop: '10px', letterSpacing: '0.03em' }}>
                  You won't be charged yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
