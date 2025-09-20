import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Calendar, ArrowLeft, Facebook, Send, MessageCircle } from "lucide-react"
import { GlassCard } from "@/components/glass-card"
import { headers } from "next/headers"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const articleId = id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0] || id
  const supabase = await createClient()
  const { data } = await supabase
    .from("news_articles")
    .select("title, excerpt, featured_image")
    .eq("id", articleId)
    .eq("status", "published")
    .single()
  const title = data?.title ? `${data.title} - News` : "News"
  const description = data?.excerpt || "Latest casino industry news."
  const toPublicUrl = (val?: string | null) => {
    if (!val) return null
    if (val.startsWith("http")) return val
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    return base ? `${base}/storage/v1/object/public/${val}` : null
  }
  const resolvedImage = toPublicUrl(data?.featured_image)
  const images = resolvedImage ? [resolvedImage] : []
  const host = process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000"
  const canonical = `https://${host}/news/${id}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params
  const articleId = id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)?.[0] || id
  const supabase = await createClient()
  const { data: article } = await supabase
    .from("news_articles")
    .select("*")
    .eq("id", articleId)
    .eq("status", "published")
    .single()

  if (!article) notFound()

  // Build canonical URL for sharing (keep slug if present in param)
  const h = await headers()
  const host = process.env.NEXT_PUBLIC_SITE_DOMAIN || h.get("host") || "localhost:3000"
  const canonicalUrl = `https://${host}/news/${id}`
  const encodedUrl = encodeURIComponent(canonicalUrl)
  const encodedTitle = encodeURIComponent(article.title)
  const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: article.title,
              datePublished: article.created_at,
              dateModified: article.updated_at,
              image: article.image_url ? [article.image_url] : undefined,
              // Note: metadata above resolves to absolute URL for social previews
              description: article.excerpt || undefined,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000"}/news/${article.id}`,
              },
              author: { "@type": "Organization", name: "GuruSingapore" },
              publisher: { "@type": "Organization", name: "GuruSingapore" },
            }),
          }}
        />
        <Link href="/news" className="inline-flex items-center gap-2 text-[#00ff88] hover:text-[#00cc6a] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{article.title}</h1>
        <div className="flex items-center text-sm text-gray-400 mb-6">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
          {article.category && <span className="mx-2">•</span>}
          {article.category && <span className="text-[#00ff88]">{article.category}</span>}
        </div>

        {article.featured_image && (
          <div className="w-full h-64 sm:h-80 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-8">
            <Image 
              src={article.featured_image || "/placeholder.svg"} 
              alt={article.title} 
              width={768}
              height={320}
              className="w-full h-full object-contain bg-black/20" 
            />
          </div>
        )}

        {article.excerpt && (
          <GlassCard className="p-6 mb-8">
            <p className="text-gray-300 leading-relaxed">{article.excerpt}</p>
          </GlassCard>
        )}

        {/* Share Buttons */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Share:</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
            >
              <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Telegram"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
            >
              <Send className="w-4 h-4 text-sky-400" /> Telegram
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm"
            >
              <Facebook className="w-4 h-4 text-blue-500" /> Facebook
            </a>
          </div>
        </div>

        <article className="prose prose-invert max-w-none">
          <p className="text-gray-200 leading-8 whitespace-pre-line">{article.content}</p>
        </article>
      </div>
    </div>
  )
}


