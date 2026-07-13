const ADMIN_SESSION_KEY = 'momas.admin.session'

export type AdminSession = {
  email: string
  accessToken?: string
}

/**
 * Admin session lives under its own storage key, fully separate from the
 * customer session — an admin login never overlaps a customer login.
 * UI-only stub for now: swap the stored shape for the real token/claims
 * once the admin API is wired up.
 */
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

export function setAdminSession(session: AdminSession) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}
