'use client'

import { useState } from 'react'
import { useForm, Controller, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Save, 
  X, 
  Upload, 
  Eye, 
  EyeOff, 
  Calendar,
  Clock,
  Image as ImageIcon,
  File,
  Link,
  Hash,
  Type,
  ToggleLeft,
  List,
  AlignLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'checkbox' 
  | 'switch' 
  | 'date' 
  | 'datetime' 
  | 'time'
  | 'file' 
  | 'image' 
  | 'url'
  | 'rich-text'
  | 'tags'

export interface FormFieldOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface FormField {
  name: string
  label: string
  type: FormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  options?: FormFieldOption[]
  validation?: z.ZodType<any>
  defaultValue?: any
  accept?: string // for file inputs
  multiple?: boolean // for file/select inputs
  rows?: number // for textarea
  min?: number
  max?: number
  step?: number
  pattern?: string
  maxLength?: number
  minLength?: number
  dependencies?: string[] // fields that this field depends on
  conditional?: (values: any) => boolean // show field conditionally
  grid?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
  }
}

export interface FormSection {
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormBuilderProps<T extends FieldValues> {
  title: string
  description?: string
  sections: FormSection[]
  schema: z.ZodSchema<T>
  defaultValues?: Partial<T>
  onSubmit: (data: T) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  mode?: 'create' | 'edit'
  className?: string
}

export function FormBuilder<T extends FieldValues>({
  title,
  description,
  sections,
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  mode = 'create',
  className = ''
}: FormBuilderProps<T>) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showPassword, setShowPassword] = useState<Set<string>>(new Set())
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [tags, setTags] = useState<Record<string, string[]>>({})

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange'
  })

  const watchedValues = watch()

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle)
    } else {
      newCollapsed.add(sectionTitle)
    }
    setCollapsedSections(newCollapsed)
  }

  const togglePasswordVisibility = (fieldName: string) => {
    const newShowPassword = new Set(showPassword)
    if (newShowPassword.has(fieldName)) {
      newShowPassword.delete(fieldName)
    } else {
      newShowPassword.add(fieldName)
    }
    setShowPassword(newShowPassword)
  }

  const handleFileUpload = (fieldName: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files)
      setUploadedFiles(prev => ({ ...prev, [fieldName]: fileArray }))
      setValue(fieldName as Path<T>, fileArray as any)
    }
  }

  const addTag = (fieldName: string, tag: string) => {
    if (tag.trim()) {
      const currentTags = tags[fieldName] || []
      const newTags = [...currentTags, tag.trim()]
      setTags(prev => ({ ...prev, [fieldName]: newTags }))
      setValue(fieldName as Path<T>, newTags as any)
    }
  }

  const removeTag = (fieldName: string, index: number) => {
    const currentTags = tags[fieldName] || []
    const newTags = currentTags.filter((_, i) => i !== index)
    setTags(prev => ({ ...prev, [fieldName]: newTags }))
    setValue(fieldName as Path<T>, newTags as any)
  }

  const getFieldIcon = (type: FormFieldType) => {
    switch (type) {
      case 'email': return <Type className="w-4 h-4" />
      case 'password': return <EyeOff className="w-4 h-4" />
      case 'number': return <Hash className="w-4 h-4" />
      case 'textarea': return <AlignLeft className="w-4 h-4" />
      case 'select': return <List className="w-4 h-4" />
      case 'switch': return <ToggleLeft className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'time': return <Clock className="w-4 h-4" />
      case 'file': return <File className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'url': return <Link className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const renderField = (field: FormField) => {
    // Check conditional rendering
    if (field.conditional && !field.conditional(watchedValues)) {
      return null
    }

    const error = errors[field.name as keyof typeof errors]
    const fieldValue = watchedValues[field.name as keyof T]

    return (
      <div key={field.name} className="space-y-2">
        <Label 
          htmlFor={field.name} 
          className="text-white flex items-center gap-2"
        >
          {getFieldIcon(field.type)}
          {field.label}
          {field.required && <span className="text-red-400">*</span>}
        </Label>
        
        {field.description && (
          <p className="text-sm text-white/60">{field.description}</p>
        )}

        <Controller
          name={field.name as Path<T>}
          control={control}
          render={({ field: controllerField }) => {
            switch (field.type) {
              case 'text':
              case 'email':
              case 'url':
              case 'number':
                return (
                  <Input
                    {...controllerField}
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                    placeholder={field.placeholder}
                    disabled={field.disabled || loading}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    pattern={field.pattern}
                    maxLength={field.maxLength}
                    minLength={field.minLength}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                )

              case 'password':
                return (
                  <div className="relative">
                    <Input
                      {...controllerField}
                      type={showPassword.has(field.name) ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      disabled={field.disabled || loading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white"
                      onClick={() => togglePasswordVisibility(field.name)}
                    >
                      {showPassword.has(field.name) ? 
                        <EyeOff className="w-4 h-4" /> : 
                        <Eye className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                )

              case 'textarea':
                return (
                  <Textarea
                    {...controllerField}
                    placeholder={field.placeholder}
                    disabled={field.disabled || loading}
                    rows={field.rows || 4}
                    maxLength={field.maxLength}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  />
                )

              case 'select':
                return (
                  <Select
                    value={controllerField.value}
                    onValueChange={controllerField.onChange}
                    disabled={field.disabled || loading}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20 backdrop-blur-xl">
                      {field.options?.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={String(option.value)}
                          disabled={option.disabled}
                          className="text-white hover:bg-white/20"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )

              case 'multiselect':
                return (
                  <div className="space-y-2">
                    {field.options?.map((option) => {
                      const isSelected = Array.isArray(fieldValue) && fieldValue.includes(option.value)
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const currentValues = Array.isArray(fieldValue) ? fieldValue : []
                              if (checked) {
                                controllerField.onChange([...currentValues, option.value])
                              } else {
                                controllerField.onChange(currentValues.filter(v => v !== option.value))
                              }
                            }}
                            disabled={option.disabled || field.disabled || loading}
                            className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                          />
                          <Label className="text-white text-sm">{option.label}</Label>
                        </div>
                      )
                    })}
                  </div>
                )

              case 'checkbox':
                return (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={controllerField.value}
                      onCheckedChange={controllerField.onChange}
                      disabled={field.disabled || loading}
                      className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label className="text-white text-sm">{field.placeholder}</Label>
                  </div>
                )

              case 'switch':
                return (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={controllerField.value}
                      onCheckedChange={controllerField.onChange}
                      disabled={field.disabled || loading}
                      className="data-[state=checked]:bg-white"
                    />
                    <Label className="text-white text-sm">{field.placeholder}</Label>
                  </div>
                )

              case 'date':
              case 'datetime':
              case 'time':
                return (
                  <Input
                    {...controllerField}
                    type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'datetime-local'}
                    disabled={field.disabled || loading}
                    className="bg-white/10 border-white/20 text-white"
                  />
                )

              case 'file':
              case 'image':
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept={field.accept || (field.type === 'image' ? 'image/*' : undefined)}
                        multiple={field.multiple}
                        onChange={(e) => handleFileUpload(field.name, e.target.files)}
                        disabled={field.disabled || loading}
                        className="bg-white/10 border-white/20 text-white file:bg-white/20 file:border-0 file:text-white file:rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={field.disabled || loading}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    {uploadedFiles[field.name] && (
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles[field.name].map((file, index) => (
                          <Badge key={index} variant="secondary" className="bg-white/20 text-white">
                            {file.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )

              case 'tags':
                return (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag(field.name, e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                        disabled={field.disabled || loading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    {tags[field.name] && tags[field.name].length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags[field.name].map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-white/20 text-white cursor-pointer hover:bg-white/30"
                            onClick={() => removeTag(field.name, index)}
                          >
                            {tag}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )

              default:
                return (
                  <Input
                    {...controllerField}
                    placeholder={field.placeholder}
                    disabled={field.disabled || loading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                )
            }
          }}
        />

        {error && (
          <p className="text-sm text-red-400">
            {error.message as string}
          </p>
        )}
      </div>
    )
  }

  const onFormSubmit = async (data: T) => {
    try {
      await onSubmit(data)
      toast.success(`${mode === 'create' ? 'Created' : 'Updated'} successfully!`)
    } catch (error) {
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'}: ${error}`)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-white/70 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={isSubmitting || loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            form="form-builder"
            disabled={isSubmitting || loading}
            className="bg-white text-black hover:bg-white/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form id="form-builder" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {sections.map((section, sectionIndex) => {
          const isCollapsed = collapsedSections.has(section.title)
          
          return (
            <Card key={sectionIndex} className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardHeader 
                className={section.collapsible ? 'cursor-pointer' : ''}
                onClick={section.collapsible ? () => toggleSection(section.title) : undefined}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{section.title}</CardTitle>
                    {section.description && (
                      <p className="text-white/60 text-sm mt-1">{section.description}</p>
                    )}
                  </div>
                  {section.collapsible && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      {isCollapsed ? '+' : '-'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {(!section.collapsible || !isCollapsed) && (
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map(renderField)}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </form>
    </div>
  )
}