export interface Casino {
  id: string
  name: string
  description: string | null
  rating: number | null
  location: string | null
  bonus_info: string | null
  logo_url: string | null
  website_url: string | null
  license?: string | null
  player_rating_avg?: number | null
  player_rating_count?: number | null
  // Home curation fields
  is_featured_home?: boolean | null
  home_rank?: number | null
  created_at: string
  updated_at: string
}

export interface Bonus {
  id: string
  title: string
  description: string | null
  bonus_amount: string | null
  bonus_type: string | null
  expiry_date: string | null
  casino_id: string | null
  claim_url: string | null
  // Extended fields for full bonus details
  promo_code?: string | null
  is_exclusive?: boolean | null
  is_no_deposit?: boolean | null
  wagering_x?: number | null
  wagering_text?: string | null
  free_spins?: number | null
  free_spin_value?: number | null
  value_text?: string | null
  max_bet?: number | null
  max_bet_text?: string | null
  expiry_days?: number | null
  expiry_text?: string | null
  play_now_text?: string | null
  terms?: string | null
  how_to_get?: string | null
  image_url?: string | null
  yes_count?: number | null
  no_count?: number | null
  // Home curation fields (Exclusive Bonuses section)
  is_featured_home?: boolean | null
  home_rank?: number | null
  home_link_override?: string | null
  created_at: string
  updated_at: string
  casinos?: Casino
}

export interface News {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  category: string | null
  image_url: string | null
  author_id: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  title: string
  description: string | null
  casino_name: string | null
  casino_id: string | null
  user_email: string | null
  status: string
  report_type?: string | null
  priority?: string | null
  category?: string | null
  amount_disputed?: number | null
  contact_method?: string | null
  assigned_to?: string | null
  resolution_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  casinos?: Casino
}

export type Review = CasinoReview

export interface CasinoReview {
  id: string
  casino_id: string
  title: string
  content: string
  rating: number
  pros: string[]
  cons: string[]
  author_name: string | null
  author_id: string | null
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  // Player review specific fields
  reviewer_name?: string | null
  game_variety_rating?: number | null
  customer_service_rating?: number | null
  payout_speed_rating?: number | null
  helpful_count?: number | null
  not_helpful_count?: number | null
  is_approved?: boolean
  user_id?: string | null
}

export interface ReviewSection {
  id: string
  review_id: string
  section_title: string
  section_content: string
  section_rating: number | null
  display_order: number
  created_at: string
}

export interface CasinoScreenshot {
  id: string
  casino_id: string
  image_url: string
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface CasinoBanner {
  id: string
  casino_id: string
  image_url: string
  title: string
  subtitle: string | null
  is_primary: boolean
  display_order: number
  created_at: string
  updated_at: string
}
