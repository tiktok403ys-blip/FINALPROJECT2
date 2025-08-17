"use client"

import { useState, useEffect } from "react"
import { DynamicPageHero } from '@/components/dynamic-page-hero'
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { ReportDialog } from "@/components/report-dialog"
import { Shield, AlertTriangle, FileText, Users, Flag, Clock, Calendar, ExternalLink, Hourglass } from "lucide-react"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Casino Reports & Complaints | GuruSingapore",
  description: "Report casino issues and complaints. Our expert team investigates every complaint and works to resolve disputes between players and casinos.",
}

export default function ReportsPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 10,
    hours: 22,
    minutes: 57,
    seconds: 50,
  })

  // Simulate countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (num: number) => num.toString().padStart(2, "0")

  const sampleReports = [
    {
      id: 1,
      title: "Betovo Casino - Player's withdrawal has been delayed.",
      status: "opened",
      submittedDate: "11 Aug 2025",
      currentStatus: "Waiting for a delayed payment",
      timeElapsed: timeLeft,
      description:
        "Player submitted a withdrawal request for $2,500 on August 1st, 2025. Despite multiple follow-ups and providing all required verification documents, the casino has not processed the withdrawal. The player has been waiting for over 10 days without any clear timeline from the casino's support team. All account verification was completed successfully, and the player has met all wagering requirements for the bonus used.",
    },
    {
      id: 2,
      title: "Royal Casino - Bonus terms were not clearly explained.",
      status: "investigating",
      submittedDate: "09 Aug 2025",
      currentStatus: "Under investigation",
      timeElapsed: { days: 12, hours: 5, minutes: 30, seconds: 15 },
      description:
        "Player claims that the casino's welcome bonus terms were misleading and not clearly disclosed during registration. The player deposited $500 expecting a 100% match bonus but discovered hidden wagering requirements of 50x that were not prominently displayed. Additionally, certain games were excluded from bonus play without clear notification, causing confusion and potential losses.",
    },
    {
      id: 3,
      title: "Diamond Palace - Account was closed without explanation.",
      status: "resolved",
      submittedDate: "05 Aug 2025",
      currentStatus: "Successfully resolved",
      timeElapsed: { days: 16, hours: 0, minutes: 0, seconds: 0 },
      description:
        "Player's account was suddenly closed after winning $8,000 from a progressive jackpot. The casino cited 'irregular play patterns' but provided no specific details. After our investigation, we found that the player's gameplay was completely legitimate. The casino has since reopened the account, processed the full withdrawal, and provided a formal apology along with a goodwill bonus.",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "opened":
        return "bg-blue-500 text-white"
      case "investigating":
        return "bg-yellow-500 text-black"
      case "resolved":
        return "bg-green-500 text-white"
      case "closed":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <DynamicPageHero
        pageName="reports"
        sectionType="hero"
        fallbackTitle="Casino Reports & Complaints for December 2024 - Player Protection"
        fallbackDescription="Report casino issues and complaints. Our expert team investigates every complaint and works to resolve disputes between players and casinos. Help us maintain a safe and fair gambling environment for everyone."
        breadcrumbs={[{ label: "Casino Reports" }]}
        author={{ name: "GuruSingapore Protection Team" }}
        date="10 Dec 2024"
      />

      <div className="container mx-auto px-4 py-16">
        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <GlassCard className="p-6 text-center">
            <Shield className="w-8 h-8 text-[#00ff88] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">1,247</div>
            <div className="text-gray-400 text-sm">Cases Resolved</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">89</div>
            <div className="text-gray-400 text-sm">Active Cases</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">3,456</div>
            <div className="text-gray-400 text-sm">Total Reports</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">92%</div>
            <div className="text-gray-400 text-sm">Success Rate</div>
          </GlassCard>
        </div>

        {/* Submit Report Section - Moved to Top */}
        <div className="text-center mb-16 py-12 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-2xl border border-white/10">
          <h2 className="text-4xl font-bold text-white mb-4">Have an Issue with a Casino?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Submit your complaint and our expert team will investigate and help resolve the issue.
          </p>

          <ReportDialog>
            <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/80 px-8 py-3 text-lg font-semibold" size="lg">
              <Flag className="w-5 h-5 mr-2" />
              Submit a Report
            </Button>
          </ReportDialog>
        </div>

        {/* Recent Reports Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Recent Reports</h2>
          <div className="space-y-6">
            {sampleReports.map((report) => (
              <GlassCard key={report.id} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Side - Status */}
                  <div className="lg:w-1/4 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                    <div className="text-center">
                      <Hourglass className="w-12 h-12 mx-auto mb-3" />
                      <div className="text-sm font-medium mb-2">Current status</div>
                      <div className="text-lg font-bold mb-4">{report.currentStatus}</div>

                      {report.status !== "resolved" && (
                        <div className="text-2xl font-mono">
                          {formatTime(report.timeElapsed.days)}d : {formatTime(report.timeElapsed.hours)}h :{" "}
                          {formatTime(report.timeElapsed.minutes)}m : {formatTime(report.timeElapsed.seconds)}s
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Report Details */}
                  <div className="lg:w-3/4 p-6 bg-white/5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{report.title}</h3>
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
                      <p className="text-gray-300 text-sm leading-relaxed">{report.description}</p>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10 bg-transparent"
                      >
                        View Details
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

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

      <Footer />
    </div>
  )
}
