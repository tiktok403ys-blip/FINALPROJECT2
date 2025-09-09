import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from '@/components/glass-card'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Flag, ShieldAlert } from 'lucide-react'

type ListItem = {
  id: string
  casino: string
  status: 'scam' | 'suspicious'
}

export default function ReportsListPage() {
  // Placeholder data – will be replaced by CRUD-backed data later
  const items: ListItem[] = [
    { id: '1', casino: 'Example Casino A', status: 'scam' },
    { id: '2', casino: 'Example Casino B', status: 'suspicious' },
  ]

  const statusStyles = (s: ListItem['status']) =>
    s === 'scam'
      ? 'bg-red-500 text-white border-red-400/40'
      : 'bg-yellow-500 text-black border-yellow-400/40'

  const statusIcon = (s: ListItem['status']) =>
    s === 'scam' ? <ShieldAlert className="w-4 h-4 mr-1.5" /> : <Flag className="w-4 h-4 mr-1.5" />

  const statusLabel = (s: ListItem['status']) => (s.charAt(0).toUpperCase() + s.slice(1))

  return (
    <div className="min-h-screen bg-black">
      <DynamicPageHero
        pageName="reports"
        sectionType="hero"
        fallbackTitle="Public Reports List"
        fallbackDescription="Simple list of casinos with public risk statuses."
        breadcrumbs={[{ label: 'Reports' }, { label: 'List Report' }]}
        author={{ name: 'GuruSingapore Protection Team' }}
        date={new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="space-y-4">
          {items.map((item) => (
            <GlassCard key={item.id} className="p-6 flex items-center justify-between">
              <div className="text-white font-semibold text-base md:text-lg">{item.casino}</div>
              <Badge className={`${statusStyles(item.status)} flex items-center`}> 
                {statusIcon(item.status)}
                {statusLabel(item.status)}
              </Badge>
            </GlassCard>
          ))}

          {items.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-gray-400">No data yet. This list will be populated via admin CRUD.</p>
            </GlassCard>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}


