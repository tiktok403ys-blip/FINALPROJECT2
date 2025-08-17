"use client"

import Image, { ImageProps } from "next/image"

interface ResponsiveImageProps extends Omit<ImageProps, "loading"> {
  lazy?: boolean
}

export function ResponsiveImage({ lazy = true, alt = "", ...props }: ResponsiveImageProps) {
  return <Image loading={lazy ? "lazy" : undefined} sizes="(max-width: 768px) 100vw, 50vw" alt={alt} {...props} />
}


