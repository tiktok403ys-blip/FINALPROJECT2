// Mobile-First Design System Configuration
// Ensures consistency across all components

export const MOBILE_FIRST_CONFIG = {
  // Breakpoint System (Mobile-First)
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },

  // Touch Target Standards
  touchTargets: {
    minimum: 44, // iOS/Android minimum
    comfortable: 48,
    spacious: 56,
  },

  // Glass Effect Standards
  glass: {
    backdropBlur: 'blur(20px)',
    webkitBackdropBlur: 'blur(20px)',
    saturate: 'saturate(180%)',
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: {
      primary: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      border: '0 0 0 1px rgba(255, 255, 255, 0.1)',
    },
  },

  // Safe Area Handling
  safeArea: {
    top: 'max(1rem, env(safe-area-inset-top))',
    bottom: 'max(1rem, env(safe-area-inset-bottom))',
    left: 'max(0.75rem, env(safe-area-inset-left))',
    right: 'max(0.75rem, env(safe-area-inset-right))',
  },

  // Fluid Typography
  typography: {
    body: {
      fontSize: 'clamp(0.875rem, 4vw, 1rem)',
      lineHeight: 1.5,
    },
    heading: {
      fontSize: 'clamp(1.25rem, 6vw, 1.75rem)',
      lineHeight: 1.3,
    },
  },

  // Spacing System (Mobile-First)
  spacing: {
    container: {
      mobile: '1rem',
      tablet: '1.5rem',
      desktop: '2rem',
    },
    component: {
      small: '0.5rem',
      medium: '1rem',
      large: '1.5rem',
      xl: '2rem',
    },
  },

  // Animation Standards
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: 'ease-out',
    prefersReducedMotion: {
      query: '(prefers-reduced-motion: reduce)',
      duration: '0.01ms',
    },
  },

  // Color System for Glass Effects
  colors: {
    glass: {
      primary: {
        background: 'rgba(0, 0, 0, 0.5)',
        border: 'rgba(255, 255, 255, 0.2)',
        text: 'rgba(255, 255, 255, 0.9)',
        hover: 'rgba(255, 255, 255, 0.1)',
      },
      success: {
        background: 'rgba(0, 0, 0, 0.5)',
        border: 'rgba(34, 197, 94, 0.3)',
        accent: 'rgba(34, 197, 94, 0.1)',
      },
      error: {
        background: 'rgba(0, 0, 0, 0.5)',
        border: 'rgba(239, 68, 68, 0.3)',
        accent: 'rgba(239, 68, 68, 0.1)',
      },
      warning: {
        background: 'rgba(0, 0, 0, 0.5)',
        border: 'rgba(245, 158, 11, 0.3)',
        accent: 'rgba(245, 158, 11, 0.1)',
      },
    },
  },
} as const

// Utility Functions
export const getGlassClasses = (variant: keyof typeof MOBILE_FIRST_CONFIG.colors.glass = 'primary') => {
  const config = MOBILE_FIRST_CONFIG.colors.glass[variant]
  return `backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); background: ${config.background}; border: 1px solid ${config.border};`
}

export const getSafeAreaClasses = (sides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right']) => {
  return sides.map(side => `${side}: ${MOBILE_FIRST_CONFIG.safeArea[side]}`).join('; ')
}

export const getTouchTargetClasses = (size: keyof typeof MOBILE_FIRST_CONFIG.touchTargets = 'comfortable') => {
  const targetSize = MOBILE_FIRST_CONFIG.touchTargets[size]
  return `min-height: ${targetSize}px; min-width: ${targetSize}px;`
}

// Mobile Detection
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_FIRST_CONFIG.breakpoints.tablet
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= MOBILE_FIRST_CONFIG.breakpoints.tablet && window.innerWidth < MOBILE_FIRST_CONFIG.breakpoints.desktop
}

export const isDesktop = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= MOBILE_FIRST_CONFIG.breakpoints.desktop
}

// Prefers Reduced Motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_FIRST_CONFIG.animations.prefersReducedMotion.query).matches
}
