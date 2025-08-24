"use client"

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Plus, X, AlertCircle, CheckCircle } from 'lucide-react'
import { submitCasinoReview } from '@/app/actions/casino-actions'
import { GlassCard } from '@/components/glass-card'
import { trackEvent } from '@/lib/analytics'
import type { Casino } from '@/lib/types'

// Form validation schema
const reviewSchema = z.object({
  casinoId: z.string().min(1, 'Casino is required'),
  rating: z.number().min(1).max(10, 'Rating must be between 1 and 10'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(20, 'Review must be at least 20 characters').max(1000, 'Review must be less than 1000 characters'),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional()
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface CasinoReviewFormProps {
  casino: Casino
  onSuccess?: () => void
  onCancel?: () => void
}

export function CasinoReviewForm({ casino, onSuccess, onCancel }: CasinoReviewFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      casinoId: casino.id,
      rating: 0,
      title: '',
      content: '',
      pros: [],
      cons: []
    }
  })

  const rating = watch('rating')
  const pros = watch('pros') || []
  const cons = watch('cons') || []

  // Track form interaction
  useEffect(() => {
    trackEvent({
      action: 'review_form_started',
      category: 'User Engagement',
      label: casino.id,
      customParameters: {
        casino_id: casino.id,
        casino_name: casino.name
      }
    })
  }, [casino.id, casino.name])

  const onSubmit = async (data: ReviewFormData) => {
    startTransition(async () => {
      try {
        setSubmitStatus('idle')
        setErrorMessage('')

        // Manually construct FormData since we can't pass complex objects directly
        const formData = new FormData()
        formData.append('casinoId', data.casinoId)
        formData.append('rating', data.rating.toString())
        formData.append('title', data.title)
        formData.append('content', data.content)
        formData.append('pros', JSON.stringify(data.pros || []))
        formData.append('cons', JSON.stringify(data.cons || []))

        const result = await submitCasinoReview(formData)

        if (result.success) {
          setSubmitStatus('success')
          reset()

          // Track successful submission
          trackEvent({
            action: 'review_submitted',
            category: 'User Engagement',
            label: casino.id,
            value: data.rating,
            customParameters: {
              casino_id: casino.id,
              rating: data.rating,
              has_pros: (data.pros?.length || 0) > 0,
              has_cons: (data.cons?.length || 0) > 0,
              title_length: data.title.length,
              content_length: data.content.length
            }
          })

          // Call success callback after a delay
          setTimeout(() => {
            onSuccess?.()
          }, 2000)
        } else {
          setSubmitStatus('error')
          setErrorMessage(result.error || 'Failed to submit review')

          // Track submission error
          trackEvent({
            action: 'review_submission_error',
            category: 'User Engagement',
            label: casino.id,
            customParameters: {
              casino_id: casino.id,
              error: result.error
            }
          })
        }
      } catch (error) {
        setSubmitStatus('error')
        setErrorMessage('An unexpected error occurred')

        console.error('Review submission error:', error)
      }
    })
  }

  const addPro = () => {
    if (pros.length < 5) {
      setValue('pros', [...pros, ''])
    }
  }

  const removePro = (index: number) => {
    setValue('pros', pros.filter((_, i) => i !== index))
  }

  const updatePro = (index: number, value: string) => {
    const newPros = [...pros]
    newPros[index] = value
    setValue('pros', newPros)
  }

  const addCon = () => {
    if (cons.length < 5) {
      setValue('cons', [...cons, ''])
    }
  }

  const removeCon = (index: number) => {
    setValue('cons', cons.filter((_, i) => i !== index))
  }

  const updateCon = (index: number, value: string) => {
    const newCons = [...cons]
    newCons[index] = value
    setValue('cons', newCons)
  }

  const handleStarClick = (value: number) => {
    setValue('rating', value)
  }

  return (
    <GlassCard className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Write a Review</h2>
          <p className="text-gray-400">Share your experience with {casino.name}</p>
        </div>

        {/* Casino Info */}
        <div className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg">
          <div className="w-12 h-12 bg-[#00ff88]/20 rounded-lg flex items-center justify-center">
            <span className="text-[#00ff88] font-bold text-lg">
              {casino.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{casino.name}</h3>
            <p className="text-gray-400 text-sm">Rating: {casino.rating}/10</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-white text-sm font-medium mb-3 block">
              Rating (Required)
            </Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(value)}
                  className="focus:outline-none focus:ring-2 focus:ring-[#00ff88] rounded"
                  disabled={isPending}
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= rating
                        ? 'text-[#00ff88] fill-[#00ff88]'
                        : 'text-gray-600 hover:text-gray-400'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-3 text-gray-400 text-sm">
                {rating > 0 ? `${rating}/10` : 'Select rating'}
              </span>
            </div>
            {errors.rating && (
              <p className="text-red-400 text-sm mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-white text-sm font-medium mb-2 block">
              Review Title (Required)
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Summarize your experience..."
              className="bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-white text-sm font-medium mb-2 block">
              Your Review (Required)
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Share details about your experience..."
              rows={4}
              className="bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20 resize-none"
              disabled={isPending}
            />
            {errors.content && (
              <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* Pros */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white text-sm font-medium">Pros (Optional)</Label>
              {pros.length < 5 && (
                <Button
                  type="button"
                  onClick={addPro}
                  variant="outline"
                  size="sm"
                  className="text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/10"
                  disabled={isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {pros.map((pro, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={pro}
                    onChange={(e) => updatePro(index, e.target.value)}
                    placeholder={`Pro #${index + 1}`}
                    className="bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => removePro(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    disabled={isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white text-sm font-medium">Cons (Optional)</Label>
              {cons.length < 5 && (
                <Button
                  type="button"
                  onClick={addCon}
                  variant="outline"
                  size="sm"
                  className="text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/10"
                  disabled={isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {cons.map((con, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={con}
                    onChange={(e) => updateCon(index, e.target.value)}
                    placeholder={`Con #${index + 1}`}
                    className="bg-black/50 border-white/20 text-white placeholder-gray-400 focus:border-[#00ff88] focus:ring-[#00ff88]/20"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => removeCon(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    disabled={isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm">Review submitted successfully!</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between space-x-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isPending || rating === 0}
              className="flex-1 bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-medium"
            >
              {isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </GlassCard>
  )
}
