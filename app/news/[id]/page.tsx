import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Calendar, ArrowLeft } from "lucide-react"
import { GlassCard } from "@/components/glass-card"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("news").select("title, excerpt, image_url").eq("id", id).single()
  const title = data?.title ? `${data.title} - News` : "News"
  const description = data?.excerpt || "Latest casino industry news."
  const images = data?.image_url ? [data.image_url] : []
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
  const supabase = await createClient()
  const { data: article } = await supabase.from("news").select("*").eq("id", id).eq("published", true).single()

  if (!article) notFound()

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

        {article.image_url && (
          <div className="w-full h-64 sm:h-80 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-8">
            {/* Using img to avoid next/image domain config issues at this stage */}
            <img src={article.image_url || "/placeholder.svg"} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {article.excerpt && (
          <GlassCard className="p-6 mb-8">
            <p className="text-gray-300 leading-relaxed">{article.excerpt}</p>
          </GlassCard>
        )}

        <article className="prose prose-invert max-w-none">
          <p className="text-gray-200 leading-8 whitespace-pre-line">{article.content}</p>
        </article>
      </div>
    </div>
  )
}


