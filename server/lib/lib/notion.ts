// Creates an Owner Leads row in Notion for each website assessment request.
// Needs NOTION_TOKEN (an internal integration secret) and NOTION_LEADS_DB
// (the Owner Leads database ID). If either is missing, this quietly does nothing.

interface LeadInput {
  name: string
  email: string
  phone: string
  address: string
  bedrooms: string
  package: string
  notes: string
  weeklyRent: string
}

const PACKAGE_MAP: Record<string, string> = {
  essentials: 'Essentials (10%)',
  signature: 'Signature (16%)',
}

const text = (s: string) => [{ type: 'text', text: { content: s.slice(0, 1900) } }]

export async function createOwnerLead(data: LeadInput): Promise<void> {
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_LEADS_DB
  if (!token || !databaseId) {
    console.warn('NOTION_TOKEN or NOTION_LEADS_DB not set — skipping Notion lead')
    return
  }
  // Skip obvious test submissions
  if (/^test$/i.test(data.name.trim())) return

  const rent = Number(String(data.weeklyRent ?? '').replace(/[^0-9.]/g, ''))
  const details = [
    data.bedrooms ? `Bedrooms: ${data.bedrooms}` : '',
    `Phone: ${data.phone}`,
    data.notes ? `Notes: ${data.notes}` : '',
    'Submitted via the website assessment form.',
  ].filter(Boolean).join('\n')

  const properties: Record<string, unknown> = {
    Lead: { title: text(`${data.address.trim()} (${data.name.trim()})`) },
    Stage: { select: { name: 'New' } },
    Source: { select: { name: 'Website form' } },
    Package: { select: { name: PACKAGE_MAP[data.package] ?? 'Undecided' } },
    'Contact email': { email: data.email.trim() },
    'Property details': { rich_text: text(details) },
    'Next action': { rich_text: text('Claude to prepare proposal (next queue run)') },
  }
  if (rent > 0) properties['Stated weekly rent'] = { number: rent }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  })
  if (!res.ok) {
    throw new Error(`Notion lead create failed (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`)
  }
}
