import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthModal.css'

export default function AuthModal({ onSuccess, onClose, message }) {
  const { login } = useAuth()
  const [phase, setPhase] = useState('phone') // 'phone' | 'otp'
  const [rawPhone, setRawPhone] = useState('')
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [devOtp, setDevOtp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resend, setResend] = useState(0)

  const inputRefs = useRef([])
  const timerRef = useRef(null)

  // Resend countdown
  useEffect(() => {
    if (resend > 0) {
      timerRef.current = setTimeout(() => setResend(t => t - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [resend])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const sendCode = async (phone) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.sendOtp(phone)
      setNormalizedPhone(res.phone)
      if (res.devOtp) setDevOtp(res.devOtp)
      setPhase('otp')
      setResend(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSubmit = (e) => {
    e.preventDefault()
    sendCode(rawPhone)
  }

  const handleOtpChange = (idx, val) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = ch
    setOtp(next)
    if (ch && idx < 5) inputRefs.current[idx + 1]?.focus()
    // Auto-verify when last digit filled
    if (ch && idx === 5) {
      const code = next.join('')
      if (code.length === 6) verify(code)
    }
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      verify(text)
      e.preventDefault()
    }
  }

  const verify = async (code) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.verifyOtp(normalizedPhone, code)
      login(res.user, res.token)
      onSuccess?.(res.user)
    } catch (err) {
      setError(err.message)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = (e) => {
    e.preventDefault()
    verify(otp.join(''))
  }

  return (
    <div className="auth-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in">

        {onClose && (
          <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        )}

        {/* Brand mark */}
        <div className="auth-modal__brand" aria-hidden="true">
          <span className="auth-modal__mark">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 17 Q2 3 10 3 Q18 3 18 17" stroke="rgba(255,255,255,0.3)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M5 17 Q5 8.5 10 8.5 Q15 8.5 15 17" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M8 17 Q8 13 10 13 Q12 13 12 17" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="auth-modal__brand-name">mojobooking</span>
        </div>

        {phase === 'phone' ? (
          <>
            <h2 className="auth-modal__title">Sign in to book</h2>
            <p className="auth-modal__sub">
              {message || "We'll send a 6-digit code to verify your number."}
            </p>

            <form onSubmit={handlePhoneSubmit} className="auth-modal__form">
              <div className="auth-phone-row">
                <span className="auth-phone-row__flag">🇬🇭</span>
                <span className="auth-phone-row__prefix">+233</span>
                <input
                  className="auth-phone-row__input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="20 123 4567"
                  value={rawPhone}
                  onChange={(e) => setRawPhone(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <p className="auth-modal__error">{error}</p>}
              <button type="submit" className="btn btn-primary auth-modal__cta" disabled={loading}>
                {loading ? 'Sending…' : 'Send code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-modal__title">Enter your code</h2>
            <p className="auth-modal__sub">
              Sent to <strong>{normalizedPhone}</strong>
              {devOtp && (
                <span className="auth-modal__dev-badge"> dev: {devOtp}</span>
              )}
            </p>

            <form onSubmit={handleOtpSubmit} className="auth-modal__form">
              <div className="otp-row" onPaste={handleOtpPaste}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    className={`otp-box${val ? ' otp-box--filled' : ''}`}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && <p className="auth-modal__error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-modal__cta"
                disabled={loading || otp.join('').length < 6}
              >
                {loading ? 'Verifying…' : 'Verify & continue'}
              </button>

              <div className="auth-modal__resend-row">
                {resend > 0 ? (
                  <span className="text-muted">Resend code in {resend}s</span>
                ) : (
                  <button type="button" className="auth-modal__text-btn" onClick={() => sendCode(rawPhone)}>
                    Resend code
                  </button>
                )}
                <span className="text-muted">·</span>
                <button
                  type="button"
                  className="auth-modal__text-btn"
                  onClick={() => { setPhase('phone'); setError(null); setOtp(['', '', '', '', '', '']) }}
                >
                  Change number
                </button>
              </div>
            </form>
          </>
        )}

        <p className="auth-modal__terms">
          By continuing you agree to our{' '}
          <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
