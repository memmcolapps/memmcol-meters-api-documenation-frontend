export type DocSection = {
  heading: string
  body: string
}

export type ApiEntry = {
  /** URL-safe, unique. Becomes the /docs/<slug> path. */
  slug: string
  name: string
  /** Short one-line description shown on the home grid + API page. */
  blurb: string
  /**
   * Optional reference content. When present it renders on the API's page;
   * when absent the page shows a "coming soon" placeholder. Fill this in the
   * content pass — no route or component changes needed.
   */
  sections?: DocSection[]
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TO ADD AN API
 *   1. Append an entry to `apis` below with a unique, URL-safe `slug`.
 *   2. That's it — it shows on the home grid and gets a working
 *      /docs/<slug> page automatically. Add `sections` later for content.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const apis: ApiEntry[] = [
  {
    slug: 'meter-master-data',
    name: 'Meter Master Data',
    blurb: 'Register, read, and manage the core records for every meter.',
  },
  {
    slug: 'consumption-data',
    name: 'Consumption Data',
    blurb: 'Retrieve granular energy consumption readings.',
  },
  {
    slug: 'event-alarm-data',
    name: 'Event & Alarm Data',
    blurb: 'Access tamper, outage, and alarm events from the field.',
  },
  {
    slug: 'load-profile-data',
    name: 'Load Profile Data',
    blurb: 'Pull interval load profiles for analytics and billing.',
  },
  {
    slug: 'remote-token-management',
    name: 'Remote Token Management',
    blurb: 'Generate and reconcile prepaid tokens programmatically.',
  },
  {
    slug: 'remote-communication',
    name: 'Remote Communication',
    blurb: 'Send commands to and receive responses from meters.',
  },
]

// Fail fast in development if two APIs share a slug (would collide on /docs/<slug>).
if (import.meta.env.DEV) {
  const seen = new Set<string>()
  for (const api of apis) {
    if (seen.has(api.slug)) {
      console.warn(`[apis] Duplicate API slug "${api.slug}" — slugs must be unique.`)
    }
    seen.add(api.slug)
  }
}

export const findApi = (slug: string) => apis.find((api) => api.slug === slug)
