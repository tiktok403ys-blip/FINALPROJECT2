import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import PageHero from "@/components/page-hero"
import { FileText, Shield, AlertCircle, Scale } from "lucide-react"

export const metadata = {
  title: "Terms & Conditions | GuruSingapore",
  description: "Read our terms and conditions for using GuruSingapore casino guide services.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <PageHero
        title="Terms & Conditions"
        description="Please read these terms and conditions carefully before using our services"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
        author="GuruSingapore"
        date="January 2025"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-lg max-w-none">
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">1. Acceptance of Terms</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                By accessing and using GuruSingapore (&quot;the Website&quot;), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                These terms apply to all visitors, users, and others who access or use the service.
              </p>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">2. Use License</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials on GuruSingapore for personal,
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and
                under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                This license shall automatically terminate if you violate any of these restrictions and may be
                terminated by us at any time.
              </p>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">3. Disclaimer</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                The materials on GuruSingapore are provided on an &apos;as is&apos; basis. GuruSingapore makes no warranties,
                expressed or implied, and hereby disclaims and negates all other warranties including without
                limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of rights.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Further, GuruSingapore does not warrant or make any representations concerning the accuracy, likely
                results, or reliability of the use of the materials on its website or otherwise relating to such
                materials or on any sites linked to this site.
              </p>
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-2xl font-bold text-[#00ff88]">4. Limitations</h2>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                In no event shall GuruSingapore or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the use
                or inability to use the materials on GuruSingapore, even if GuruSingapore or a GuruSingapore authorized
                representative has been notified orally or in writing of the possibility of such damage.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability
                for consequential or incidental damages, these limitations may not apply to you.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-6">5. Accuracy of Materials</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The materials appearing on GuruSingapore could include technical, typographical, or photographic errors.
                GuruSingapore does not warrant that any of the materials on its website are accurate, complete, or
                current.
              </p>
              <p className="text-gray-300 leading-relaxed">
                GuruSingapore may make changes to the materials contained on its website at any time without notice.
                However, GuruSingapore does not make any commitment to update the materials.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-6">6. Links</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                GuruSingapore has not reviewed all of the sites linked to our website and is not responsible for the
                contents of any such linked site. The inclusion of any link does not imply endorsement by GuruSingapore
                of the site.
              </p>
              <p className="text-gray-300 leading-relaxed">Use of any such linked website is at the user&apos;s own risk.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-6">7. Modifications</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                GuruSingapore may revise these terms of service for its website at any time without notice. By using
                this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-6">8. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of Singapore and
                you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>
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
