export type DocTable = {
  columns: string[]
  rows: string[][]
}

export type DocSection = {
  heading: string
  body: string
  /** Optional bullet list rendered after the body paragraph. */
  items?: string[]
  /** Optional data table rendered after the body/list. */
  table?: DocTable
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

/**
 * Getting-started guides. Same shape as APIs so they share the /docs/<slug>
 * page, but they are listed in the "Getting started" strip instead of the
 * API grid.
 */
export const guides: ApiEntry[] = [
  {
    slug: 'supported-meters',
    name: 'Supported Meters',
    blurb:
      'Meter models that are already integrated with the Momas platform and ready for remote communication.',
    sections: [
      {
        heading: 'Currently Supported Models',
        body:
          'The meters below are fully integrated and can be onboarded right away — no integration request needed.',
        table: {
          columns: ['Manufacturer', 'Model', 'Status'],
          rows: [
            ['Momas', 'MX3', 'Supported'],
            ['Momas', 'MX5', 'Supported'],
            ['Momas', 'MX7 Pro', 'Supported'],
            ['Hexing', 'HXE110-KP', 'Supported'],
            ['Conlog', 'BEC44', 'Supported'],
          ],
        },
      },
      {
        heading: "Don't See Your Meter?",
        body:
          'If your meter model is not listed, contact our support team with your meter manufacturer, model, type, and smart meter parameters. See the meter onboarding guide for the full list of details to include.',
      },
    ],
  },
  {
    slug: 'meter-onboarding',
    name: 'How to Onboard Your Meter for Remote Communication',
    blurb:
      'A step-by-step guide to getting your meter connected to the Momas platform and ready for remote API access.',
    sections: [
      {
        heading: 'Step 1: Check Meter Compatibility',
        body:
          'Review the Supported Meters page to confirm whether your meter model is already supported. If it is supported, proceed to Step 5. If it is not supported, continue to Step 2.',
      },
      {
        heading: 'Step 2: Contact Our Team',
        body:
          'If your meter is not currently supported, contact our support team with the following information. This allows us to evaluate and integrate support for your meter.',
        items: [
          'Meter manufacturer',
          'Meter model',
          'Meter type',
          'Smart meter parameters: authentication details, passwords/access keys, OBIS codes, and communication protocol',
          'Any additional technical documentation available',
        ],
      },
      {
        heading: 'Step 3: Meter Integration',
        body:
          'Our engineering team will develop and validate support for your meter. Once the integration is complete, we will provide you with the required communication settings.',
        items: [
          'Server IP address',
          'Port number',
          'Any additional communication parameters required for your meter',
        ],
      },
      {
        heading: 'Step 4: Configure Your Meter',
        body:
          "Using your meter's configuration software or interface, write the provided IP address, port, and any other required communication settings to the meter.",
      },
      {
        heading: 'Step 5: Complete Onboarding',
        body:
          'After your meter has been successfully configured and connected to our platform, it will be onboarded for remote communication.',
      },
      {
        heading: 'Step 6: Subscribe to the Service',
        body:
          'Choose a subscription plan to enable remote communication services for your meter.',
      },
      {
        heading: 'Step 7: Start Using the APIs',
        body:
          'Follow the API documentation to work with your onboarded meter. Your meter is now ready for remote communication and API integration.',
        items: [
          'Authenticate your application',
          'Connect to your onboarded meter',
          'Send remote vending requests',
          'Monitor meter status and usage',
          'Perform supported remote operations',
        ],
      },
      {
        heading: 'Quick Overview',
        body: 'The onboarding process at a glance:',
        items: [
          'Check if your meter is already supported.',
          'If unsupported, send us your meter specifications and smart meter parameters.',
          'We integrate and validate your meter.',
          'We provide the IP address and port for configuration.',
          'Configure your meter with the provided settings.',
          'Subscribe to the remote communication service.',
          'Follow the API documentation and start communicating with your meter remotely.',
        ],
      },
    ],
  },
]

// Fail fast in development if two docs share a slug (would collide on /docs/<slug>).
if (import.meta.env.DEV) {
  const seen = new Set<string>()
  for (const entry of [...apis, ...guides]) {
    if (seen.has(entry.slug)) {
      console.warn(`[apis] Duplicate doc slug "${entry.slug}" — slugs must be unique.`)
    }
    seen.add(entry.slug)
  }
}

export const findApi = (slug: string) => apis.find((api) => api.slug === slug)

/** Looks up any doc page — APIs first, then guides. */
export const findDoc = (slug: string) =>
  findApi(slug) ?? guides.find((guide) => guide.slug === slug)
