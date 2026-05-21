import { useEffect, useState } from 'react'
import { formatPrice } from '../api.js'
import './MoMoModal.css'

const PROVIDERS = [
  { id: 'mtn', name: 'MTN MoMo', accent: '#FFCC00' },
  { id: 'voda', name: 'Vodafone Cash', accent: '#E60000' },
  { id: 'airteltigo', name: 'AT Money', accent: '#0078D4' },
]

export default function MoMoModal({ open, onClose, deposit, balance, total, onConfirm, error }) {
  const [provider, setProvider] = useState('mtn')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('input') // 'input' | 'pending' | 'failed'

  useEffect(() => {
    if (!open) {
      setStep('input')
      setPhone('')
    }
  }, [open])

  if (!open) return null

  const isValidPhone = phone.replace(/\s/g, '').length >= 9

  const submit = async (e) => {
    e.preventDefault()
    if (!isValidPhone) return
    setStep('pending')
    // Simulate MoMo prompt round-trip
    await new Promise((r) => setTimeout(r, 1800))
    try {
      await onConfirm({ provider, phone: phone.replace(/\s/g, '') })
    } catch (err) {
      setStep('failed')
    }
  }

  return (
    <div className="momo-modal" role="dialog" aria-modal="true">
      <button type="button" className="momo-modal__backdrop" onClick={step === 'input' ? onClose : undefined} aria-label="Close" />
      <div className="momo-modal__sheet">
        <header className="momo-modal__head">
          <div>
            <div className="momo-modal__title">Pay deposit with Mobile Money</div>
            <div className="momo-modal__subtitle">Secure · No card needed · Refundable per policy</div>
          </div>
          {step === 'input' && (
            <button type="button" className="momo-modal__close" onClick={onClose} aria-label="Close">×</button>
          )}
        </header>

        {step === 'input' && (
          <form onSubmit={submit}>
            <div className="momo-modal__providers">
              {PROVIDERS.map((p) => (
                <label
                  key={p.id}
                  className={`momo-provider ${provider === p.id ? 'is-selected' : ''}`}
                  style={{ '--accent': p.accent }}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={() => setProvider(p.id)}
                  />
                  <span className="momo-provider__dot" />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>

            <label className="label" htmlFor="momo-phone">Mobile Money number</label>
            <input
              id="momo-phone"
              className="input"
              placeholder="0244 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoFocus
            />

            <div className="momo-modal__summary">
              <div className="momo-modal__row">
                <span className="text-muted">Deposit charged today</span>
                <strong>{formatPrice(deposit)}</strong>
              </div>
              <div className="momo-modal__row">
                <span className="text-muted">Balance at the salon</span>
                <span>{formatPrice(balance)}</span>
              </div>
              <div className="momo-modal__row momo-modal__row--total">
                <span>Total service</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>

            {error && <div className="momo-modal__error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!isValidPhone}
              style={{ width: '100%', marginTop: 16 }}
            >
              Pay {formatPrice(deposit)}
            </button>

            <p className="momo-modal__legal">
              By paying you agree to MojoBooking's <a href="#terms">terms</a>.
              A 4% platform fee is included in the service price, paid by the salon — not you.
            </p>
          </form>
        )}

        {step === 'pending' && (
          <div className="momo-modal__pending">
            <div className="momo-modal__spinner" aria-hidden="true" />
            <h3>Approve the prompt on your phone</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>
              We've sent a payment request to {phone || 'your number'}. Enter your MoMo PIN to authorise.
            </p>
            <div className="momo-modal__hint">
              <strong>Don't see the prompt?</strong> Dial <code>*170#</code> to approve.
            </div>
          </div>
        )}

        {step === 'failed' && (
          <div className="momo-modal__pending">
            <div className="momo-modal__failed" aria-hidden="true">!</div>
            <h3>Payment failed</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>
              {error || 'Likely cause: insufficient balance or wrong PIN. Try again or use a different number.'}
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setStep('input')}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
