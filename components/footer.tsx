import Image from "next/image"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react"

function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image
                src="/logo-gurusingapore.png"
                alt="GuruSingapore Logo"
                width={200}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted guide to the best online casinos in Singapore. We provide expert reviews, exclusive bonuses,
              and comprehensive guides to help you make informed decisions.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-[#00ff88] transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#8b5cf6] transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#06b6d4] transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#00ff88] transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#00ff88]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/casinos" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Casinos
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/bonuses" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Bonuses
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Reports
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-400 hover:text-white transition-colors text-sm">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#00ff88]">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/responsible-gambling" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Play Responsibly
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/fair-gambling-codex" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Fair gambling codex
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#00ff88]">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#00ff88]" />
                <span className="text-gray-400 text-sm">support@gurusingapore.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#00ff88]" />
                <span className="text-gray-400 text-sm">+65 8576 9155</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[#00ff88]" />
                <span className="text-gray-400 text-sm">Singapore</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">© 2020 GuruSingapore. All rights reserved.</div>
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span>18+ Only</span>
              <span>•</span>
              <span>Gamble Responsibly</span>
              <span>•</span>
              <span>Licensed & Regulated</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
export { Footer }
