'use client'

import { usePageSectionSingle } from '@/hooks/use-page-section'
import { PageHero } from '@/components/page-hero'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useMemo } from 'react'

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

  // Memoized content for performance
  const content = useMemo(() => {
    const title = section?.heading || fallbackTitle
    const description = section?.content || fallbackDescription
    return { title, description }
  }, [section?.heading, section?.content, fallbackTitle, fallbackDescription])

  // Show loading state with skeleton instead of spinner
  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-16 min-h-[60vh]">
        {/* Skeleton loading for better UX */}
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              {/* Skeleton for breadcrumbs */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
              </div>
              {/* Skeleton for title */}
              <div className="space-y-3">
                <div className="h-12 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-12 bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
              {/* Skeleton for description */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-64 h-96 bg-gray-800 rounded-[2.5rem] animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no dynamic content and no fallback, show error or empty state
  if (!content.title && !content.description) {
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
      title={content.title}
      description={content.description}
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