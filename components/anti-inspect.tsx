"use client"

import { useEffect } from "react"

export function AntiInspect() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const upper = key.toUpperCase()
      const ctrlOrMeta = e.ctrlKey || e.metaKey
      const isBlocked =
        // F12
        key === "F12" ||
        // Ctrl/Cmd + Shift + I/J/C (DevTools shortcuts)
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "K"].includes(upper)) ||
        // Ctrl/Cmd + U (view source)
        (ctrlOrMeta && !e.shiftKey && upper === "U") ||
        // Cmd + Opt + I/J/C (macOS variants)
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(upper))

      if (isBlocked) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      return undefined
    }

    window.addEventListener("contextmenu", handleContextMenu, { capture: true })
    window.addEventListener("keydown", handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true } as any)
      window.removeEventListener("keydown", handleKeyDown, { capture: true } as any)
    }
  }, [])

  return null
}

export default AntiInspect


