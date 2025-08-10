"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/glass-card"
import { createClient } from "@/lib/supabase/client"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

interface FooterContent {
  id: string
  section: string
  title: string
  content: string | null
  link_url: string | null
  link_text: string | null
  display_order: number
}

export function Footer() {
  const [footerContent, setFooterContent] = useState<FooterContent[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchFooterContent()
  }, [])

  const fetchFooterContent = async () => {
    const { data } = await supabase
      .from("footer_content")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (data) {
      setFooterContent(data)
    }
  }

  const getContentBySection = (section: string) => {
    return footerContent.filter((item) => item.section === section)
  }

  const aboutContent = getContentBySection("about")[0]
  const quickLinks = getContentBySection("quick_links")
  const supportLinks = getContentBySection("support")
  const legalLinks = getContentBySection("legal")
  const contactInfo = getContentBySection("contact")

  return (
    <footer className="bg-black border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <Link href="/" className="text-2xl font-bold text-[#00ff88] mb-4 block">
              GuruSingapore
            </Link>
            {aboutContent && (
              <>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">{aboutContent.content}</p>
                {aboutContent.link_url && (
                  <Link
                    href={aboutContent.link_url}
                    className="text-[#00ff88] hover:text-[#00ff88]/80 text-sm font-medium"
                  >
                    {aboutContent.link_text} →
                  </Link>
                )}
              </>
            )}

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 transition-colors"
                >
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 transition-colors"
                >
                  <Twitter className="w-4 h-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-white" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 transition-colors"
                >
                  <Youtube className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.link_url || "#"}
                    className="text-gray-400 hover:text-[#00ff88] text-sm transition-colors"
                  >
                    {link.link_text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.link_url || "#"}
                    className="text-gray-400 hover:text-[#00ff88] text-sm transition-colors"
                  >
                    {link.link_text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              {contactInfo.map((contact) => (
                <div key={contact.id} className="flex items-start space-x-2">
                  {contact.title === "Email" && <Mail className="w-4 h-4 text-[#00ff88] mt-0.5" />}
                  {contact.title === "Phone" && <Phone className="w-4 h-4 text-[#00ff88] mt-0.5" />}
                  {contact.title === "Address" && <MapPin className="w-4 h-4 text-[#00ff88] mt-0.5" />}
                  <div>
                    {contact.link_url ? (
                      <a
                        href={contact.link_url}
                        className="text-gray-400 hover:text-[#00ff88] text-sm transition-colors"
                      >
                        {contact.content}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">{contact.content}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              {legalLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.link_url || "#"}
                  className="text-gray-400 hover:text-[#00ff88] text-sm transition-colors"
                >
                  {link.link_text}
                </Link>
              ))}
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} GuruSingapore. All rights reserved.
            </div>
          </div>
        </div>

        {/* Responsible Gaming Notice */}
        <div className="mt-8 text-center">
          <GlassCard className="p-4">
            <p className="text-gray-400 text-sm">
              <strong className="text-[#00ff88]">18+ Only.</strong> Gambling can be addictive. Please play responsibly.
              If you need help, visit{" "}
              <a href="https://www.ncpg.org.sg" className="text-[#00ff88] hover:underline">
                NCPG.org.sg
              </a>
            </p>
          </GlassCard>
        </div>
      </div>
    </footer>
  )
}
