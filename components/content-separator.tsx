import { Check } from 'lucide-react'

interface ContentSeparatorProps {
  title: string
  description: string
  variant?: 'default' | 'compact'
}

export function ContentSeparator({ 
  title, 
  description, 
  variant = 'default' 
}: ContentSeparatorProps) {
  return (
    <div className="w-full flex justify-center py-3 sm:py-4 md:py-6 lg:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/20">
          <div className={`flex items-center gap-4 sm:gap-6 ${
            variant === 'compact' 
              ? 'p-3 sm:p-4 md:p-5' 
              : 'p-4 sm:p-5 md:p-6 lg:p-8'
          }`}>
            {/* Check Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-[#00ff88]/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/20">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black font-bold" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-white/95 leading-tight ${
                variant === 'compact'
                  ? 'text-sm sm:text-base lg:text-lg'
                  : 'text-base sm:text-lg lg:text-xl xl:text-2xl'
              }`}>
                {title}
              </h3>
              <p className={`text-gray-300/90 mt-1 sm:mt-2 leading-relaxed ${
                variant === 'compact'
                  ? 'text-xs sm:text-sm'
                  : 'text-sm sm:text-base lg:text-lg'
              }`}>
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Predefined separator variants for common use cases
export const DataPointsSeparator = () => (
  <ContentSeparator
    title="200+ data points in each review"
    description="In each review, we collect and evaluate more than 200 pieces of information about a casino."
  />
)

export const ExpertAnalysisSeparator = () => (
  <ContentSeparator
    title="Expert analysis & real player feedback"
    description="Our team of casino experts combined with authentic player reviews ensures comprehensive coverage."
    variant="compact"
  />
)

export const TrustedPlatformSeparator = () => (
  <ContentSeparator
    title="Trusted by 50,000+ players worldwide"
    description="Join thousands of players who rely on our platform for honest casino reviews and recommendations."
    variant="compact"
  />
)