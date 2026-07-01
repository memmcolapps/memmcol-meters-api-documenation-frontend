import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Dismiss a floating element (modal, dropdown, menu) when the user clicks
 * outside of `ref` or presses Escape. Pass `enabled = false` while the element
 * is closed so the listeners aren't attached.
 */
export function useDismiss<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onDismiss: () => void,
  enabled = true,
) {
  const callback = useRef(onDismiss)
  callback.current = onDismiss

  useEffect(() => {
    if (!enabled) return

    const handlePointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback.current()
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callback.current()
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, enabled])
}
