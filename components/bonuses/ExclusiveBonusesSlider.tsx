"use client"

import styles from "./exclusive-bonuses-slider.module.css"
import ExclusiveBonusCard from "@/components/bonuses/ExclusiveBonusCard"

type Bonus = any

type Props = {
  items: Bonus[]
}

// Desktop-only infinite slider (3 rows), mobile falls back to grid handled in page
export default function ExclusiveBonusesSlider({ items }: Props) {
  if (!items || items.length === 0) return null

  // Ensure enough items for seamless loop by duplicating array
  const duplicated = [...items, ...items]

  // Split into 3 rows as evenly as possible
  const row1 = duplicated.filter((_, i) => i % 3 === 0)
  const row2 = duplicated.filter((_, i) => i % 3 === 1)
  const row3 = duplicated.filter((_, i) => i % 3 === 2)

  const renderRow = (rowItems: Bonus[], direction: "left" | "right", duration = 30) => (
    <div className={styles.row} data-direction={direction === "right" ? "right" : undefined}>
      <div className={styles.track} style={{ ['--duration' as any]: `${duration}s` }}>
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
      {renderRow(row1, "left", 36)}
      {renderRow(row2, "right", 32)}
      {renderRow(row3, "left", 28)}
    </div>
  )
}


