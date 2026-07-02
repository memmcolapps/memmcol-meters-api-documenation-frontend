import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

/**
 * Positions a row-action menu with `position: fixed` so it renders on top of
 * the table's scroll container instead of being clipped by it. Anchors the
 * menu to the trigger button, flipping above it when there is no room below.
 */
export function useAnchoredMenu(isOpen: boolean, menuHeight = 150) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>()

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const base: CSSProperties = {
      position: 'fixed',
      right: window.innerWidth - rect.right,
    }
    setMenuStyle(
      rect.bottom + menuHeight > window.innerHeight
        ? { ...base, top: 'auto', bottom: window.innerHeight - rect.top + 4 }
        : { ...base, top: rect.bottom + 4 },
    )
  }, [isOpen, menuHeight])

  return { anchorRef, menuStyle }
}
