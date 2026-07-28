export type UserRole = 'traveller' | 'agent' | 'creator'

export interface Profile {
  user_id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  agency_name: string | null
  agency_city: string | null
  instagram_handle: string | null
  audience_size: number | null
  created_at: string
  updated_at: string
}

export type PackageVerification = 'pending' | 'verified' | 'rejected'

export interface AgentPackage {
  id: string
  agent_id: string
  title: string
  destination: string
  description: string | null
  price_per_person: number | null
  duration_days: number | null
  start_date: string | null
  end_date: string | null
  inclusions: string | null
  image_url: string | null
  verification_status: PackageVerification
  visible_to_travellers: boolean
  rejection_reason: string | null
  published_at: string | null
  created_at: string
}
