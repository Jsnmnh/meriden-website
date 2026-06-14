import 'dotenv/config'

const ACCOUNT_ID = process.env.HOSTAWAY_ACCOUNT_ID!
const API_KEY = process.env.HOSTAWAY_API_KEY!
const BASE = 'https://api.hostaway.com/v1'

let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: ACCOUNT_ID,
    client_secret: API_KEY,
    scope: 'general',
  })

  const res = await fetch('https://api.hostaway.com/v1/accessTokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error(`Hostaway auth failed: ${res.status} ${await res.text()}`)

  const data = await res.json() as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000
  return cachedToken
}

async function request<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
  })
  if (!res.ok) throw new Error(`Hostaway API error: ${res.status} ${await res.text()}`)
  const json = await res.json() as { result: T }
  return json.result
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Hostaway API error: ${res.status} ${await res.text()}`)
  const json = await res.json() as { result: T }
  return json.result
}

export async function getListings() {
  return request<unknown[]>('/listings')
}

export async function getListing(id: number) {
  return request<unknown>(`/listings/${id}`)
}

export async function getListingImages(id: number) {
  return request<unknown[]>(`/listings/${id}/listingImages`)
}

export async function getReviews(listingId: number) {
  return request<unknown[]>(`/reviews?listingId=${listingId}&limit=500&sortOrder=submittedAt%20desc`)
}

export async function getCalendar(id: number, startDate: string, endDate: string) {
  return request<unknown[]>(`/listings/${id}/calendar?startDate=${startDate}&endDate=${endDate}`)
}

export async function createReservation(data: {
  listingId: number
  checkIn: string
  checkOut: string
  guests: number
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  guestPhone: string
  totalPrice: number
  specialRequests?: string
}): Promise<{ id: number }> {
  return post<{ id: number }>('/reservations', {
    listingId: data.listingId,
    channelId: 0,
    source: 'direct',
    checkInDate: data.checkIn,
    checkOutDate: data.checkOut,
    numberOfGuests: data.guests,
    guestFirstName: data.guestFirstName,
    guestLastName: data.guestLastName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone || '',
    totalPrice: data.totalPrice,
    paymentMethod: 'creditCard',
    isPaid: 1,
    notes: data.specialRequests || '',
  })
}
