export type DealStatus = 'draft' | 'published' | 'expired'

export interface Deal {
  id: string
  origin_iata: string
  dest_iata: string
  origin_city: string
  dest_city: string
  airline: string
  normal_price: number
  deal_price: number
  currency: string
  validity_start: string
  validity_end: string
  source_url: string
  image_url: string
  status: DealStatus
  published_at: string | null
  curator_note: string
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  signup_date: string
  confirmed: boolean
  source: string | null
  created_at: string
}
