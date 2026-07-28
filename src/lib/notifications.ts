import { supabaseAdmin } from './supabase'
import { sendWelcomeEmail, sendPriceAlertEmail, sendDealEmail } from './email'
import { sendPriceAlertWhatsApp, sendWelcomeWhatsApp, sendDealAlertWhatsApp } from './whatsapp'
import type { Deal } from '@/types'

type Channel = 'email' | 'whatsapp'
type NotifType = 'price_drop' | 'target_reached' | 'welcome' | 'weekly_deals' | 'price_increased'
type Status = 'sent' | 'failed'

async function logNotification(
  userId: string, alertId: string | null,
  channel: Channel, type: NotifType,
  status: Status, payload: object, errorMsg?: string,
) {
  await supabaseAdmin.from('notification_log').insert({
    user_id:   userId,
    alert_id:  alertId,
    channel,
    type,
    status,
    payload,
    error_msg: errorMsg ?? null,
    sent_at:   status === 'sent' ? new Date().toISOString() : null,
  })
}

export interface AlertData {
  id: string
  user_id: string
  origin_iata: string; dest_iata: string
  origin_city: string; dest_city: string
  target_price: number
  cabin_class: string; trip_type: string
  travel_month: string | null
}

export interface UserContact {
  email: string
  name: string
  whatsapp_number: string | null
  whatsapp_opted_in: boolean
  email_opted_in: boolean
}

// ── Price alert (target_reached | price_drop) ────────────────────────────────

export async function notifyPriceAlert({
  alert, currentPrice, triggerType, contact,
}: {
  alert: AlertData
  currentPrice: number
  triggerType: 'target_reached' | 'price_drop'
  contact: UserContact
}) {
  const payload = { alertId: alert.id, route: `${alert.origin_iata}-${alert.dest_iata}`, currentPrice, triggerType }
  const results = { email: false, whatsapp: false }

  if (contact.email_opted_in && contact.email) {
    try {
      await sendPriceAlertEmail({ to: contact.email, name: contact.name, alert, currentPrice, triggerType })
      await logNotification(alert.user_id, alert.id, 'email', triggerType, 'sent', payload)
      results.email = true
    } catch (err) {
      await logNotification(alert.user_id, alert.id, 'email', triggerType, 'failed', payload, String(err))
    }
  }

  if (contact.whatsapp_opted_in && contact.whatsapp_number) {
    try {
      await sendPriceAlertWhatsApp({
        phone:        contact.whatsapp_number,
        originCity:   alert.origin_city,
        destCity:     alert.dest_city,
        originIata:   alert.origin_iata,
        destIata:     alert.dest_iata,
        currentPrice,
        targetPrice:  alert.target_price,
        triggerType,
        cabinClass:   alert.cabin_class,
        tripType:     alert.trip_type,
      })
      await logNotification(alert.user_id, alert.id, 'whatsapp', triggerType, 'sent', payload)
      results.whatsapp = true
    } catch (err) {
      await logNotification(alert.user_id, alert.id, 'whatsapp', triggerType, 'failed', payload, String(err))
    }
  }

  return results
}

// ── Welcome (post-signup) ────────────────────────────────────────────────────

export async function notifyWelcome({
  userId, email, name, whatsappNumber, whatsappOptedIn,
}: {
  userId: string; email: string; name: string
  whatsappNumber: string | null; whatsappOptedIn: boolean
}) {
  if (email) {
    try {
      await sendWelcomeEmail({ to: email, name })
      await logNotification(userId, null, 'email', 'welcome', 'sent', { email })
    } catch (err) {
      await logNotification(userId, null, 'email', 'welcome', 'failed', { email }, String(err))
    }
  }

  if (whatsappOptedIn && whatsappNumber) {
    try {
      await sendWelcomeWhatsApp({ phone: whatsappNumber, name })
      await logNotification(userId, null, 'whatsapp', 'welcome', 'sent', { name })
    } catch (err) {
      await logNotification(userId, null, 'whatsapp', 'welcome', 'failed', { name }, String(err))
    }
  }
}

// ── New deal published (broadcast) ───────────────────────────────────────────
// Fires when Travel Baby publishes a deal. WhatsApp → opted-in registered
// travellers (user_preferences); Email → confirmed subscribers (deal-drop list).
//
// NOTE: WhatsApp free-text outside a 24h user session requires an APPROVED
// Gupshup template — sends will otherwise be dropped by WhatsApp. Email has no
// such limit. Every send is logged (notification_log for WhatsApp, deal_events
// for subscriber emails).

export interface DealBroadcastSummary {
  whatsapp_sent: number; whatsapp_failed: number
  email_sent: number; email_failed: number
  recipients: number
}

export async function notifyDealPublished(deal: Deal): Promise<DealBroadcastSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_BASE_URL
    : 'https://travelbaby.in'
  const dealUrl = `${baseUrl}/deal/${deal.id}`

  const summary: DealBroadcastSummary = {
    whatsapp_sent: 0, whatsapp_failed: 0, email_sent: 0, email_failed: 0, recipients: 0,
  }

  // WhatsApp → opted-in registered travellers.
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id, whatsapp_number')
    .eq('whatsapp_opted_in', true)
    .not('whatsapp_number', 'is', null)

  for (const p of prefs ?? []) {
    summary.recipients++
    try {
      const res = await sendDealAlertWhatsApp({ phone: p.whatsapp_number, deal, dealUrl })
      if (res.ok) {
        summary.whatsapp_sent++
        await logNotification(p.user_id, null, 'whatsapp', 'weekly_deals', 'sent', { dealId: deal.id })
      } else {
        summary.whatsapp_failed++
        await logNotification(p.user_id, null, 'whatsapp', 'weekly_deals', 'failed', { dealId: deal.id }, res.error)
      }
    } catch (err) {
      summary.whatsapp_failed++
      await logNotification(p.user_id, null, 'whatsapp', 'weekly_deals', 'failed', { dealId: deal.id }, String(err))
    }
  }

  // Email → confirmed subscribers (the deal-drop list).
  const { data: subs } = await supabaseAdmin
    .from('subscribers')
    .select('id, email')
    .eq('confirmed', true)

  for (const s of subs ?? []) {
    summary.recipients++
    try {
      await sendDealEmail({ to: s.email, deal, dealUrl })
      summary.email_sent++
      await supabaseAdmin.from('deal_events').insert({ deal_id: deal.id, subscriber_id: s.id, event_type: 'sent' })
    } catch {
      summary.email_failed++
    }
  }

  return summary
}
