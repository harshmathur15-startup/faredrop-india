import { Resend } from 'resend'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 'your-resend-key-here' || key.length < 10) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(key)
}

const FROM = `Travelbaby <${process.env.RESEND_FROM_EMAIL ?? 'deals@travelbaby.in'}>`
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_BASE_URL
  : 'https://travelbaby.in'

function shell(body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Travelbaby</title></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
      <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;text-align:center">
        <p style="margin:0;font-size:28px">✈️</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.3px">Travelbaby</h1>
        <p style="margin:3px 0 0;color:#bfdbfe;font-size:12px">India's smartest flight deal finder</p>
      </div>
      <div style="padding:32px 36px">${body}</div>
      <div style="padding:18px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px">
          © ${new Date().getFullYear()} Travelbaby ·
          <a href="${BASE_URL}/about" style="color:#94a3b8;text-decoration:none">About</a> ·
          <a href="${BASE_URL}/alerts" style="color:#94a3b8;text-decoration:none">Manage alerts</a>
        </p>
      </div>
    </div>
  </body></html>`
}

function btn(href: string, label: string): string {
  return `<div style="text-align:center;margin-top:24px">
    <a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:12px;font-size:15px">${label}</a>
  </div>`
}

// ── Welcome ─────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  const firstName = name.split(' ')[0]
  const resend = getResend()
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to Travelbaby, ${firstName}! ✈️`,
    html: shell(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:800">Hey ${firstName}, welcome aboard! 🎉</h2>
      <p style="color:#64748b;margin:0 0 20px;line-height:1.6">
        You're now part of India's smartest flight deal community. We monitor 500+ routes round the clock so you never miss a bargain.
      </p>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:18px;margin-bottom:24px">
        <p style="margin:0 0 10px;font-weight:700;color:#1e40af;font-size:14px">What happens next</p>
        <ul style="margin:0;padding-left:18px;color:#374151;line-height:2;font-size:14px">
          <li>Set a price alert on any route you're watching</li>
          <li>We'll email (and WhatsApp) you when prices drop 15%+</li>
          <li>Browse curated live deals hand-picked by our team</li>
        </ul>
      </div>
      ${btn(`${BASE_URL}/alerts`, 'Create your first alert →')}
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;text-align:center">
        We only email when prices genuinely drop. No spam, ever.
      </p>
    `),
  })
}

// ── Price Alert ──────────────────────────────────────────────────────────────

export async function sendPriceAlertEmail({
  to, name, alert, currentPrice, triggerType,
}: {
  to: string
  name: string
  alert: {
    origin_iata: string; dest_iata: string
    origin_city: string; dest_city: string
    target_price: number; cabin_class: string
    trip_type: string; travel_month?: string | null
  }
  currentPrice: number
  triggerType: 'target_reached' | 'price_drop'
}) {
  const resend = getResend()
  const firstName = name.split(' ')[0]
  const saving = alert.target_price - currentPrice
  const isTarget = triggerType === 'target_reached'
  const cabinLabel = alert.cabin_class === 'premium_economy'
    ? 'Premium Economy'
    : alert.cabin_class.charAt(0).toUpperCase() + alert.cabin_class.slice(1)
  const route = `${alert.origin_city} → ${alert.dest_city}`
  const gflights = `https://www.google.com/travel/flights?q=Flights+from+${alert.origin_iata}+to+${alert.dest_iata}`

  const subject = isTarget
    ? `🎯 Target reached! ${route} at ₹${currentPrice.toLocaleString('en-IN')}`
    : `📉 Price dropped! ${route} – save ₹${saving.toLocaleString('en-IN')}`

  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html: shell(`
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:52px">${isTarget ? '🎯' : '📉'}</span>
        <h2 style="margin:10px 0 4px;color:#1e293b;font-size:22px;font-weight:800">
          ${isTarget ? `Your target price is here, ${firstName}!` : `Price just dropped, ${firstName}!`}
        </h2>
        <p style="margin:0;color:#64748b;font-size:14px">${route} · ${cabinLabel} · ${alert.trip_type === 'roundtrip' ? 'Round trip' : 'One way'}</p>
      </div>

      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:22px;text-align:center;margin-bottom:22px">
        <p style="margin:0 0 2px;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Current fare</p>
        <p style="margin:0;font-size:38px;font-weight:900;color:#15803d;letter-spacing:-1px">
          ₹${currentPrice.toLocaleString('en-IN')}
        </p>
        ${saving > 0 ? `<p style="margin:6px 0 0;color:#166534;font-size:13px;font-weight:600">You save ₹${saving.toLocaleString('en-IN')} vs your target</p>` : ''}
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px">
        <tr>
          <td style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;width:45%">
            <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em">From</p>
            <p style="margin:4px 0 2px;font-size:22px;font-weight:900;color:#1e293b">${alert.origin_iata}</p>
            <p style="margin:0;font-size:12px;color:#64748b">${alert.origin_city}</p>
          </td>
          <td style="text-align:center;font-size:22px;color:#64748b">✈️</td>
          <td style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center;width:45%">
            <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.08em">To</p>
            <p style="margin:4px 0 2px;font-size:22px;font-weight:900;color:#1e293b">${alert.dest_iata}</p>
            <p style="margin:0;font-size:12px;color:#64748b">${alert.dest_city}</p>
          </td>
        </tr>
      </table>

      <p style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin:0 0 22px;color:#b91c1c;font-size:13px;font-weight:600;text-align:center">
        ⚡ Flight prices change fast — book within 24–48 hours
      </p>
      ${btn(gflights, 'Search on Google Flights →')}
      <p style="margin:16px 0 0;text-align:center">
        <a href="${BASE_URL}/alerts" style="color:#94a3b8;font-size:12px;text-decoration:none">Manage your alerts</a>
      </p>
    `),
  })
}

// ── OTP (fallback — Supabase handles OTP natively via Resend SMTP) ───────────

export async function sendOtpEmail({ to, otp }: { to: string; otp: string }) {
  const resend = getResend()
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${otp} is your Travelbaby login code`,
    html: shell(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:800">Your one-time login code</h2>
      <p style="color:#64748b;margin:0 0 24px">Enter this code to sign in to Travelbaby. It expires in 10 minutes.</p>
      <div style="background:#eff6ff;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px">
        <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:0.25em;color:#1d4ed8">${otp}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center">
        Didn't request this? You can safely ignore this email.
      </p>
    `),
  })
}
