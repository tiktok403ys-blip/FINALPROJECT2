import { createClient } from "@/lib/supabase/server"

export default async function sitemap() {
  const supabase = await createClient()

  const urls: { url: string; lastModified?: string }[] = [
    { url: "https://" + process.env.NEXT_PUBLIC_SITE_DOMAIN + "/" },
    { url: "https://" + process.env.NEXT_PUBLIC_SITE_DOMAIN + "/casinos" },
    { url: "https://" + process.env.NEXT_PUBLIC_SITE_DOMAIN + "/news" },
    { url: "https://" + process.env.NEXT_PUBLIC_SITE_DOMAIN + "/reviews" },
    { url: "https://" + process.env.NEXT_PUBLIC_SITE_DOMAIN + "/fair-gambling-codex" },
  ]

  const { data: news } = await supabase.from("news").select("id, updated_at").eq("published", true)
  news?.forEach((n) => urls.push({ url: `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}/news/${n.id}`, lastModified: n.updated_at }))

  const { data: casinos } = await supabase.from("casinos").select("id, updated_at")
  casinos?.forEach((c) => urls.push({ url: `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}/casinos/${c.id}`, lastModified: c.updated_at }))

  return urls
}


