import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import PageHero from "@/components/page-hero"
import { Shield, Eye, Settings, Cookie, Info, Globe } from "lucide-react"

export const metadata = {
  title: "Cookie Policy | GuruSingapore",
  description: "Learn about how GuruSingapore uses cookies and similar technologies.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <PageHero
        title="Cookie Policy"
        description="Learn about how we use cookies and similar technologies to improve your experience"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cookie Policy" }]}
        author="GuruSingapore"
        date="January 2025"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">What Are Cookies?</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <p className="text-gray-300 leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-gray-300 leading-relaxed">
                GuruSingapore uses cookies to enhance your browsing experience, analyze site traffic, and personalize
                content to better serve our users.
              </p>
            </div>
          </section>

          {/* Types of Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-8">Types of Cookies We Use</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold">Essential Cookies</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  These cookies are necessary for the website to function properly. They enable basic functions like
                  page navigation and access to secure areas of the website.
                </p>
                <div className="text-sm text-gray-400">
                  <strong>Examples:</strong> Session management, security tokens, load balancing
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold">Analytics Cookies</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  These cookies help us understand how visitors interact with our website by collecting and reporting
                  information anonymously.
                </p>
                <div className="text-sm text-gray-400">
                  <strong>Examples:</strong> Google Analytics, page views, user behavior tracking
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold">Functional Cookies</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  These cookies enable enhanced functionality and personalization, such as remembering your preferences
                  and settings.
                </p>
                <div className="text-sm text-gray-400">
                  <strong>Examples:</strong> Language preferences, theme settings, user preferences
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold">Marketing Cookies</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  These cookies track visitors across websites to display relevant and engaging advertisements for
                  individual users and publishers.
                </p>
                <div className="text-sm text-gray-400">
                  <strong>Examples:</strong> Advertising networks, social media plugins, remarketing
                </div>
              </div>
            </div>
          </section>

          {/* Third Party Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Third-Party Cookies</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-[#00ff88]" />
                <h3 className="text-lg font-bold">External Services</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may use third-party services that also set cookies on your device. These include:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  <strong>Google Analytics:</strong> For website analytics and user behavior tracking
                </li>
                <li>
                  <strong>Social Media Platforms:</strong> For social sharing and login functionality
                </li>
                <li>
                  <strong>Advertising Networks:</strong> For targeted advertising and remarketing
                </li>
                <li>
                  <strong>Payment Processors:</strong> For secure payment processing and fraud prevention
                </li>
                <li>
                  <strong>Content Delivery Networks:</strong> For faster content delivery and performance
                </li>
              </ul>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Managing Your Cookie Preferences</h2>
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="w-6 h-6 text-[#00ff88]" />
                  <h3 className="text-lg font-bold">Browser Settings</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  Most web browsers allow you to control cookies through their settings preferences. You can:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Block all cookies from being set</li>
                  <li>Allow only first-party cookies</li>
                  <li>Delete existing cookies from your device</li>
                  <li>Set cookies to expire when you close your browser</li>
                  <li>Receive notifications when cookies are being set</li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Info className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-bold">Opt-Out Options</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-3">
                  You can opt out of certain third-party cookies through these methods:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Google Analytics: Use the Google Analytics Opt-out Browser Add-on</li>
                  <li>Advertising cookies: Visit the Digital Advertising Alliance opt-out page</li>
                  <li>Social media cookies: Adjust your privacy settings on each platform</li>
                  <li>Marketing emails: Use unsubscribe links in our communications</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookie Consent */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Cookie Consent</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <p className="text-gray-300 leading-relaxed mb-4">
                When you first visit our website, you'll see a cookie banner asking for your consent to use
                non-essential cookies. You have the following options:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>Accept all cookies for the full website experience</li>
                <li>Reject non-essential cookies (only essential cookies will be used)</li>
                <li>Customize your preferences by cookie category</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                You can change your cookie preferences at any time by clicking the "Cookie Settings" link in our footer
                or by clearing your browser cookies and revisiting our site.
              </p>
            </div>
          </section>

          {/* Impact of Disabling */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Impact of Disabling Cookies</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-yellow-400">Important Notice</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Please note that disabling cookies may affect the functionality of our website:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Some features may not work properly or at all</li>
                <li>Your preferences and settings may not be saved</li>
                <li>You may need to re-enter information repeatedly</li>
                <li>Personalized content and recommendations may not be available</li>
                <li>Website performance may be slower</li>
              </ul>
            </div>
          </section>

          {/* Updates */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Updates to This Policy</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <p className="text-gray-300 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices, technology,
                legal requirements, or for other operational reasons. We encourage you to check this page periodically
                for any updates. The "Last updated" date at the bottom of this policy indicates when it was last
                revised.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#00ff88] mb-6">Contact Us</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please don't hesitate to
                contact us:
              </p>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <strong>Email:</strong> cookies@gurusingapore.com
                </p>
                <p className="text-gray-300">
                  <strong>Subject:</strong> Cookie Policy Inquiry
                </p>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mt-12 border border-white/10">
            <p className="text-sm text-gray-400 text-center">
              <strong>Last updated:</strong> January 15, 2025
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
