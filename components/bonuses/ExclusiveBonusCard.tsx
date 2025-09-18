"use client"

import styles from "./exclusive-bonus-card.module.css"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"

type Props = {
  title: string
  description?: string
  isExclusive?: boolean
  bonusType?: string
  rating?: number | null
  claimHref: string
  logoUrl?: string | null
}

export default function ExclusiveBonusCard({
  title,
  description,
  isExclusive,
  bonusType,
  rating,
  claimHref,
  logoUrl
}: Props) {
  return (
    <div className={styles.exCard}>
      <div className={styles.exSvgWrap}>
        {logoUrl ? (
          <Image src={logoUrl} alt={title} width={64} height={64} className={styles.exLogo} />
        ) : (
          <svg className={styles.exSvg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.3159 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"></path>
          </svg>
        )}
      </div>

      <div className={styles.exContent}>
        <div className={styles.exPills}>
          {isExclusive && <span className={`${styles.exPill} ${styles.exPillExclusive}`}>Exclusive</span>}
          <span className={`${styles.exPill} ${styles.exPillType}`}>{bonusType || "BONUS"}</span>
          {rating ? (
            <span className="flex items-center gap-1 text-white text-xs">
              <Star className="w-3 h-3 text-[#00ff88] fill-current" />
              {rating}
            </span>
          ) : null}
        </div>
        <p className={styles.exTitle}>{title}</p>
        {description ? <p className={styles.exDesc}>{description}</p> : null}
        <Link href={claimHref} className="mt-auto inline-flex items-center gap-2 text-black bg-[#00ff88] hover:bg-[#00ff88]/80 transition-colors px-3 py-1.5 rounded-md text-sm font-semibold" aria-label={`Claim bonus: ${title}`}>
          Claim Now
        </Link>
      </div>
    </div>
  )
}


