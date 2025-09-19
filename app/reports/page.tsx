"use client"

import { useState, useEffect } from "react"
import { PageHero } from '@/components/page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { ReportDialog } from "@/components/report-dialog"
import { Shield, AlertTriangle, FileText, Users, Flag, Clock, Calendar, ExternalLink, Hourglass, CheckCircle, XCircle, LayoutGrid, List } from "lucide-react"
import { useReportsRealtime } from "@/hooks/use-reports-realtime"

// Ensure stable identity for dynamically imported modal across re-renders
const ReportDetailsModal = dynamic(() => import("@/components/report-details-modal"), { ssr: false })

export default function ReportsPage() {
  const { reports, stats, loading, error } = useReportsRealtime(10)
  const [openId, setOpenId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid3'>('list')

  const formatTime = (num: number) => num.toString().padStart(2, "0")

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-blue-500 text-white"
      case "investigating":
      case "reviewing":
        return "bg-yellow-500 text-black"
      case "resolved":
        return "bg-green-500 text-white"
      case "closed":
      case "dismissed":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const renderStatusIcon = (status: string) => {
    const s = (status || "").toLowerCase()
    if (s === "resolved") return <CheckCircle className="w-12 h-12 mb-3" />
    if (s === "closed" || s === "dismissed") return <XCircle className="w-12 h-12 mb-3" />
    // pending / investigating / reviewing / default
    return <Hourglass className="w-12 h-12 mb-3" />
  }

  return (
    <div className="min-h-screen bg-black">
      <PageHero
        title="Casino Reports & Complaints for December 2025 - Player Protection"
        description="Report casino issues and complaints. Our expert team investigates every complaint and works to resolve disputes between players and casinos. Help us maintain a safe and fair gambling environment for everyone."
        breadcrumbs={[{ label: "Casino Reports" }]}
        author="GuruSingapore Protection Team"
        date="10 Dec 2025"
      >
      </PageHero>

      <div className="container mx-auto px-4 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          <GlassCard className="p-6 text-center">
            <Shield className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : stats.resolved.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Cases Resolved</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : stats.active}
            </div>
            <div className="text-gray-400 text-sm">Active Cases</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : stats.total.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Reports</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : `${stats.success_rate}%`}
            </div>
            <div className="text-gray-400 text-sm">Success Rate</div>
          </GlassCard>
        </div>

        {/* Submit Report Section - Moved to Top */}
        <div className="text-center mb-10 md:mb-16 py-6 md:py-12 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-2xl border border-white/10">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Have an Issue with a Casino?</h2>
          <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8 max-w-xl md:max-w-2xl mx-auto">
            Submit your complaint and our expert team will investigate and help resolve the issue.
          </p>

          <ReportDialog>
            <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 px-5 py-2.5 md:px-8 md:py-3 text-base md:text-lg font-semibold">
              <Flag className="w-5 h-5 mr-2" />
              Submit a Report
            </Button>
          </ReportDialog>
        </div>

        {/* Recent Reports Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Recent Reports</h2>
            <div className="hidden md:inline-flex rounded-lg border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-3 py-2 text-sm flex items-center gap-2 ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                aria-pressed={view === 'list'}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                type="button"
                onClick={() => setView('grid3')}
                className={`px-3 py-2 text-sm flex items-center gap-2 border-l border-white/10 ${view === 'grid3' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                aria-pressed={view === 'grid3'}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid 3
              </button>
            </div>
          </div>
          {/* Highlight Section Title above list */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-semibold">
              <span className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
              Live Complaints: {loading ? '...' : stats.active}
            </div>
          </div>
          <div className={`grid grid-cols-1 ${view === 'grid3' ? 'md:grid-cols-2 lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <GlassCard key={i} className="animate-pulse h-full">
                  <div className={`${view === 'grid3' ? 'flex flex-col h-full' : 'flex flex-col lg:flex-row'}`}>
                    <div className={`${view === 'grid3' ? 'shrink-0' : 'lg:w-1/4'} bg-gray-700 p-6`}></div>
                    <div className={`${view === 'grid3' ? 'flex-1' : 'lg:w-3/4'} p-6 bg-gray-800`}></div>
                  </div>
                </GlassCard>
              ))
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <GlassCard key={report.id} className="h-full">
                  <div className={`${view === 'grid3' ? 'flex flex-col h-full' : 'flex flex-col lg:flex-row'}`}>
                    {/* Left Side - Status */}
                    <div className={`${view === 'grid3' ? 'shrink-0' : 'lg:w-1/4'} bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white`}>
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        {renderStatusIcon(report.status)}
                        <div className="text-sm font-medium mb-2">Current status</div>
                        <div className="text-lg font-bold mb-4">{report.statusDisplay}</div>

                        {report.status !== "resolved" && report.timeElapsed && (
                          <div className="text-2xl font-mono">
                            {formatTime(report.timeElapsed.days)}d : {formatTime(report.timeElapsed.hours)}h :{" "}
                            {formatTime(report.timeElapsed.minutes)}m : {formatTime(report.timeElapsed.seconds)}s
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Report Details */}
                    <div className={`${view === 'grid3' ? 'flex-1' : 'lg:w-3/4'} p-6 bg-white/5 flex flex-col`}> 
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{report.title}</h3>
                          <div className="flex items-center gap-4 mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(report.status)}`}
                            >
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            <span className="text-gray-400 text-sm flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Submitted: {report.submittedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <div className="mb-6">
                        <h4 className="text-[#00ff88] font-semibold mb-3">Problem Description:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{report.description}</p>
                        
                        {/* ✅ Updated: Tambahkan informasi tambahan sesuai schema */}
                        {report.reason && (
                          <div className="mt-3">
                            <h5 className="text-[#00ff88] font-medium mb-1">Reason:</h5>
                            <p className="text-gray-300 text-sm line-clamp-2">{report.reason}</p>
                          </div>
                        )}
                        
                        {report.casino_name && (
                          <div className="mt-3">
                            <h5 className="text-[#00ff88] font-medium mb-1">Casino:</h5>
                            <p className="text-gray-300 text-sm line-clamp-1">{report.casino_name}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenId(report.id)}
                          className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10 bg-transparent"
                        >
                          View Details
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-12 text-center lg:col-span-1">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
                <p className="text-gray-400">There are currently no active reports to display.</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Lazy details modal */}
        {openId && (
          <ReportDetailsModal id={openId} onClose={() => setOpenId(null)} />
        )}

        {/* Information Sections */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Flag className="w-5 h-5 text-[#00ff88] mr-2" />
              How to Submit a Report
            </h3>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Provide detailed information about the issue</li>
              <li>• Include casino name and relevant dates</li>
              <li>• Specify the amount involved (if applicable)</li>
              <li>• Choose appropriate category and priority</li>
              <li>• Provide valid contact information</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 text-[#00ff88] mr-2" />
              Our Response Process
            </h3>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Initial review within 24 hours</li>
              <li>• Investigation begins within 48 hours</li>
              <li>• Regular updates on case progress</li>
              <li>• Direct communication with casino if needed</li>
              <li>• Resolution or escalation within 7 days</li>
            </ul>
          </GlassCard>
        </div>

        {/* Information Section */}
        <div className="mt-16">
          <GlassCard className="p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">How We Help</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[#00ff88] font-semibold mb-3 text-lg">What We Do:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Investigate all reported issues thoroughly</li>
                  <li>• Contact casinos on your behalf</li>
                  <li>• Mediate disputes between players and operators</li>
                  <li>• Provide expert advice and guidance</li>
                  <li>• Track resolution progress</li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#00ff88] font-semibold mb-3 text-lg">Types of Issues We Handle:</h4>
                <ul className="text-gray-400 space-y-2">
                  <li>• Withdrawal delays or refusals</li>
                  <li>• Bonus terms disputes</li>
                  <li>• Account closure issues</li>
                  <li>• Unfair game practices</li>
                  <li>• Customer service problems</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
              <p className="text-gray-300 text-center">
                <strong className="text-[#00ff88]">Important:</strong> We provide free mediation services to help
                resolve disputes fairly. Our goal is to protect players and maintain industry standards.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Footer is now rendered from RootLayout */}
    </div>
  )
}
