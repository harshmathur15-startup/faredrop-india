// Gupshup WhatsApp Business API
// Docs: https://docs.gupshup.io/docs/send-message

const GUPSHUP_URL = 'https://api.gupshup.io/wa/api/v1/msg'

interface GupshupConfig {
  apiKey: string
  appName: string
  srcNumber: string // Your WhatsApp Business number (e.g. 917xxxxxxxxxx)
}

function getConfig(): GupshupConfig {
  const apiKey   = process.env.GUPSHUP_API_KEY
  const appName  = process.env.GUPSHUP_APP_NAME
  const srcNumber = process.env.GUPSHUP_SRC_NUMBER
  if (!apiKey || !appName || !srcNumber) {
    throw new Error('Gupshup not configured. Set GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SRC_NUMBER.')
  }
  return { apiKey, appName, srcNumber }
}

// Normalize to 91XXXXXXXXXX (no +, no leading 0)
function e164(phone: string): string {
  return phone.replace(/^\+/, '').replace(/^0+/, '').replace(/^(?!91)/, '91')
}

interface SendResult {
  ok: boolean
  messageId?: string
  error?: string
}

async function send(destination: string, message: object): Promise<SendResult> {
  const { apiKey, appName, srcNumber } = getConfig()

  const body = new URLSearchParams({
    channel:      'whatsapp',
    source:       e164(srcNumber),
    destination:  e164(destination),
    'src.name':   appName,
    message:      JSON.stringify(message),
  })

  let res: Response
  try {
    res = await fetch(GUPSHUP_URL, {
      method:  'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  AbortSignal.timeout(10000),
    })
  } catch (err) {
    return { ok: false, error: String(err) }
  }

  // Gupshup returns 202 on success
  const data = await res.json().catch(() => ({}))
  if (res.status === 202 || res.ok) {
    return { ok: true, messageId: data?.messageId ?? data?.id }
  }
  return { ok: false, error: data?.message ?? `HTTP ${res.status}` }
}

// ── Public helpers ───────────────────────────────────────────────────────────

export async function sendWhatsAppText(phone: string, text: string): Promise<SendResult> {
  return send(phone, { type: 'text', text })
}

export async function sendPriceAlertWhatsApp({
  phone, originCity, destCity, originIata, destIata,
  currentPrice, targetPrice, triggerType, cabinClass, tripType,
}: {
  phone: string
  originCity: string; destCity: string
  originIata: string; destIata: string
  currentPrice: number; targetPrice: number
  triggerType: 'target_reached' | 'price_drop'
  cabinClass: string; tripType: string
}): Promise<SendResult> {
  const saving = targetPrice - currentPrice
  const emoji  = triggerType === 'target_reached' ? '🎯' : '📉'
  const cabin  = cabinClass === 'premium_economy' ? 'Premium Economy'
    : cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)
  const gflights = `https://www.google.com/travel/flights?q=Flights+to+${destIata}+from+${originIata}`

  const lines = [
    `${emoji} *Travelbaby Flight Alert*`,
    '',
    `✈️ *${originCity} → ${destCity}*`,
    `🏷️ ${cabin} · ${tripType === 'roundtrip' ? 'Return' : 'One-way'}`,
    '',
    `💰 Current price: *₹${currentPrice.toLocaleString('en-IN')}*`,
    triggerType === 'target_reached'
      ? `✅ Your target of ₹${targetPrice.toLocaleString('en-IN')} has been reached!`
      : `📉 Dropped! Save ₹${saving.toLocaleString('en-IN')} vs your target.`,
    '',
    `⚡ Act fast — prices change quickly.`,
    `🔗 ${gflights}`,
    '',
    `Reply STOP to opt out.`,
  ]

  return send(phone, { type: 'text', text: lines.join('\n') })
}

export async function sendWelcomeWhatsApp({
  phone, name,
}: {
  phone: string
  name: string
}): Promise<SendResult> {
  const firstName = name.split(' ')[0]
  const lines = [
    `👋 Hi *${firstName}*, welcome to *Travelbaby*! ✈️`,
    '',
    `You've opted in for WhatsApp flight deal alerts.`,
    `We'll ping you when prices drop on your saved routes.`,
    '',
    `Set up an alert: https://travelbaby.in/alerts`,
    '',
    `Reply STOP anytime to unsubscribe.`,
  ]

  return send(phone, { type: 'text', text: lines.join('\n') })
}
