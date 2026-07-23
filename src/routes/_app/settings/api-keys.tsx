import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDismiss } from '../../../app/useDismiss'
import { useToast } from '../../../app/toastContext'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  useCreateApiKey,
  useRevokeApiKey,
  type ApiKeySummary,
} from '../../../features/api-keys/apiKeyQueries'

export const Route = createFileRoute('/_app/settings/api-keys')({
  component: ApiKeysPage,
})

const TEST_KEY = '02i9_84gwa.......weghef65'

const expiryOptions = [
  { label: 'Never', days: null },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
  { label: 'Custom', days: 'custom' },
] as const

type ModalStep = 'closed' | 'form' | 'result'

function ApiKeysPage() {
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
  const { showToast } = useToast()
  const [liveKey, setLiveKey] = useState<ApiKeySummary | null>(null)
  const [step, setStep] = useState<ModalStep>('closed')
  const [expiry, setExpiry] = useState('Never')
  const [customExpiry, setCustomExpiry] = useState('')
  const [keyName, setKeyName] = useState('Live Key')
  const [generatedSecret, setGeneratedSecret] = useState('')
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const isSubmitting = createApiKey.isPending || revokeApiKey.isPending
  const closeModal = () => {
    if (isSubmitting) return
    setGeneratedSecret('')
    setStep('closed')
  }
  useDismiss(modalRef, closeModal, step !== 'closed')

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
    createApiKey.reset()
    revokeApiKey.reset()
    setKeyName('Live Key')
    setExpiry('Never')
    setCustomExpiry('')
    setGeneratedSecret('')
    setFormError('')
    setStep('form')
  }

  const getExpiresAt = () => {
    const selected = expiryOptions.find((option) => option.label === expiry)
    if (!selected || selected.days === null) return null
    if (selected.days === 'custom') {
      const date = new Date(customExpiry)
      if (!customExpiry || Number.isNaN(date.getTime())) {
        throw new Error('Select a valid expiry date.')
      }
      if (date.getTime() <= Date.now()) {
        throw new Error('Expiry date must be in the future.')
      }
      return date.toISOString()
    }

    return new Date(
      Date.now() + selected.days * 24 * 60 * 60 * 1_000,
    ).toISOString()
  }

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      setFormError('Key name is required.')
      return
    }

    let expiresAt: string | null
    try {
      expiresAt = getExpiresAt()
    } catch (error) {
      setFormError(getApiErrorMessage(error))
      return
    }

    setFormError('')
    try {
      if (liveKey) {
        await revokeApiKey.mutateAsync(liveKey.id)
        setLiveKey(null)
      }

      const createdKey = await createApiKey.mutateAsync({
        name: keyName.trim(),
        environment: 'LIVE',
        expiresAt,
      })
      const { secret, ...summary } = createdKey
      createApiKey.reset()
      revokeApiKey.reset()
      setLiveKey(summary)
      setGeneratedSecret(secret)
      setStep('result')
    } catch (error) {
      showToast({
        title: liveKey ? 'Could not regenerate API key' : 'Could not generate API key',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const handleRevoke = async () => {
    if (!liveKey) return

    try {
      await revokeApiKey.mutateAsync(liveKey.id)
      setLiveKey(null)
      showToast({
        title: 'API key revoked',
        message: `${liveKey.name} is no longer active.`,
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Could not revoke API key',
        message: getApiErrorMessage(error),
        variant: 'error',
      })
    } finally {
      revokeApiKey.reset()
    }
  }

  const handleDone = () => {
    setGeneratedSecret('')
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
              <code className="key-value">{liveKey.maskedKey}</code>
              <button
                type="button"
                className="btn-danger"
                disabled={revokeApiKey.isPending}
                onClick={() => void handleRevoke()}
              >
                {revokeApiKey.isPending ? 'Revoking…' : 'Revoke'}
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
          <div className="modal" ref={modalRef}>
            <div className="modal-head">
              <h2 id="modal-title" className="modal-title">
                Generate API Key
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <CloseIcon />
              </button>
            </div>

            {step === 'form' ? (
              <div className="modal-body modal-form">
                {hasLiveKey ? (
                  <p className="modal-text">
                    Generating a new live key will revoke the existing key first.
                  </p>
                ) : null}
                <div className="modal-field">
                  <label htmlFor="api-key-name">
                    Key Name <span className="req">*</span>
                  </label>
                  <input
                    id="api-key-name"
                    className="modal-input"
                    value={keyName}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(formError && !keyName.trim())}
                    onChange={(event) => {
                      setKeyName(event.target.value)
                      setFormError('')
                    }}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="expiry">
                    Expiry Date <span className="req">*</span>
                  </label>
                  <select
                    id="expiry"
                    className="modal-select"
                    value={expiry}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setExpiry(event.target.value)
                      setFormError('')
                    }}
                  >
                    {expiryOptions.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {expiry === 'Custom' ? (
                  <div className="modal-field">
                    <label htmlFor="custom-expiry">
                      Custom Expiry <span className="req">*</span>
                    </label>
                    <input
                      id="custom-expiry"
                      type="datetime-local"
                      className="modal-input"
                      value={customExpiry}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setCustomExpiry(event.target.value)
                        setFormError('')
                      }}
                    />
                  </div>
                ) : null}
                {formError ? (
                  <p className="modal-field-error" role="alert">{formError}</p>
                ) : null}
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isSubmitting}
                  onClick={() => void handleGenerate()}
                >
                  {isSubmitting
                    ? hasLiveKey ? 'Replacing key…' : 'Generating…'
                    : 'Generate Key'}{' '}
                  <PlusIcon />
                </button>
              </div>
            ) : (
              <div className="modal-body">
                <p className="modal-text">
                  Your new API key has been created. <strong>Copy it now</strong>,
                  as we will not display it again.
                </p>
                <div className="key-reveal">
                  <input className="key-reveal-input" value={generatedSecret} readOnly />
                  <button
                    type="button"
                    className="icon-copy"
                    aria-label="Copy API key"
                    onClick={() => copy(generatedSecret, 'generated')}
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
