import { createContext, useContext } from 'react'

export type ToastVariant = 'error' | 'success' | 'info'

export type ToastInput = {
  title: string
  message?: string
  variant?: ToastVariant
}

export type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

// Bridge for code that runs outside the React tree (the API layer's session
// handling). ToastProvider registers itself here on mount.
let emitter: ToastContextValue['showToast'] | null = null

export function setToastEmitter(next: ToastContextValue['showToast'] | null) {
  emitter = next
}

export function emitToast(toast: ToastInput) {
  emitter?.(toast)
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
