import nodemailer from 'nodemailer'

const BRAND = 'The Meriden Collection'
const CONTACT_EMAIL = 'stay@themeridencollection.com'

const BASE_HTML = (body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:40px 16px">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#2A2927;padding:32px 40px;text-align:center">
            <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.5)">The Meriden Collection</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f0;border-top:1px solid #e8e2d9;padding:24px 40px;text-align:center">
            <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#999">
              ${BRAND} · ABN 92 610 393 957
            </p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#bbb">
              <a href="mailto:${CONTACT_EMAIL}" style="color:#2A2927;text-decoration:none">${CONTACT_EMAIL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

export interface MailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendMail({ to, subject, html, replyTo }: MailOptions) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) { console.warn('Email not configured — skipping'); return }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `"${BRAND}" <${user}>`,
    to,
    subject,
    html: BASE_HTML(html),
    ...(replyTo ? { replyTo } : {}),
  })
}

function row(label: string, value: string, shaded = false) {
  const bg = shaded ? 'background:#f9f6f0;' : ''
  return `
    <tr>
      <td style="${bg}padding:10px 14px;border:1px solid #e8e2d9;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#555;width:160px">${label}</td>
      <td style="${bg}padding:10px 14px;border:1px solid #e8e2d9;font-family:Arial,sans-serif;font-size:13px;color:#222">${value}</td>
    </tr>`
}

export function bookingConfirmationHtml(data: {
  guestName: string
  listingName: string
  reservationRef: string
  checkIn: string
  checkOut: string
  guests: string
  nights: string
}) {
  return `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#2A2927;font-weight:normal">Booking Confirmed</h2>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#666;line-height:1.6">Dear ${data.guestName},</p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      Thank you for choosing <strong>${data.listingName}</strong> for your stay! We are delighted to confirm your reservation with us.
    </p>

    <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#888">Reservation Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:32px">
      ${row('Reservation No.', data.reservationRef, true)}
      ${row('Guest Name', data.guestName)}
      ${row('Check-in Date', data.checkIn, true)}
      ${row('Check-in Time', '3:00 PM')}
      ${row('Check-out Date', data.checkOut, true)}
      ${row('Check-out Time', '10:00 AM')}
      ${row('Total Guests', data.guests, true)}
      ${row('Total Nights', data.nights)}
    </table>

    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      If you have any questions or special requests, please do not hesitate to contact us at
      <a href="mailto:stay@themeridencollection.com" style="color:#2A2927">stay@themeridencollection.com</a>.
      We look forward to making your stay as comfortable and enjoyable as possible.
    </p>

    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#2A2927;font-style:italic">
      Warm regards,<br>The Meriden Collection
    </p>
  `
}

export function inquiryAutoReplyHtml(name: string) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#2A2927;font-weight:normal">We've received your enquiry</h2>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">Hi ${name},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      Thank you for reaching out. We've received your property assessment request and one of our team members will be in touch within one business day.
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      In the meantime, if you'd like to secure a time to speak with us, you can schedule a free 30-minute consultation directly through the link on our website.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#2A2927;font-style:italic">
      Warm regards,<br>The Meriden Collection
    </p>
  `
}

export function assessmentNotificationHtml(data: {
  name: string; email: string; phone: string; address: string
  bedrooms: string; pkg: string; weeklyRent: string; notes: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">New Property Assessment Request</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Name', data.name, true)}
      ${row('Email', `<a href="mailto:${data.email}" style="color:#2A2927">${data.email}</a>`)}
      ${row('Phone', `<a href="tel:${data.phone}" style="color:#2A2927">${data.phone}</a>`, true)}
      ${row('Property', data.address)}
      ${row('Bedrooms', data.bedrooms || 'Not specified', true)}
      ${row('Package', data.pkg || 'Not specified')}
      ${row('Weekly Rent', data.weeklyRent ? `$${data.weeklyRent}/week` : 'Not specified', true)}
      ${row('Notes', data.notes || '—')}
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
      Submitted ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })} AEST
    </p>
  `
}

export function contactNotificationHtml(data: {
  name: string; email: string; phone: string; subject: string; message: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">New Contact Form Submission</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Name', data.name, true)}
      ${row('Email', `<a href="mailto:${data.email}" style="color:#2A2927">${data.email}</a>`)}
      ${row('Phone', data.phone || '—', true)}
      ${row('Subject', data.subject || 'Not specified')}
    </table>
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#aaa">Message</p>
    <div style="padding:16px;background:#f9f6f0;border:1px solid #e8e2d9;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7;white-space:pre-wrap">${data.message}</div>
    <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
      Submitted ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })} AEST
    </p>
  `
}

export function contactAutoReplyHtml(name: string) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#2A2927;font-weight:normal">Message received</h2>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">Hi ${name.split(' ')[0]},</p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      Thanks for getting in touch. We've received your message and will respond within one business day.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#2A2927;font-style:italic">
      Warm regards,<br>The Meriden Collection
    </p>
  `
}

export function calendlyBookingHtml(data: {
  inviteeName: string; inviteeEmail: string; eventName: string
  startTime: string; endTime: string; timezone: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">New Consultation Booked</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Name', data.inviteeName, true)}
      ${row('Email', `<a href="mailto:${data.inviteeEmail}" style="color:#2A2927">${data.inviteeEmail}</a>`)}
      ${row('Event', data.eventName, true)}
      ${row('Start', data.startTime)}
      ${row('End', data.endTime, true)}
      ${row('Timezone', data.timezone)}
    </table>
  `
}

export function refundConfirmationHtml(data: {
  guestName: string; amount: string; reservationRef: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#2A2927;font-weight:normal">Refund Processed</h2>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">Hi ${data.guestName.split(' ')[0]},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      Your refund of <strong>${data.amount}</strong> has been processed${data.reservationRef ? ` for reservation <strong>${data.reservationRef}</strong>` : ''}.
    </p>
    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      Please allow 5–10 business days for the funds to appear on your statement, depending on your bank.
    </p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.7">
      If you have any questions, please contact us at
      <a href="mailto:stay@themeridencollection.com" style="color:#2A2927">stay@themeridencollection.com</a>.
    </p>
    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#2A2927;font-style:italic">
      Warm regards,<br>The Meriden Collection
    </p>
  `
}

export function refundNotificationHtml(data: {
  guestName: string; guestEmail: string; amount: string
  reservationRef: string; chargeId: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">Refund Issued</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Charge ID', data.chargeId, true)}
      ${data.reservationRef ? row('Reservation', data.reservationRef) : ''}
      ${row('Guest', data.guestName, true)}
      ${row('Email', `<a href="mailto:${data.guestEmail}" style="color:#2A2927">${data.guestEmail}</a>`)}
      ${row('Refund Amount', data.amount, true)}
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
      Processed ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })} AEST
    </p>
  `
}

export function paymentFailedNotificationHtml(data: {
  paymentIntentId: string; amount: string; guestEmail: string; errorMessage: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">Payment Failed</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Payment Intent', data.paymentIntentId, true)}
      ${row('Amount', data.amount)}
      ${row('Guest Email', data.guestEmail || '—', true)}
      ${row('Error', data.errorMessage)}
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
      ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })} AEST
    </p>
  `
}

export function bookingOwnerNotificationHtml(data: {
  guestName: string; guestEmail: string; guestPhone: string
  listingName: string; checkIn: string; checkOut: string
  guests: string; nights: string; totalAud: string
  reservationRef: string; specialRequests: string
}) {
  return `
    <h2 style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px;color:#2A2927;font-weight:normal">New Booking Confirmed</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
      ${row('Reservation', data.reservationRef, true)}
      ${row('Listing', data.listingName)}
      ${row('Guest', data.guestName, true)}
      ${row('Email', `<a href="mailto:${data.guestEmail}" style="color:#2A2927">${data.guestEmail}</a>`)}
      ${row('Phone', data.guestPhone || '—', true)}
      ${row('Check-in', data.checkIn)}
      ${row('Check-out', data.checkOut, true)}
      ${row('Guests', data.guests)}
      ${row('Nights', data.nights, true)}
      ${row('Total Paid', `$${data.totalAud} AUD`)}
      ${data.specialRequests ? row('Requests', data.specialRequests, true) : ''}
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#aaa">
      Payment confirmed ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'medium', timeStyle: 'short' })} AEST
    </p>
  `
}
