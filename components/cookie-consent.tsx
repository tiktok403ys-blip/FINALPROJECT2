"use client"

import { useState, useEffect } from "react"
import { X, Settings, Cookie, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
    setShowSettings(false)
  }

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }
    setPreferences(onlyNecessary)
    localStorage.setItem("cookie-consent", JSON.stringify(onlyNecessary))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
    setShowSettings(false)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === "necessary") return // Necessary cookies cannot be disabled
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto lg:max-w-lg lg:left-auto lg:right-4 lg:mx-0">
        <Card className="bg-black/90 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">We use cookies</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We use cookies to enhance your browsing experience, provide personalized content, and analyze our
                  traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={acceptAll}
                className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept All
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 flex-1 bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
              <Button
                onClick={rejectAll}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-1"
              >
                Reject All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">Cookie Preferences</h2>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Necessary Cookies</h3>
                      <p className="text-gray-400 text-sm">
                        Essential for the website to function properly. Cannot be disabled.
                      </p>
                    </div>
                    <div className="w-12 h-6 bg-[#00ff88] rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Functional Cookies</h3>
                      <p className="text-gray-400 text-sm">
                        Enable enhanced functionality like user preferences and personalization.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference("functional")}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.functional ? "bg-[#00ff88] justify-end" : "bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Analytics Cookies</h3>
                      <p className="text-gray-400 text-sm">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference("analytics")}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.analytics ? "bg-[#00ff88] justify-end" : "bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Marketing Cookies</h3>
                      <p className="text-gray-400 text-sm">
                        Used to deliver personalized advertisements and track campaign performance.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePreference("marketing")}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        preferences.marketing ? "bg-[#00ff88] justify-end" : "bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  onClick={acceptSelected}
                  className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black hover:from-[#00cc6a] hover:to-[#00ff88] font-semibold flex-1"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={acceptAll}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 flex-1 bg-transparent"
                >
                  Accept All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
