import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/api-keys')({
  component: ApiKeysPage,
})

const TEST_KEY = '02i9_84gwa.......weghef65'

const expiryOptions = ['Never', '7 days', '30 days', '60 days', '90 days', 'Custom']

type ModalStep = 'closed' | 'form' | 'result'

function maskKey(key: string) {
  return `${key.slice(0, 7)}.......${key.slice(-11)}`
}

function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let body = ''
  for (let i = 0; i < 48; i += 1) {
    body += chars[Math.floor(Math.random() * chars.length)]
  }
  return `2i9_84gwa${body}weghef`
}

function ApiKeysPage() {
  const [liveKey, setLiveKey] = useState<string | null>(null)
  const [step, setStep] = useState<ModalStep>('closed')
  const [expiry, setExpiry] = useState('Never')
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const hasLiveKey = liveKey !== null

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const openModal = () => {
    setExpiry('Never')
    setStep('form')
  }

  const handleGenerate = () => {
    setGeneratedKey(generateKey())
    setStep('result')
  }

  const handleDone = () => {
    setLiveKey(generatedKey)
    setStep('closed')
  }

  return (
    <div className="dash">
      <header className="dash-toolbar dash-head-row">
        <div className="dash-head">
          <h1 className="dash-title">API Keys</h1>
          <p className="dash-subtitle">
            Manage API keys and control access to your integrations.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openModal}>
          {hasLiveKey ? 'Regenerate Key' : 'Generate Key'} <PlusIcon />
        </button>
      </header>

      <div className="dash-tabs" role="tablist">
        <button type="button" className="dash-tab is-active" role="tab" aria-selected="true">
          API Keys
        </button>
      </div>

      <section className="keys-grid">
        <article className="key-card">
          <h2 className="key-name">Test Key</h2>
          <div className="key-row">
            <code className="key-value">{TEST_KEY}</code>
            <button
              type="button"
              className="btn-outline"
              onClick={() => copy('test-key-secret', 'test')}
            >
              {copied === 'test' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </article>

        {hasLiveKey ? (
          <article className="key-card">
            <h2 className="key-name">Live Key</h2>
            <div className="key-row">
              <code className="key-value">{maskKey(liveKey)}</code>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setLiveKey(null)}
              >
                Revoke
              </button>
            </div>
          </article>
        ) : null}
      </section>

      {step !== 'closed' ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal">
            <div className="modal-head">
              <h2 id="modal-title" className="modal-title">
                Generate API Key
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setStep('closed')}
              >
                <CloseIcon />
              </button>
            </div>

            {step === 'form' ? (
              <div className="modal-body modal-form">
                <div className="modal-field">
                  <label htmlFor="expiry">
                    Expiry Date <span className="req">*</span>
                  </label>
                  <select
                    id="expiry"
                    className="modal-select"
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value)}
                  >
                    {expiryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="btn-primary" onClick={handleGenerate}>
                  Generate Key <PlusIcon />
                </button>
              </div>
            ) : (
              <div className="modal-body">
                <p className="modal-text">
                  Your new API key has been created. <strong>Copy it now</strong>,
                  as we will not display it again.
                </p>
                <div className="key-reveal">
                  <input className="key-reveal-input" value={generatedKey} readOnly />
                  <button
                    type="button"
                    className="icon-copy"
                    aria-label="Copy API key"
                    onClick={() => copy(generatedKey, 'generated')}
                  >
                    <CopyIcon />
                  </button>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-primary" onClick={handleDone}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
