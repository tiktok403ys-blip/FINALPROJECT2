"use client"

import Image from "next/image"

interface FitImageProps {
  src: string
  alt: string
  width: number
  height: number
  sizes?: string
  className?: string
  imgClassName?: string
}

// A bounded container that uses Next/Image fill + object-contain,
// so the image always fits without cropping or overflowing.
export function FitImage({ src, alt, width, height, sizes, className, imgClassName }: FitImageProps) {
  return (
    <div className={`relative flex items-center justify-center ${className || ""}`} style={{ width, height }}>
      <Image src={src} alt={alt} fill sizes={sizes || `${width}px`} className={imgClassName} style={{ objectFit: "contain" }} />
    </div>
  )
}

export default FitImage


