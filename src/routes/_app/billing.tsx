import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/billing')({
  component: BillingPage,
})

type Bundle = {
  name: string
  description: string
  /** Naira price. Absent for the negotiated Enterprise tier. */
  price?: number
  credits?: number
  /** Effective per-credit rate — the headline of the card. */
  rate: string
  features: string[]
  cta: string
  featured?: boolean
}

const bundles: Bundle[] = [
  {
    name: 'Starter',
    description: 'For pilots and small estates getting integrated.',
    price: 250_000,
    credits: 25_000,
    rate: '25,000 credits · ₦10 per credit',
    features: [
      '≈ 25,000 meter reads or 2,500 token vends',
      'Credits never expire',
      'One balance across every API',
      'Standard ticket support',
    ],
    cta: 'Buy credits',
  },
  {
    name: 'Growth',
    description: 'For estates and facilities in steady production.',
    price: 1_000_000,
    credits: 125_000,
    rate: '125,000 credits · ₦8 per credit — save 20%',
    featured: true,
    features: [
      '≈ 125,000 meter reads or 12,500 token vends',
      'Credits never expire',
      'One balance across every API',
      'Priority ticket support',
    ],
    cta: 'Buy credits',
  },
  {
    name: 'Scale',
    description: 'For large fleets with heavy daily traffic.',
    price: 3_000_000,
    credits: 500_000,
    rate: '500,000 credits · ₦6 per credit — save 40%',
    features: [
      '≈ 500,000 meter reads or 50,000 token vends',
      'Credits never expire',
      'One balance across every API',
      'Priority ticket support',
    ],
    cta: 'Buy credits',
  },
  {
    name: 'Enterprise',
    description: 'For utilities and DisCos with committed volume.',
    rate: 'Negotiated volume-based rate',
    features: [
      'Custom per-credit rate',
      'Postpaid invoicing available',
      'SLA with dedicated support',
      'Hands-on integration engineering',
    ],
    cta: 'Contact us',
  },
]

/**
 * Credit cost per operation. All APIs draw from the same balance, but
 * calls are weighted by what they cost to serve and what they're worth —
 * a token vend is not the same as a meter read.
 */
const operationPricing = [
  { api: 'Consumption Data', operation: 'Single meter read', credits: '1' },
  { api: 'Load Profile Data', operation: 'Interval profile pull', credits: '1' },
  { api: 'Meter Master Data', operation: 'Meter lookup', credits: '1' },
  { api: 'Meter Master Data', operation: 'Register or update a meter', credits: '2' },
  {
    api: 'Consumption / Load Profile',
    operation: 'Batch read (up to 100 meters)',
    credits: '10',
  },
  { api: 'Remote Communication', operation: 'Command to a meter', credits: '5' },
  { api: 'Remote Token Management', operation: 'Token vend', credits: '10' },
  { api: 'Event & Alarm Data', operation: 'Webhook delivery', credits: 'Free' },
]

type Purchase = {
  bundle: string
  date: string
  credits: number
  amount: number
}

const initialPurchases: Purchase[] = [
  { bundle: 'Starter', date: '12/05/2026', credits: 25_000, amount: 250_000 },
]

const LOW_BALANCE_THRESHOLD = 5_000

const naira = (value: number) => `₦ ${value.toLocaleString('en-NG')}`

const formatToday = () => new Date().toLocaleDateString('en-GB')

function BillingPage() {
  const [balance, setBalance] = useState(3_250)
  const [purchases, setPurchases] = useState(initialPurchases)
  // Customers with credits land on their credit overview; the buy grid only
  // shows for first-time buyers or after pressing Top up.
  const [view, setView] = useState<'credits' | 'buy'>(
    initialPurchases.length > 0 ? 'credits' : 'buy',
  )

  const creditsUsedThisMonth = 8_940
  const lastPurchase = purchases[purchases.length - 1]

  const buy = (bundle: Bundle) => {
    if (!bundle.credits || !bundle.price) return
    setBalance((value) => value + bundle.credits!)
    setPurchases((value) => [
      ...value,
      {
        bundle: bundle.name,
        date: formatToday(),
        credits: bundle.credits!,
        amount: bundle.price!,
      },
    ])
    setView('credits')
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">Billing</h1>
          <p className="dash-subtitle">
            Buy prepaid credits that work across every API. Calls are weighted —
            a token vend costs more than a meter read — and credits never expire.
          </p>
        </div>
        {view === 'credits' ? (
          <button type="button" className="btn-primary" onClick={() => setView('buy')}>
            Top up <PlusIcon />
          </button>
        ) : purchases.length > 0 ? (
          <button type="button" className="filter-btn" onClick={() => setView('credits')}>
            Back to Credits
          </button>
        ) : null}
      </header>

      <section className="dash-stats">
        <article className="stat-card">
          <div className="stat-text">
            <p className="stat-label">Credit Balance</p>
            <p className="stat-value">
              {balance.toLocaleString()} <span className="stat-unit">credits</span>
              {balance < LOW_BALANCE_THRESHOLD ? (
                <span className="balance-pill">Low balance</span>
              ) : null}
            </p>
          </div>
          <span className="stat-icon" aria-hidden="true">
            <WalletIcon />
          </span>
        </article>
        <article className="stat-card">
          <div className="stat-text">
            <p className="stat-label">Used This Month</p>
            <p className="stat-value">
              {creditsUsedThisMonth.toLocaleString()}{' '}
              <span className="stat-unit">credits</span>
            </p>
          </div>
          <span className="stat-icon" aria-hidden="true">
            <GaugeIcon />
          </span>
        </article>
        <article className="stat-card">
          <div className="stat-text">
            <p className="stat-label">Last Top-up</p>
            <p className="stat-value">
              {naira(lastPurchase.amount)}{' '}
              <span className="stat-unit">on {lastPurchase.date}</span>
            </p>
          </div>
          <span className="stat-icon" aria-hidden="true">
            <ReceiptIcon />
          </span>
        </article>
      </section>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          {view === 'credits' ? 'Credits' : 'Buy Credits'}
        </button>
      </div>

      {view === 'buy' ? (
        <>
          <section className="plans-grid plans-grid--bundles">
            {bundles.map((bundle) => (
              <article
                className={`plan-card${bundle.featured ? ' plan-card--featured' : ''}`}
                key={bundle.name}
              >
                <div className="plan-head">
                  <h2 className="plan-name">{bundle.name}</h2>
                  {bundle.featured ? (
                    <span className="plan-badge">Most popular</span>
                  ) : null}
                </div>
                <p className="plan-desc">{bundle.description}</p>
                <div className="plan-pricing">
                  <p className="plan-price">
                    {bundle.price ? naira(bundle.price) : 'Custom'}
                  </p>
                  <p className="plan-rate">{bundle.rate}</p>
                </div>
                <ul className="plan-features">
                  {bundle.features.map((feature) => (
                    <li className="plan-feature" key={feature}>
                      <CheckIcon /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-primary btn-block plan-cta"
                  onClick={() => buy(bundle)}
                >
                  {bundle.cta}
                </button>
              </article>
            ))}
          </section>

          <section className="dash-panel">
            <h2 className="panel-title">Operation Pricing</h2>
            <p className="pricing-note">
              Every API draws from the same credit balance, but not every call
              costs the same. Operations are weighted by what they do: routine
              reads cost 1 credit, commands that reach a physical meter cost 5,
              and token vends — the transaction that delivers power — cost 10.
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>API</th>
                    <th>Operation</th>
                    <th>Credits per call</th>
                  </tr>
                </thead>
                <tbody>
                  {operationPricing.map((row) => (
                    <tr key={`${row.api}-${row.operation}`}>
                      <td>{row.api}</td>
                      <td>{row.operation}</td>
                      <td>{row.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pricing-footnote">
              Batch reads and event webhooks are the cheapest way to integrate —
              poll less, pay less. Rate limits apply per API key regardless of
              balance.
            </p>
          </section>
        </>
      ) : (
        <section className="dash-panel">
          <h2 className="panel-title">Purchase History</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Bundle</th>
                  <th>Purchase Date</th>
                  <th>Credits Added</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, index) => (
                  <tr key={`${purchase.bundle}-${purchase.date}-${index}`}>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{purchase.bundle}</td>
                    <td>{purchase.date}</td>
                    <td>{purchase.credits.toLocaleString()}</td>
                    <td>{naira(purchase.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="plan-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H3" />
      <path d="M16.5 13.5h.01" />
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 19a9.5 9.5 0 1 1 15 0" />
      <path d="m12 13 3.5-4.5" />
      <circle cx="12" cy="13.5" r="1.4" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}
