"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface BonusItem {
  id: string
  title: string
  description: string | null
  claim_url: string | null
  home_link_override: string | null
  is_featured_home: boolean | null
  home_rank: number | null
}

export default function ExclusiveBonusesAdmin() {
  const supabase = createClient()
  const [rows, setRows] = useState<BonusItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("bonuses")
      .select("id,title,description,claim_url,home_link_override,is_featured_home,home_rank")
      .order("home_rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
    setRows((data as any) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const featured = useMemo(() => rows.filter(r => r.is_featured_home).sort((a,b)=>(a.home_rank??999)-(b.home_rank??999)), [rows])
  const others = useMemo(() => rows.filter(r => !r.is_featured_home), [rows])

  const toggle = async (row: BonusItem) => {
    const { error } = await supabase
      .from("bonuses")
      .update({ is_featured_home: !row.is_featured_home, home_rank: !row.is_featured_home ? ((featured.length||0)+1) : null })
      .eq("id", row.id)
    if (error) { toast.error(error.message); return }
    toast.success("Updated")
    load()
  }

  const setRank = async (row: BonusItem, rank: number) => {
    const { error } = await supabase
      .from("bonuses")
      .update({ home_rank: rank })
      .eq("id", row.id)
    if (error) { toast.error(error.message); return }
    toast.success("Rank updated")
    load()
  }

  const setLink = async (row: BonusItem, link: string) => {
    const { error } = await supabase
      .from("bonuses")
      .update({ home_link_override: link || null })
      .eq("id", row.id)
    if (error) { toast.error(error.message); return }
    toast.success("Link updated")
    load()
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Exclusive Bonuses (Home)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            <>
              <h3 className="text-white font-semibold">Featured on Home</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {featured.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                    <div className="text-white font-semibold truncate" title={item.title}>{item.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-sm">Order</span>
                      <Input type="number" className="w-24" value={item.home_rank ?? 1} onChange={(e)=>setRank(item, Number(e.target.value))} />
                      <Button variant="outline" className="ml-auto border-[#00ff88] text-[#00ff88] bg-transparent" onClick={()=>toggle(item)}>Unfeature</Button>
                    </div>
                    <div>
                      <span className="text-white/80 text-sm">Link override</span>
                      <Input placeholder="https://..." value={item.home_link_override || ""} onChange={(e)=>setLink(item, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-white font-semibold mt-4">Other Bonuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {others.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                    <div className="text-white font-semibold truncate" title={item.title}>{item.title}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="border-[#00ff88] text-[#00ff88] bg-transparent" onClick={()=>toggle(item)}>Feature</Button>
                    </div>
                    <div>
                      <span className="text-white/80 text-sm">Link override</span>
                      <Input placeholder="https://..." value={item.home_link_override || ""} onChange={(e)=>setLink(item, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


