export type DocTable = {
  columns: string[]
  rows: string[][]
}

export type DocSection = {
  heading: string
  body: string
  /** Optional fenced code/example block rendered after the body paragraph. */
  code?: string
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
   * Short label shown on the getting-started strip card. Falls back to `blurb`
   * when absent. Guides only — the API grid uses `blurb`.
   */
  hint?: string
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
    slug: 'add-meters',
    name: 'Add Your Meters',
    hint: 'Register meters on the platform.',
    blurb:
      'How to add your meters to the Momas platform from your dashboard, which details each meter needs, and when SIM number and meter model are required.',
    sections: [
      {
        heading: 'Before you start',
        body:
          'Meters are added from your dashboard, not through the API. Sign in first — every meter you add is registered to the organisation you are signed in to. Have the following ready for each meter.',
        items: [
          'The meter number.',
          'The key change values: old and new SGC, KRN, and tariff index.',
          'Only if the meter is for HES use: the SIM card number and the meter model.',
        ],
      },
      {
        heading: 'Step 1 — Open the Meters page',
        body:
          'Go to Meters in the dashboard. The page lists every meter registered to your organisation, and lets you search by meter or SIM number, filter by status, and export the list as CSV.',
      },
      {
        heading: 'Step 2 — Open the add meter form',
        body:
          'Click Add Meters. The "Add new meter" form opens with the basic information fields.',
      },
      {
        heading: 'Step 3 — Fill in the meter details',
        body:
          'The meter number and the key change values are required for every meter. SIM card number and meter model are optional — they are only needed when the meter is intended for HES use, as explained in the next section.',
        table: {
          columns: ['Field', 'Required', 'Notes'],
          rows: [
            ['Meter Number', 'Yes', 'Digits only. Must be unique — a meter number already registered on the platform is rejected.'],
            ['Sim Card Number', 'Only for HES use', 'Digits only, and unique. The SIM the meter uses to reach the platform.'],
            ['Meter Model', 'Only for HES use', 'Picked from the models already integrated with the platform, listed as model — manufacturer.'],
            ['Old SGC / New SGC', 'Yes', 'Whole numbers. Supply Group Code before and after the key change.'],
            ['Old KRN / New KRN', 'Yes', 'Whole numbers. Key Revision Number before and after the key change.'],
            ['Old / New Tariff Index', 'Yes', 'Whole numbers. Tariff index before and after the key change.'],
          ],
        },
      },
      {
        heading: 'When SIM number and meter model are required',
        body:
          'Both fields are optional. They are only required when the meter is intended for HES use — that is, when you want to read from it and send commands to it remotely over HES/AMI. Leave them blank and the meter is still registered and usable for vending, but it cannot be reached remotely. HES also only works with meter models we have already integrated, so check whether yours is allowed for HES use before you add it.',
        items: [
          'Open Supported Meter Models for HES and look for your manufacturer and model.',
          'If your model is listed as supported, add the meter with its SIM card number and model selected.',
          'If it is not listed, follow Onboard Your Meter Models for HES to have it integrated first — you can add the meter now without those two fields and fill them in later.',
        ],
      },
      {
        heading: 'Step 4 — Save the meter',
        body:
          'Click Add Meter. The meter is created and appears in the meter list. If the meter number or SIM card number already exists on the platform, the form flags the duplicate and nothing is created — check the value and try again.',
      },
      {
        heading: 'After a meter is added',
        body:
          'From the meter list you can manage each meter as your setup changes.',
        items: [
          'View details to see the full record, including manufacturer, model, class, and key change values.',
          'Edit a meter to correct its details or to add the SIM number and model once the model is supported for HES.',
          'Activate or deactivate a meter to control whether it is in service.',
          'Delete a meter you no longer need, or export the list as CSV.',
        ],
      },
    ],
  },
  {
    slug: 'supported-meters',
    name: 'Supported Meter Models for HES',
    hint: 'Check if your meter model is supported for HES.',
    blurb:
      'Meter models that are already integrated with the Momas platform and allowed for HES use — remote reading and remote communication.',
    sections: [
      {
        heading: 'Currently Supported Models',
        body:
          'The meter models below are fully integrated and allowed for HES use — you can add a meter of one of these models with its SIM card number and model, and use it for remote communication right away. No integration request needed.',
      },
      {
        heading: "Don't See Your Meter Model?",
        body:
          'If your meter model is not listed, it is not yet allowed for HES use. You can still add the meter to the platform without a SIM number and model, but to use it remotely, contact our support team with your meter manufacturer, model, type, and smart meter parameters. See Onboard Your Meter Models for HES for the full list of details to include.',
      },
    ],
  },
  {
    slug: 'meter-onboarding',
    name: 'Onboard Your Meter Models for HES',
    hint: 'Get your meter model integrated for HES.',
    blurb:
      'A step-by-step guide to getting a meter model integrated for HES use, so meters of that model can be reached remotely through the API.',
    sections: [
      {
        heading: 'Step 1: Check Meter Compatibility',
        body:
          'Review Supported Meter Models for HES to confirm whether your meter model is already allowed for HES use. If it is supported, proceed to Step 5. If it is not supported, continue to Step 2.',
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
          'Check if your meter model is already supported for HES.',
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
  {
    slug: 'authentication',
    name: 'Authentication',
    hint: 'How requests are authorized.',
    blurb:
      'Every request to the Momas Meters API is authenticated with an API key. This guide explains how keys work and how to create, rotate, and protect them.',
    sections: [
      {
        heading: 'How authentication works',
        body:
          'The Momas Meters API authenticates every request with an API key. Send your key in the X-API-Key header. Requests without a valid key — or with a revoked or expired one — are rejected with 401 Unauthorized. The key identifies your organisation and applies your subscription and rate limits, so there is nothing else to sign or configure.',
        code:
          'X-API-Key: <YOUR_API_KEY>',
      },
      {
        heading: 'Live and test environments',
        body:
          'Every key belongs to one of two environments. Use a test key while you build and a live key in production. The two are independent — a test key never touches production data, and rotating one has no effect on the other.',
        table: {
          columns: ['Environment', 'Use it for', 'Key visibility'],
          rows: [
            ['TEST', 'Development and trying calls from these docs', 'Returned in full and viewable any time — it carries no production access'],
            ['LIVE', 'Real integrations and production traffic', 'Shown once when created, then stored masked — copy it immediately'],
          ],
        },
      },
      {
        heading: 'Create an API key',
        body:
          'Generate keys from your dashboard. You do not need to call an API to get one.',
        items: [
          'Open the dashboard and go to Settings → API Keys.',
          'Choose the environment (Test while building, Live for production).',
          'Optionally set an expiry date so the key rotates on a schedule.',
          'Copy the secret the moment it is shown — a live key is only revealed once.',
        ],
      },
      {
        heading: 'Rotate or revoke a key',
        body:
          'Keys can be replaced or switched off at any time from Settings → API Keys. Rotate on a schedule, and revoke immediately if a key is ever exposed.',
        items: [
          'Regenerate: issues a new secret and revokes the previous one in a single step — update your integration with the new value.',
          'Revoke: switches a key off immediately. In-flight requests using it start failing with 401.',
          'Expiry: a key past its expiry date stops working automatically, no action needed.',
        ],
      },
      {
        heading: 'Keep your keys safe',
        body:
          'An API key grants access to your organisation’s meters and data. Treat it like a password.',
        items: [
          'Never commit keys to source control or expose them in browser or mobile code — call the API from your server.',
          'Use a test key in development and a live key only in production.',
          'Store keys in environment variables or a secrets manager, not in plain files.',
          'If a key leaks, revoke it and regenerate right away.',
        ],
      },
    ],
  },
  {
    slug: 'first-request',
    name: 'Your First Request',
    hint: 'Make a call in minutes.',
    blurb:
      'A short walkthrough: create a key, make one authenticated call, and read the response. From here you can explore any of the APIs.',
    sections: [
      {
        heading: 'Before you begin',
        body:
          'You need three things to make your first call. If your meter is not on the platform yet, start with the Add Your Meters guide, and with the HES guides if you need remote communication.',
        items: [
          'An onboarded meter connected to the Momas platform.',
          'A test API key — see the Authentication guide to create one.',
          'The test base URL: https://sbctest.memmserve.com/powerhub/v1/api',
        ],
      },
      {
        heading: 'Step 1 — Set your API key',
        body:
          'Keep your key out of your command history and code by exporting it as an environment variable for the session.',
        code:
          'export MOMAS_API_KEY="<YOUR_TEST_API_KEY>"',
      },
      {
        heading: 'Step 2 — Make an authenticated request',
        body:
          'Send the key in the X-API-Key header. Replace <ENDPOINT> with the route from the API you want to call — every API reference page lists its exact route (for example, the Consumption Data page).',
        code:
          'curl https://sbctest.memmserve.com/powerhub/v1/api/<ENDPOINT> \\\n  -H "X-API-Key: $MOMAS_API_KEY" \\\n  -H "Accept: application/json"',
      },
      {
        heading: 'Step 3 — Read the response',
        body:
          'A successful call returns 200 with a JSON body. A 401 means the key is missing, revoked, or expired; a 404 means the endpoint or resource path is wrong. The exact response shape for each API is documented on its reference page under Sample Response.',
        code:
          '{\n  "status": "success",\n  "data": {\n    // fields specific to the endpoint you called\n  }\n}',
      },
      {
        heading: 'Idempotency key (required on writes)',
        body:
          'Every write request — such as vending a token or sending a remote command — must include an Idempotency-Key header. Write requests sent without it are rejected. Set it to a unique value (a UUID works well) that you generate once per operation. If a network error makes you unsure whether a request went through, retry it with the same Idempotency-Key: the API returns the original result instead of running the operation twice, so a token is never vended twice. Use a fresh key for each new operation.',
        code:
          'curl https://sbctest.memmserve.com/powerhub/v1/api/<ENDPOINT> \\\n  -H "X-API-Key: $MOMAS_API_KEY" \\\n  -H "Idempotency-Key: 3f8c2b1a-7d4e-4a91-b0c2-9e5f1d6a8c30" \\\n  -H "Content-Type: application/json" \\\n  -d \'{ /* request body */ }\'',
      },
      {
        heading: 'Next steps',
        body:
          'That is a complete authenticated request. From here, browse the APIs on the documentation home page to see every available endpoint, its route, cost, and sample payloads.',
        items: [
          'Explore the API references for request and response details.',
          'Switch to a live key when you are ready for production traffic.',
          'Review Authentication for rotating and protecting your keys.',
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
