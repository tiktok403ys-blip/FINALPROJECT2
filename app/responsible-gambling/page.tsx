import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import PageHero from "@/components/page-hero"
import { AlertTriangle, DollarSign, Clock, Heart, Shield, Phone, Globe } from "lucide-react"

export const metadata = {
  title: "Responsible Gambling | GuruSingapore",
  description: "Learn about responsible gambling practices and get help if you need it.",
}

export default function ResponsibleGamblingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <PageHero
        title="Play Responsibly"
        description="Gambling should be fun and entertaining. Learn how to gamble responsibly and get help when you need it"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Responsible Gambling" }]}
        author="GuruSingapore"
        date="January 2025"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Warning Section */}
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Important Warning</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Gambling can be addictive and should never be used as a way to make money or solve financial problems.
              Only gamble with money you can afford to lose, and never chase your losses.
            </p>
          </div>

          {/* Guidelines */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#00ff88] mb-8 text-center">Responsible Gambling Guidelines</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold">Set a Budget</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Decide how much money you can afford to lose before you start gambling. Never gamble with money needed
                  for essentials like rent, food, or bills.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold">Set Time Limits</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Set a time limit for your gambling sessions and stick to it. Take regular breaks and don't let
                  gambling interfere with your daily responsibilities.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold">Keep It Fun</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Gambling should be entertaining, not a way to make money. If you're not having fun or feeling
                  stressed, it's time to stop.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold">Know the Risks</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Understand that the house always has an edge. Gambling is designed to favor the casino, and losses are
                  more likely than wins over time.
                </p>
              </div>
            </div>
          </section>

          {/* Self-Assessment */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#00ff88] mb-8 text-center">Self-Assessment Questions</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
              <p className="text-gray-300 mb-6 text-center">
                Ask yourself these questions honestly to assess your gambling habits:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00ff88] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Do you gamble more money or time than you planned?</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00ff88] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Do you feel the need to bet more money to get the same excitement?</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00ff88] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Have you tried to cut back on gambling but couldn't?</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00ff88] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Do you gamble to escape problems or relieve anxiety?</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#00ff88] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">Have you lied to family or friends about your gambling?</p>
                </div>
              </div>
              <p className="text-yellow-400 mt-6 font-medium text-center">
                If you answered "yes" to any of these questions, consider seeking help.
              </p>
            </div>
          </section>

          {/* Help Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#00ff88] mb-8 text-center">Need Help?</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
              <p className="text-gray-300 leading-relaxed mb-6 text-center">
                If you or someone you know has a gambling problem, help is available. Contact these organizations for
                support:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-lg font-bold">Singapore Helpline</h3>
                  </div>
                  <p className="text-2xl font-bold text-[#00ff88] mb-2">1800-6-668-668</p>
                  <p className="text-sm text-gray-400">National Problem Gambling Helpline</p>
                  <p className="text-sm text-gray-400">24/7 Support Available</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-lg font-bold">Online Support</h3>
                  </div>
                  <p className="text-lg font-bold text-[#00ff88] mb-2">www.ncpg.org.sg</p>
                  <p className="text-sm text-gray-400">National Council on Problem Gambling</p>
                  <p className="text-sm text-gray-400">Resources & Self-Help Tools</p>
                </div>
              </div>
            </div>
          </section>

          {/* Tools Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#00ff88] mb-8 text-center">Self-Help Tools</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h3 className="font-bold mb-2">Session Timers</h3>
                  <p className="text-sm text-gray-400">Set time limits for gambling sessions</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h3 className="font-bold mb-2">Deposit Limits</h3>
                  <p className="text-sm text-gray-400">Control how much you can deposit</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h3 className="font-bold mb-2">Self-Exclusion</h3>
                  <p className="text-sm text-gray-400">Temporarily or permanently exclude yourself</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final Message */}
          <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-[#00ff88] mb-4">Remember</h3>
            <p className="text-gray-300 leading-relaxed">
              Gambling should never be seen as a solution to financial problems. If you're struggling with gambling,
              seeking help is a sign of strength, not weakness. Support is available, and recovery is possible.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
