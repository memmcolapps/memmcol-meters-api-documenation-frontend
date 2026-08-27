/**
 * Display formatters that never throw.
 *
 * The API has been observed breaking its own contract — sending `null` for a
 * field the type declares as required, or dropping a nested object entirely.
 * A throw during render escapes to the route error boundary and replaces the
 * screen, so a malformed field must degrade to a placeholder instead.
 *
 * These take `unknown` on purpose: they are the boundary where an untrusted
 * payload becomes a string, so they must not assume the declared type held.
 */

export const PLACEHOLDER = '—'

/** A string field, or the placeholder when it is missing or blank. */
export function formatText(value: unknown, fallback = PLACEHOLDER) {
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

/** Joins name or address parts, skipping any that are missing. */
export function formatName(...parts: unknown[]) {
  const joined = parts
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')

  return joined || PLACEHOLDER
}

/** A thousands-separated number, or the placeholder when it is not one. */
export function formatNumber(value: unknown, fallback = PLACEHOLDER) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString()
    : fallback
}

/** Date and time in the viewer's locale. Unparseable input is shown as-is. */
export function formatDateTime(value: unknown, fallback = PLACEHOLDER) {
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString()
  }
  return typeof value === 'string' && value.trim() ? value : fallback
}

/** `SUSPENDED` becomes `Suspended`. Unknown values do not throw. */
export function formatStatusLabel(value: unknown, fallback = 'Unknown') {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const status = value.trim()
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

/**
 * Narrows an API collection to something safe to `.map` over. Guards the case
 * where a list endpoint returns `null`, an object, or omits the field.
 */
export function toList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * A JSON string re-indented for display, so sample payloads and responses read
 * as code rather than as one long line.
 *
 * Admins paste these by hand, so the text is not guaranteed to parse. Invalid
 * JSON is handed back untouched instead of being swallowed — they still need to
 * see and correct what they typed.
 */
export function formatJson(value: unknown) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (!text) return ''
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}
