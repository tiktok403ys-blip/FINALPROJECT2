"use client"

import Link from "next/link"
import styles from "./glow-button.module.css"

type Props = {
  href: string
  children: React.ReactNode
  glowColor?: string
}

export default function GlowButton({ href, children, glowColor = "#00ff88" }: Props) {
  return (
    <span className={styles.wrap}>
      <Link href={href} className={`${styles.btn} ${styles.shine} ${styles.glow}`} style={{ ['--glow-color' as any]: glowColor }}>
        {children}
      </Link>
    </span>
  )
}


