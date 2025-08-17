'use client'

import { usePageSectionSingle } from '@/hooks/use-page-section'
import { PageHero } from '@/components/page-hero'
import { LoadingSpinner } from '@/components/loading-spinner'

interface DynamicPageHeroProps {
  pageName: string
  sectionType?: string
  fallbackTitle?: string
  fallbackDescription?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  author?: {
    name: string
    avatar?: string
  }
  date?: string
  children?: React.ReactNode
  className?: string
}

export function DynamicPageHero({
  pageName,
  sectionType = 'hero',
  fallbackTitle = '',
  fallbackDescription = '',
  breadcrumbs,
  author,
  date,
  children,
  className
}: DynamicPageHeroProps) {
  const { section, loading, error } = usePageSectionSingle(pageName, sectionType)

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  // Use dynamic content if available, otherwise fallback to static content
  const title = section?.heading || fallbackTitle
  const description = section?.content || fallbackDescription

  // If no dynamic content and no fallback, show error or empty state
  if (!title && !description) {
    if (error) {
      console.error('Error loading page section:', error)
    }
    return (
      <div className="py-12 text-center text-gray-500">
        <p>Content not available</p>
      </div>
    )
  }

  return (
    <PageHero
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      author={author?.name}
      date={date}
    >
      {children}
    </PageHero>
  )
}

// Komponen khusus untuk halaman dengan struktur yang lebih sederhana
interface SimpleDynamicHeroProps {
  pageName: string
  sectionType?: string
  fallbackTitle?: string
  fallbackDescription?: string
  className?: string
}

export function SimpleDynamicHero({
  pageName,
  sectionType = 'hero',
  fallbackTitle = '',
  fallbackDescription = '',
  className = ''
}: SimpleDynamicHeroProps) {
  const { section, loading, error } = usePageSectionSingle(pageName, sectionType)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const title = section?.heading || fallbackTitle
  const description = section?.content || fallbackDescription

  if (!title && !description) {
    if (error) {
      console.error('Error loading page section:', error)
    }
    return null
  }

  return (
    <div className={`text-center py-8 ${className}`}>
      {title && (
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
      )}
      {description && (
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

// Hook untuk mendapatkan multiple sections untuk satu halaman
export function usePageSections(pageName: string) {
  const { section, loading, error, refetch } = usePageSectionSingle(pageName, '')
  
  return {
    sections: section ? [section] : [],
    loading,
    error,
    refetch
  }
}

// Komponen untuk menampilkan multiple sections
interface DynamicPageSectionsProps {
  pageName: string
  className?: string
}

export function DynamicPageSections({
  pageName,
  className = ''
}: DynamicPageSectionsProps) {
  const { sections, loading, error } = usePageSections(pageName)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !sections || sections.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {sections.map((section) => (
        <div key={section.id} className="mb-8">
          {section.heading && (
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {section.heading}
            </h2>
          )}
          {section.content && (
            <div className="text-gray-600 leading-relaxed">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}