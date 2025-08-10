import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import PageHero from "@/components/page-hero"
import { Shield, Eye, Lock, UserCheck, Mail, Database } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | GuruSingapore",
  description: "Learn how GuruSingapore collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <PageHero
        title="Privacy Policy"
        description="Your privacy is important to us. Learn how we collect, use, and protect your information"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
        author="GuruSingapore"
        date="January 2025"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-lg max-w-none">
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">1. Information We Collect</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, subscribe to our
                newsletter, or contact us for support.
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-4">
                <h3 className="text-lg font-bold mb-3">Personal Information may include:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Name and email address</li>
                  <li>Account credentials</li>
                  <li>Communication preferences</li>
                  <li>Any other information you choose to provide</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">2. How We Use Your Information</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the information we collect to provide, maintain, and improve our services. Specifically, we use
                your information to:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Provide and deliver our services</li>
                    <li>Send you technical notices and updates</li>
                    <li>Respond to your comments and questions</li>
                  </ul>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Monitor and analyze usage patterns</li>
                    <li>Personalize your experience</li>
                    <li>Protect against fraud and abuse</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">3. Information Sharing</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your
                consent, except as described in this policy.
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3">We may share your information with:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                  <li>Business partners with your explicit consent</li>
                  <li>In connection with a merger or acquisition</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">4. Data Security</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3">Our security measures include:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>SSL encryption for data transmission</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure data storage practices</li>
                </ul>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <UserCheck className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">5. Your Rights</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have certain rights regarding your personal information, including:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-[#00ff88]">Access & Portability</h3>
                  <p className="text-sm text-gray-300">Request a copy of your personal data</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-[#00ff88]">Correction</h3>
                  <p className="text-sm text-gray-300">Update or correct your information</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-[#00ff88]">Deletion</h3>
                  <p className="text-sm text-gray-300">Request deletion of your data</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-[#00ff88]">Opt-out</h3>
                  <p className="text-sm text-gray-300">Unsubscribe from communications</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">6. Contact Us</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
                <p className="text-gray-300">
                  <strong>Email:</strong> privacy@gurusingapore.com
                  <br />
                  <strong>Address:</strong> Singapore
                  <br />
                  <strong>Response Time:</strong> We will respond within 30 days
                </p>
              </div>
            </section>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mt-12">
              <p className="text-sm text-gray-400">
                <strong>Last updated:</strong> January 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
