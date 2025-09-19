"use client"

import styles from "./exclusive-bonuses-slider.module.css"
import ExclusiveBonusCard from "@/components/bonuses/ExclusiveBonusCard"
import { useMemo } from "react"

type Bonus = any

type Props = {
  items: Bonus[]
}

// Desktop-only infinite slider (3 rows), mobile falls back to grid handled in page
export default function ExclusiveBonusesSlider({ items }: Props) {
  const { row1, row2, row3 } = useMemo(() => {
    if (!items || items.length === 0) {
      return { row1: [], row2: [], row3: [] }
    }
    // 1) Uniq by id to avoid duplicates from source
    const seen = new Set<string | number>()
    const base = items.filter((it: any) => {
      const key = it.id ?? `${it.title}-${it.casino_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (base.length === 0) return { row1: [], row2: [], row3: [] }
    const perRow = Math.max(1, Math.ceil(base.length / 3))

    // 2) Seeded shuffle (daily) for stable randomness
    const seedStr = new Date().toISOString().slice(0,10) // YYYY-MM-DD
    let seed = 0
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
    const rand = () => {
      // xorshift32
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 0xFFFFFFFF)
    }
    const shuffled = base.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const rotate = (arr: any[], start: number) => {
      const idx = ((start % arr.length) + arr.length) % arr.length
      return arr.slice(idx).concat(arr.slice(0, idx))
    }

    const r1 = rotate(shuffled, 0).slice(0, perRow)
    const r2 = rotate(shuffled, Math.floor(perRow / 2) || 1).slice(0, perRow)
    const r3 = rotate(shuffled, perRow).slice(0, perRow)

    // duplicate for seamless loop
    return { row1: [...r1, ...r1], row2: [...r2, ...r2], row3: [...r3, ...r3] }
  }, [items])

  if (row1.length === 0 && row2.length === 0 && row3.length === 0) return null

  const renderRow = (rowItems: Bonus[], direction: "left" | "right", duration = 30, delay = 0) => (
    <div className={styles.row} data-direction={direction === "right" ? "right" : undefined}>
      <div className={styles.track} style={{ ['--duration' as any]: `${duration}s`, animationDelay: `${-Math.abs(delay)}s` }}>
        {rowItems.map((bonus: any, idx: number) => (
          <div className={styles.item} key={`${bonus.id || idx}-${idx}`}>
            <ExclusiveBonusCard
              title={bonus.title}
              description={(bonus as any).short_description || undefined}
              isExclusive={!!bonus.is_exclusive}
              bonusType={bonus.bonus_type || 'BONUS'}
              rating={bonus.casinos?.rating || null}
              claimHref={bonus.home_link_override || bonus.claim_url || `/casinos/${bonus.casino_id}`}
              logoUrl={bonus.casinos?.logo_url || null}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={styles.slider} aria-label="Exclusive bonuses continuous slider">
      {renderRow(row1, "left", 36, 0)}
      {renderRow(row2, "right", 32, 8)}
      {renderRow(row3, "left", 28, 16)}
    </div>
  )
}


