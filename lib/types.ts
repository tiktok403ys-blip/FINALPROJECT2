export interface Casino {
  id: string
  name: string
  description: string | null
  rating: number | null
  location: string | null
  bonus_info: string | null
  logo_url: string | null
  website_url: string | null
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
  created_at: string
  updated_at: string
  casinos?: Casino
}

export interface LeaderboardEntry {
  id: string
  player_name: string
  points: number
  rank: number | null
  casino_id: string | null
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

export interface ForumPost {
  id: string
  title: string
  content: string | null
  category: string | null
  author_id: string
  created_at: string
  updated_at: string
  forum_comments?: ForumComment[]
}

export interface ForumComment {
  id: string
  content: string
  post_id: string
  author_id: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  title: string
  description: string | null
  casino_name: string | null
  user_email: string | null
  status: string
  created_at: string
  updated_at: string
}

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
