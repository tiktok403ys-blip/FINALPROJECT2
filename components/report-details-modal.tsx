"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { useSingleReportRealtime } from "@/hooks/use-reports-realtime"

export default function ReportDetailsModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { report, loading, error, refresh } = useSingleReportRealtime(id)

  useEffect(() => {
    // refresh on mount to ensure fresh data
    refresh()
  }, [refresh])

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="bg-black border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
          <DialogDescription>Public information for the selected report.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-4 text-white/60">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-400">{error}</div>
        ) : !report ? (
          <div className="p-4 text-white/60">No data.</div>
        ) : (
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{report.title}</h3>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {report.statusDisplay || report.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {report.submittedDate}</span>
            </div>

            {report.casino_name && (
              <div>
                <div className="text-[#00ff88] font-medium">Casino</div>
                <div className="text-white/80">{report.casino_name}</div>
              </div>
            )}

            {report.category && (
              <div>
                <div className="text-[#00ff88] font-medium">Category</div>
                <div className="text-white/80">{report.category}</div>
              </div>
            )}

            {report.priority && (
              <div>
                <div className="text-[#00ff88] font-medium">Priority</div>
                <div className="text-white/80">{report.priority}</div>
              </div>
            )}

            <div>
              <div className="text-[#00ff88] font-medium">Problem Description</div>
              <div className="text-white/80 whitespace-pre-wrap">{report.description}</div>
            </div>

            {report.reason && (
              <div>
                <div className="text-[#00ff88] font-medium">Reason</div>
                <div className="text-white/80 whitespace-pre-wrap">{report.reason}</div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


