import React, { useState, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ListingData {
  id: number
  name?: string
  description?: string
  city?: string
  country?: string
  state?: string
  street?: string
  zipcode?: string
  lat?: number
  lng?: number
  bedroomsNumber?: number
  bathroomsNumber?: number
  personCapacity?: number
  guestsNumber?: number
  price?: number
  cleaningFee?: number
  listingImages?: Array<{ url: string; sortOrder?: number }>
  listingAmenities?: Array<{ amenityName: string }>
  checkInTimeStart?: unknown
  checkInTimeEnd?: unknown
  checkOutTime?: unknown
  cancellationPolicy?: unknown
  houseRules?: string
}

interface HostawayReview {
  id?: number
  guestName?: string
  reviewerName?: string
  rating?: number
  publicReview?: string
  submittedAt?: string
  type?: string
}

type AvailStatus = 'available' | 'unavailable'
type AvailDay = { status: AvailStatus; price?: number; minimumStay?: number; closedOnArrival?: boolean }

// ─── Constants ────────────────────────────────────────────────────────────────
const DARK = '#2A2927'
const CREAM = '#E4D9BE'

const FALLBACK: ListingData = {
  id: 429804,
  name: 'The Meriden Residence',
  description: 'A refined city retreat in the heart of Sydney. Floor-to-ceiling glass, curated interiors, and seamless access to the finest dining and culture the city offers.',
  city: 'Sydney',
  country: 'Australia',
  bedroomsNumber: 2,
  bathroomsNumber: 2,
  personCapacity: 4,
  price: 350,
  cleaningFee: 150,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(t?: unknown): string {
  if (t == null || t === '' || t === 0) return ''
  const str = String(t)
  const match = str.match(/(\d+):(\d+)/)
  if (!match) return ''
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (isNaN(h) || isNaN(m)) return ''
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

const CANCELLATION_LABELS: Record<string, string> = {
  '0': 'Flexible — Full refund up to 1 day before check-in.',
  '1': 'Moderate — Full refund up to 5 days before check-in.',
  '2': 'Strict — 50% refund up to 7 days before check-in.',
  '3': 'Non-refundable — No refund after booking.',
  'flexible': 'Full refund up to 1 day before check-in.',
  'moderate': 'Full refund up to 5 days before check-in.',
  'strict': '50% refund up to 7 days before check-in.',
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
  year, month, checkIn, checkOut, hover, avail, checkoutBoundary, minCheckout,
  onPick, onHover, onPrev, onNext,
}: {
  year: number; month: number
  checkIn: Date | null; checkOut: Date | null; hover: Date | null
  avail: Record<string, AvailDay>
  checkoutBoundary: Date | null
  minCheckout: Date | null
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
          const unavail = avail[ds]?.status === 'unavailable'
          const day = avail[ds]
          const selectingCheckout = !!checkIn && !checkOut
          // Checkout boundary: first blocked date after checkIn — selectable as final checkout day
          const isBoundary = !!(checkoutBoundary && sameDay(date, checkoutBoundary))
          const beyondBoundary = !!(selectingCheckout && checkoutBoundary && date > checkoutBoundary)
          // Minimum stay: dates before checkIn + minimumStay are not valid checkouts
          const beforeMinCheckout = !!(selectingCheckout && minCheckout && date < minCheckout)
          // closedOnArrival: date is open but PriceLabs blocks check-ins (e.g. no Sat arrivals)
          const isClosedArrival = !!(day?.closedOnArrival && !selectingCheckout)
          const disabled = past || beyondBoundary || beforeMinCheckout || isClosedArrival || (unavail && !isBoundary)
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
                textDecoration: unavail && !past && !isBoundary ? 'line-through' : 'none',
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

// ─── Description formatter ────────────────────────────────────────────────────
function DescriptionBlock({ text }: { text: string }) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 300,
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.9,
  }
  const paragraphs = text.split(/\n\n+/)
  return (
    <div style={baseStyle}>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n').filter(l => l.trim())
        if (!lines.length) return null
        // Section heading: single short line ending with ':'
        if (lines.length === 1 && lines[0].trim().endsWith(':') && lines[0].trim().length < 70) {
          return (
            <p key={pi} style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '13px', color: '#000', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: pi > 0 ? '28px' : 0, marginBottom: '10px' }}>
              {lines[0].trim().replace(/:$/, '')}
            </p>
          )
        }
        return (
          <div key={pi} style={{ marginBottom: '16px' }}>
            {lines.map((line, li) => {
              const trimmed = line.trim()
              const isBullet = /^[⦿➞★•\-]/.test(trimmed)
              if (isBullet) {
                return (
                  <div key={li} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ color: '#bbb', flexShrink: 0, marginTop: '1px' }}>—</span>
                    <span>{trimmed.replace(/^[⦿➞★•\-]\s*/, '')}</span>
                  </div>
                )
              }
              return <p key={li} style={{ margin: 0, marginBottom: li < lines.length - 1 ? '6px' : 0 }}>{trimmed}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Listing Page ─────────────────────────────────────────────────────────────
interface OtherListing {
  id: number
  name?: string
  city?: string
  bedroomsNumber?: number
  bathroomsNumber?: number
  personCapacity?: number
  guestsNumber?: number
  listingImages?: Array<{ url: string; sortOrder?: number }>
  listingAmenities?: Array<{ amenityName: string }>
}

export default function ListingPage({ listingId, initialImages, initialAmenities, onBack, onViewListing }: { listingId: number; initialImages?: Array<{ url: string; sortOrder?: number }>; initialAmenities?: Array<{ amenityName: string }>; onBack: () => void; onViewListing?: (id: number, images?: Array<{ url: string; sortOrder?: number }>, amenities?: Array<{ amenityName: string }>) => void }) {
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [avail, setAvail] = useState<Record<string, AvailDay>>({})
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)
  const [reviews, setReviews] = useState<HostawayReview[]>([])
  const [reviewsExpanded, setReviewsExpanded] = useState(false)
  const [otherListings, setOtherListings] = useState<OtherListing[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
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

  // Fetch other listings for "You might also like"
  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: OtherListing[]) => {
        if (Array.isArray(data)) setOtherListings(data.filter(l => l.id !== listingId))
      })
      .catch(() => {})
  }, [listingId])

  // Auto-advance carousel
  useEffect(() => {
    if (otherListings.length <= 3) return
    const timer = setInterval(() => {
      setCarouselIndex(i => (i + 1) % (otherListings.length - 2))
    }, 5000)
    return () => clearInterval(timer)
  }, [otherListings.length])

  // Fetch reviews
  useEffect(() => {
    fetch(`/api/listings/${listingId}/reviews`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: HostawayReview[]) => {
        if (Array.isArray(data)) setReviews(
          data.filter(r => r.rating === 10 && r.publicReview && r.type === 'guest-to-host')
        )
      })
      .catch(() => {})
  }, [listingId])

  // Fetch availability (next 6 months)
  useEffect(() => {
    const start = fmt(today)
    const end = fmt(new Date(today.getFullYear(), today.getMonth() + 6, 0))
    fetch(`/api/listings/${listingId}/availability?startDate=${start}&endDate=${end}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Array<{
        date: string; isAvailable?: number | boolean; status?: string;
        isBlockedGuest?: number | boolean; isBlockedOwner?: number | boolean;
        price?: number; minimumStay?: number;
        closedOnArrival?: number | boolean; closedOnDeparture?: number | boolean;
      }>) => {
        const map: Record<string, AvailDay> = {}
        if (Array.isArray(data)) data.forEach(item => {
          if (!item.date) return
          const unavail =
            item.isAvailable === 0 || item.isAvailable === false ||
            item.isBlockedGuest === 1 || item.isBlockedGuest === true ||
            item.isBlockedOwner === 1 || item.isBlockedOwner === true ||
            item.status === 'reserved' || item.status === 'unavailable' ||
            item.status === 'booked' || item.status === 'blocked'
          const closedArr = item.closedOnArrival === 1 || item.closedOnArrival === true
          map[item.date] = {
            status: unavail ? 'unavailable' : 'available',
            price: item.price ?? undefined,
            minimumStay: typeof item.minimumStay === 'number' && item.minimumStay > 0 ? item.minimumStay : undefined,
            closedOnArrival: closedArr || undefined,
          }
        })
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
          totalNightlyCost: Math.round(totalNightlyCost),
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
  const maxGuests = l.personCapacity ?? l.guestsNumber ?? 10
  const basePrice = l.price ?? 0
  const cleaningFee = l.cleaningFee ?? 100
  const nights = checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000) : 0

  // Sum per-night prices from PriceLabs calendar; fall back to base price per night
  let totalNightlyCost = 0
  if (checkIn && checkOut && nights > 0) {
    const cur = new Date(checkIn)
    while (cur < checkOut) {
      totalNightlyCost += avail[fmt(cur)]?.price ?? basePrice
      cur.setDate(cur.getDate() + 1)
    }
  }
  const pricePerNight = nights > 0 ? Math.round(totalNightlyCost / nights) : basePrice
  const subtotal = totalNightlyCost + (nights > 0 ? cleaningFee : 0)
  const gst = subtotal * 0.1
  const total = subtotal + gst

  // First blocked date after checkIn: selectable as checkout (check-out AM, new arrival PM)
  let checkoutBoundary: Date | null = null
  if (checkIn && !checkOut) {
    const cur = new Date(checkIn)
    cur.setDate(cur.getDate() + 1)
    for (let i = 0; i < 365; i++) {
      if (avail[fmt(cur)]?.status === 'unavailable') { checkoutBoundary = new Date(cur); break }
      cur.setDate(cur.getDate() + 1)
    }
  }

  // Earliest valid checkout: checkIn + minimumStay nights (PriceLabs per-date rule)
  const checkInMinNights = checkIn ? (avail[fmt(checkIn)]?.minimumStay ?? 1) : 1
  let minCheckout: Date | null = null
  if (checkIn && !checkOut && checkInMinNights > 1) {
    minCheckout = new Date(checkIn)
    minCheckout.setDate(minCheckout.getDate() + checkInMinNights)
  }

  const imageSource = (l.listingImages && l.listingImages.length > 0) ? l.listingImages : (initialImages ?? [])
  const images: string[] = imageSource.length > 0
    ? [...imageSource].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(i => i.url)
    : []

  const amenities = (l.listingAmenities && l.listingAmenities.length > 0) ? l.listingAmenities : (initialAmenities ?? [])

  const checkInDisplay = formatTime(l.checkInTimeStart)
  const checkInEndDisplay = formatTime(l.checkInTimeEnd)
  const checkOutDisplay = formatTime(l.checkOutTime)
  const cancellationText = l.cancellationPolicy != null
    ? (CANCELLATION_LABELS[String(l.cancellationPolicy)] ?? (typeof l.cancellationPolicy === 'string' ? l.cancellationPolicy : null) ?? 'Moderate — Full refund if cancelled at least 5 days before check-in. 50% refund thereafter.')
    : 'Moderate — Full refund if cancelled at least 5 days before check-in. 50% refund thereafter.'

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

      {/* Gallery — Airbnb style: 1 large left + 2×2 right */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 clamp(24px, 4vw, 64px)' }}>
        {images.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: images.length >= 3 ? '2fr 1fr 1fr' : images.length === 2 ? '3fr 2fr' : '1fr',
              gridTemplateRows: images.length >= 3 ? '290px 290px' : '480px',
              gap: '8px',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {images.slice(0, 5).map((url, i) => (
                <div
                  key={url}
                  onClick={() => { setActiveImg(i); setLightboxOpen(true) }}
                  style={{ gridRow: i === 0 && images.length >= 3 ? '1 / 3' : undefined, overflow: 'hidden', background: CREAM, cursor: 'pointer' }}
                >
                  <img
                    src={url}
                    alt={`${l.name} photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.45s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <button
                onClick={() => { setActiveImg(0); setLightboxOpen(true) }}
                style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '8px', padding: '8px 18px', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.96)')}
              >
                Show all photos
              </button>
            )}
          </div>
        ) : (
          <div style={{ height: '480px', background: CREAM, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                maxGuests > 0 && `Up to ${maxGuests} guests`,
              ].filter(Boolean).map(tag => (
                <span key={String(tag)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555' }}>{tag}</span>
              ))}
            </div>

            {/* Description with Show more */}
            {l.description && (
              <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>About This Property</h2>
                <div style={{ position: 'relative', maxHeight: descExpanded ? 'none' : '160px', overflow: 'hidden' }}>
                  <DescriptionBlock text={l.description} />
                  {!descExpanded && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, transparent, #fff)' }} />
                  )}
                </div>
                <button onClick={() => setDescExpanded(v => !v)} style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', color: DARK, letterSpacing: '0.04em', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  {descExpanded ? 'Show less ↑' : 'Show more ↓'}
                </button>
              </div>
            )}

            {/* What this place offers */}
            {amenities.length > 0 && (() => {
              const SHOW = 10
              const visible = amenitiesExpanded ? amenities : amenities.slice(0, SHOW)
              return (
                <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
                  <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '20px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>What This Place Offers</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {visible.map(a => (
                      <div key={a.amenityName} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: DARK, flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#444' }}>{a.amenityName}</span>
                      </div>
                    ))}
                  </div>
                  {amenities.length > SHOW && (
                    <button onClick={() => setAmenitiesExpanded(v => !v)} style={{ marginTop: '16px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', color: DARK, letterSpacing: '0.04em', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {amenitiesExpanded ? 'Show less ↑' : `Show all ${amenities.length} amenities ↓`}
                    </button>
                  )}
                </div>
              )
            })()}

            {/* Check-in & Check-out Times */}
            <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Check-in & Check-out</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#444' }}>Check-in</span>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#000' }}>
                    {checkInDisplay ? (checkInEndDisplay ? `${checkInDisplay} – ${checkInEndDisplay}` : `From ${checkInDisplay}`) : '3:00 PM – 8:00 PM'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '14px', color: '#444' }}>Check-out</span>
                  <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#000' }}>
                    {checkOutDisplay ? `By ${checkOutDisplay}` : 'By 10:00 AM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Cancellation Policy</h2>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '14px', color: '#555', lineHeight: 1.8, margin: 0 }}>{cancellationText}</p>
            </div>

            {/* House Rules */}
            {l.houseRules && (
              <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '16px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>House Rules</h2>
                <div style={{ position: 'relative', maxHeight: rulesExpanded ? 'none' : '140px', overflow: 'hidden' }}>
                  <DescriptionBlock text={l.houseRules} />
                  {!rulesExpanded && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to bottom, transparent, #fff)' }} />
                  )}
                </div>
                <button onClick={() => setRulesExpanded(v => !v)} style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', color: DARK, letterSpacing: '0.04em', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  {rulesExpanded ? 'Show less ↑' : 'Show more ↓'}
                </button>
              </div>
            )}

            {/* What guests are saying */}
            {reviews.length > 0 && (() => {
              const SHOW_REVIEWS = 4
              const visible = reviewsExpanded ? reviews : reviews.slice(0, SHOW_REVIEWS)
              return (
                <div style={{ paddingBottom: '32px', borderBottom: `1px solid ${CREAM}`, marginBottom: '32px' }}>
                  <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '8px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>What Guests Are Saying</h2>
                  <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginBottom: '24px' }}>
                    ★★★★★ &nbsp;{reviews.length} five-star review{reviews.length !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {visible.map((r, i) => (
                      <div key={r.id ?? i} style={{ border: `1px solid ${CREAM}`, borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', color: '#000', marginBottom: '2px' }}>{r.reviewerName ?? r.guestName ?? 'Guest'}</p>
                            {r.submittedAt && (
                              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#aaa' }}>
                                {new Date(r.submittedAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <span style={{ color: '#c9a84c', fontSize: '12px', letterSpacing: '2px' }}>★★★★★</span>
                        </div>
                        {r.publicReview && (
                          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#555', lineHeight: 1.75, margin: 0, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            "{r.publicReview}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {reviews.length > SHOW_REVIEWS && (
                    <button onClick={() => setReviewsExpanded(v => !v)} style={{ marginTop: '16px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 500, fontSize: '13px', color: DARK, letterSpacing: '0.04em', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                      {reviewsExpanded ? 'Show less ↑' : `Show all ${reviews.length} reviews ↓`}
                    </button>
                  )}
                </div>
              )
            })()}

            {/* Where you'll be */}
            {l.lat != null && l.lng != null && (
              <div style={{ paddingBottom: '32px', marginBottom: '32px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '14px', color: '#000', marginBottom: '8px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Where You'll Be</h2>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '13px', color: '#888', marginBottom: '16px' }}>
                  {[l.street, l.city, l.state].filter(Boolean).join(', ')}
                </p>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${CREAM}` }}>
                  <iframe
                    title="Property location"
                    width="100%"
                    height="360"
                    frameBorder="0"
                    style={{ display: 'block' }}
                    src={`https://maps.google.com/maps?q=${l.lat},${l.lng}&z=15&output=embed`}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Right: booking panel ── */}
          <div style={{ position: 'sticky', top: '104px' }}>
            <div style={{ border: `1px solid ${CREAM}`, borderRadius: '16px', padding: 'clamp(20px, 2vw, 28px)', background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>

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

              {/* Min stay notice */}
              {checkIn && !checkOut && checkInMinNights > 1 && (
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: '#888', letterSpacing: '0.04em', marginBottom: '8px', textAlign: 'center' }}>
                  {checkInMinNights}-night minimum for this check-in date
                </p>
              )}

              {/* Calendar */}
              <div style={{ marginBottom: '16px' }}>
                <CalendarMonth
                  year={calMonth.getFullYear()}
                  month={calMonth.getMonth()}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  hover={hover}
                  avail={avail}
                  checkoutBoundary={checkoutBoundary}
                  minCheckout={minCheckout}
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
                    [`$${pricePerNight.toLocaleString()} avg × ${nights} night${nights !== 1 ? 's' : ''}`, totalNightlyCost],
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

    {/* Lightbox */}
    {lightboxOpen && images.length > 0 && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => { if (e.target === e.currentTarget) setLightboxOpen(false) }}
      >
        {/* Close */}
        <button
          onClick={() => setLightboxOpen(false)}
          aria-label="Close lightbox"
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <X size={24} />
        </button>


{/* Image + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '64px 40px 80px', width: '100%', maxWidth: '1300px', boxSizing: 'border-box' }}>
          <button
            onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '14px', borderRadius: '50%', color: '#fff', display: 'flex', flexShrink: 0, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            <ChevronLeft size={24} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src={images[activeImg]}
              alt={`${l.name} photo ${activeImg + 1}`}
              style={{ maxHeight: 'calc(100vh - 180px)', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', display: 'block' }}
            />
          </div>

          <button
            onClick={() => setActiveImg(i => (i + 1) % images.length)}
            aria-label="Next photo"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '14px', borderRadius: '50%', color: '#fff', display: 'flex', flexShrink: 0, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Photo counter */}
        {images.length > 1 && (
          <p style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', fontFamily: "'Josefin Sans', sans-serif", fontWeight: 400, fontSize: '13px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.45)', padding: '6px 16px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            {activeImg + 1} / {images.length}
          </p>
        )}
      </div>
    )}

    {/* ── You might also like ── */}
    {otherListings.length > 0 && onViewListing && (
      <div style={{ background: '#F9F6F0', borderTop: `1px solid ${CREAM}`, padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 64px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>
            Explore More
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(20px, 2.5vw, 32px)', color: '#000', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              You Might Also Like
            </h2>
            {otherListings.length > 3 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${DARK}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = DARK; (e.currentTarget.querySelector('svg') as SVGElement | null)?.setAttribute('stroke', '#fff') }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; (e.currentTarget.querySelector('svg') as SVGElement | null)?.setAttribute('stroke', DARK) }}
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} color={DARK} />
                </button>
                <button
                  onClick={() => setCarouselIndex(i => Math.min(otherListings.length - 3, i + 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1px solid ${DARK}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = DARK; (e.currentTarget.querySelector('svg') as SVGElement | null)?.setAttribute('stroke', '#fff') }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; (e.currentTarget.querySelector('svg') as SVGElement | null)?.setAttribute('stroke', DARK) }}
                  aria-label="Next"
                >
                  <ChevronRight size={18} color={DARK} />
                </button>
              </div>
            )}
          </div>

          {/* Sliding track */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              gap: '24px',
              transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(calc(-${carouselIndex} * (100% / 3 + 8px)))`,
            }}>
              {otherListings.map(l => {
                const imgUrl = l.listingImages?.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                const beds = l.bedroomsNumber
                const guests = l.personCapacity ?? l.guestsNumber
                return (
                  <div
                    key={l.id}
                    onClick={() => { onViewListing(l.id, l.listingImages, l.listingAmenities); window.scrollTo({ top: 0 }) }}
                    style={{ flexShrink: 0, width: 'calc((100% - 48px) / 3)', cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${CREAM}`, background: '#fff', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ height: '200px', background: CREAM, overflow: 'hidden' }}>
                      {imgUrl
                        ? <img src={imgUrl} alt={l.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(42,41,39,0.3)', textTransform: 'uppercase' }}>Photo Coming Soon</span>
                          </div>
                      }
                    </div>
                    <div style={{ padding: '20px 22px 24px' }}>
                      <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888', marginBottom: '6px' }}>{l.city}</p>
                      <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: 'clamp(14px, 1.3vw, 18px)', color: '#000', marginBottom: '12px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{l.name}</h3>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {[beds && `${beds} bed${beds !== 1 ? 's' : ''}`, guests && `Up to ${guests} guests`].filter(Boolean).map(tag => (
                          <span key={String(tag)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: '#777' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dot indicators */}
          {otherListings.length > 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
              {Array.from({ length: otherListings.length - 2 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  style={{ width: carouselIndex === i ? '20px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: carouselIndex === i ? DARK : CREAM, cursor: 'pointer', padding: 0, transition: 'width 0.3s, background 0.3s' }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}
