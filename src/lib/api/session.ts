export type SessionScope = 'admin' | 'app'

type SessionExpiredHandler = (scope: SessionScope) => void | Promise<void>

let handler: SessionExpiredHandler | null = null
let isHandling = false
let hasSession = false

// Endpoints where a 401 is a normal in-page outcome (wrong credentials, an
// identity probe made while signed out) rather than a session that expired
// underneath the user. Route guards own those cases.
const exemptPrefixes = ['/auth/', '/admin/auth/']

function isSessionRequest(path: string) {
  return !exemptPrefixes.some((prefix) => path.startsWith(prefix))
}

export function setSessionExpiredHandler(next: SessionExpiredHandler) {
  handler = next
}

/** Called on every successful authenticated response, so we only treat a 401
 *  as an expiry when the user actually had a session to lose. */
export function markSessionActive(path: string) {
  if (isSessionRequest(path)) hasSession = true
}

export function clearSession() {
  hasSession = false
}

export function notifySessionExpired(path: string) {
  if (!handler || isHandling || !hasSession || !isSessionRequest(path)) return

  isHandling = true
  hasSession = false
  const scope: SessionScope = path.startsWith('/admin') ? 'admin' : 'app'

  void Promise.resolve(handler(scope)).finally(() => {
    isHandling = false
  })
}
