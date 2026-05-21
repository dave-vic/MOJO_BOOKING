import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, formatPrice } from '../api.js'
import RatingStars from '../components/RatingStars.jsx'
import MoMoModal from '../components/MoMoModal.jsx'
import AuthModal from '../components/AuthModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Booking.css'

const STEPS = [
  { id: 'stylist', label: 'Stylist' },
  { id: 'service', label: 'Service' },
  { id: 'time', label: 'Time' },
  { id: 'review', label: 'Review' },
]

function nextDates(count = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

const fmtDate = (d) => d.toISOString().split('T')[0]
const dayLabel = (d, i) => i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' })

export default function Booking() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [salon, setSalon] = useState(location.state?.salon || null)
  const [loading, setLoading] = useState(!salon)
  const [error, setError] = useState(null)

  const [stepIdx, setStepIdx] = useState(0)
  const [stylist, setStylist] = useState(location.state?.stylist || null)
  const [service, setService] = useState(location.state?.service || null)

  const dates = useMemo(() => nextDates(7), [])
  const [date, setDate] = useState(fmtDate(dates[1]))
  const [time, setTime] = useState(null)
  const [availableSlots, setAvailableSlots] = useState(null)   // null = not loaded yet
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: user?.phone || '',
  })

  const [lock, setLock] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const lockTimerRef = useRef(null)

  const [momoOpen, setMomoOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Load salon if direct nav
  useEffect(() => {
    if (salon) return
    setLoading(true)
    api.getSalon(id)
      .then((data) => setSalon(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, salon])

  // Auto-pick first stylist/service if jumped in from a service Book button
  useEffect(() => {
    if (!salon) return
    if (service && !stylist) {
      const candidate = salon.stylists.find((st) => st.serviceIds?.includes(service.id)) || salon.stylists[0]
      setStylist(candidate)
      setStepIdx(2)
    } else if (stylist && !service) {
      setStepIdx(1)
    } else if (stylist && service) {
      setStepIdx(2)
    }
  }, [salon]) // eslint-disable-line react-hooks/exhaustive-deps

  // Step nav
  const goTo = (idx) => setStepIdx(Math.min(STEPS.length - 1, Math.max(0, idx)))
  const next = () => goTo(stepIdx + 1)
  const back = () => goTo(stepIdx - 1)

  // Filter services to those the chosen stylist offers
  const availableServices = useMemo(() => {
    if (!salon) return []
    if (!stylist) return salon.featuredServices
    return salon.featuredServices.filter((s) => stylist.serviceIds?.includes(s.id))
  }, [salon, stylist])

  // Microlock: when entering Review, lock the slot for 2 min
  useEffect(() => {
    if (STEPS[stepIdx]?.id !== 'review' || !salon || !stylist || !service) return
    let cancelled = false
    setLock(null)
    api.lockSlot({
      salonId: salon.id,
      stylistId: stylist.id,
      serviceId: service.id,
      date,
      time,
    }).then((l) => {
      if (cancelled) return
      setLock(l)
      const tick = () => {
        const remaining = Math.max(0, Math.round((l.expiresAt - Date.now()) / 1000))
        setSecondsLeft(remaining)
        if (remaining <= 0 && lockTimerRef.current) {
          clearInterval(lockTimerRef.current)
        }
      }
      tick()
      clearInterval(lockTimerRef.current)
      lockTimerRef.current = setInterval(tick, 1000)
    }).catch((e) => setError(e.message))
    return () => {
      cancelled = true
      clearInterval(lockTimerRef.current)
    }
  }, [stepIdx, salon, stylist, service, date, time])

  const handleMoMoConfirm = async ({ provider, phone }) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const booking = await api.createBooking({
        salonId: salon.id,
        stylistId: stylist.id,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        date,
        time,
        paymentMethod: 'momo',
        momoNumber: phone,
        momoProvider: provider,
        lockId: lock?.id,
        ...form,
      })
      navigate(`/booking/${booking.id}`, { state: { booking, salon, stylist } })
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--s-12) 0' }}>
        <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-lg)' }} />
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="container" style={{ padding: 'var(--s-16) 0' }}>
        <h2>Salon not available</h2>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: 16 }}>Browse salons</Link>
      </div>
    )
  }

  const total = service?.price ?? 0
  const deposit = service?.depositAmount ?? 0
  const balance = total - deposit

  const formComplete = form.customerName && form.customerEmail && form.customerPhone
  const canProceedReview = formComplete && lock && secondsLeft > 0

  return (
    <div className="booking fade-in">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link to={`/salons/${salon.id}`}>{salon.name}</Link>
          <span aria-hidden="true">›</span>
          <span>Book</span>
        </nav>

        <h1>Book your appointment</h1>

        {/* Stepper */}
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`stepper__item ${i === stepIdx ? 'is-active' : ''} ${i < stepIdx ? 'is-done' : ''}`}>
              <span className="stepper__num">{i < stepIdx ? '✓' : i + 1}</span>
              <span className="stepper__label">{s.label}</span>
            </li>
          ))}
        </ol>

        <form className="booking__layout" onSubmit={(e) => e.preventDefault()}>
          <div className="booking__main">
            {/* Step 1: Stylist */}
            {STEPS[stepIdx].id === 'stylist' && (
              <section className="booking__panel">
                <header className="booking__panel-head">
                  <h2>Pick your stylist</h2>
                  <p className="text-muted">You can also choose "any available" if you have no preference.</p>
                </header>
                <div className="stylist-list">
                  <button
                    type="button"
                    className={`stylist-row ${stylist?.id === 'any' ? 'is-selected' : ''}`}
                    onClick={() => { setStylist({ id: 'any', name: 'Any available stylist', role: 'No preference', serviceIds: salon.featuredServices.map((s) => s.id) }); setService(null); next() }}
                  >
                    <div className="stylist-row__avatar stylist-row__avatar--any" aria-hidden="true">★</div>
                    <div className="stylist-row__body">
                      <div className="stylist-row__name">Any available stylist</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>We'll match you with the first stylist free at your time.</div>
                    </div>
                  </button>

                  {salon.stylists.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`stylist-row ${stylist?.id === st.id ? 'is-selected' : ''}`}
                      onClick={() => { setStylist(st); if (service && !st.serviceIds.includes(service.id)) setService(null); next() }}
                    >
                      <img src={st.image} alt="" className="stylist-row__avatar" />
                      <div className="stylist-row__body">
                        <div className="stylist-row__name">{st.name}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>{st.role} · {st.yearsExp}y experience</div>
                        <div className="stylist-row__specs">
                          {st.specialties.map((s) => <span key={s} className="chip">{s}</span>)}
                        </div>
                      </div>
                      <div className="stylist-row__rating">
                        <RatingStars rating={st.rating} size="sm" showNumber />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Step 2: Service */}
            {STEPS[stepIdx].id === 'service' && (
              <section className="booking__panel">
                <header className="booking__panel-head">
                  <h2>Pick a service</h2>
                  <p className="text-muted">
                    {stylist?.id === 'any' ? 'All services available' : `Services ${stylist?.name} offers`}
                  </p>
                </header>
                <ul className="service-options">
                  {availableServices.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`service-option ${service?.id === s.id ? 'is-selected' : ''}`}
                        onClick={() => { setService(s); next() }}
                      >
                        <div>
                          <div className="service-option__name">{s.name}</div>
                          <div className="service-option__meta">{s.duration} · deposit {formatPrice(s.depositAmount)}</div>
                        </div>
                        <strong className="service-option__price">{formatPrice(s.price)}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Step 3: Time */}
            {STEPS[stepIdx].id === 'time' && (
              <section className="booking__panel">
                <header className="booking__panel-head">
                  <h2>Pick a date & time</h2>
                  <p className="text-muted">
                    {stylist?.name}'s available slots. Times shown in Accra (GMT).
                  </p>
                </header>

                <div className="booking__sub">
                  <h4>Date</h4>
                  <div className="date-picker">
                    {dates.map((d, i) => {
                      const val = fmtDate(d)
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setDate(val)}
                          className={`date-pill ${val === date ? 'is-active' : ''}`}
                        >
                          <span className="date-pill__day">{dayLabel(d, i)}</span>
                          <span className="date-pill__date">{d.getDate()}</span>
                          <span className="date-pill__month">{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="booking__sub">
                  <h4>Time</h4>
                  <div className="time-grid">
                    {TIME_SLOTS.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTime(t)}
                        className={`time-pill ${t === time ? 'is-active' : ''}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="booking__nav">
                  <button type="button" className="btn btn-ghost" onClick={back}>Back</button>
                  <button type="button" className="btn btn-primary" onClick={next}>Continue</button>
                </div>
              </section>
            )}

            {/* Step 4: Review */}
            {STEPS[stepIdx].id === 'review' && (
              <section className="booking__panel">
                <header className="booking__panel-head">
                  <h2>Review and confirm</h2>
                  {lock && (
                    <div className={`booking__lock ${secondsLeft < 30 ? 'is-warning' : ''}`}>
                      <span className="booking__lock-dot" />
                      Slot held for you · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                    </div>
                  )}
                </header>

                <div className="review-block">
                  <div className="review-block__row">
                    <span className="text-muted">Stylist</span>
                    <strong>{stylist?.name}</strong>
                  </div>
                  <div className="review-block__row">
                    <span className="text-muted">Service</span>
                    <strong>{service?.name} · {service?.duration}</strong>
                  </div>
                  <div className="review-block__row">
                    <span className="text-muted">When</span>
                    <strong>
                      {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at {time}
                    </strong>
                  </div>
                </div>

                <h4 className="booking__sub-title">Your details</h4>
                <div className="form-grid">
                  <div>
                    <label className="label" htmlFor="customerName">Full name</label>
                    <input id="customerName" className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Akosua Mensah" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="customerPhone">Phone</label>
                    <input id="customerPhone" className="input" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="+233 20 000 0000" required />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="label" htmlFor="customerEmail">Email</label>
                    <input id="customerEmail" className="input" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="akosua@example.com" required />
                  </div>
                </div>

                <h4 className="booking__sub-title">Cancellation policy</h4>
                <ul className="policy-list policy-list--big">
                  {salon.cancellationPolicy.description.map((p) => (
                    <li key={p.window}>
                      <span>{p.window}</span>
                      <strong>{p.refund}</strong>
                    </li>
                  ))}
                </ul>

                <div className="booking__nav">
                  <button type="button" className="btn btn-ghost" onClick={back}>Back</button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    disabled={!canProceedReview}
                    onClick={() => setMomoOpen(true)}
                  >
                    Pay {formatPrice(deposit)} deposit with MoMo
                  </button>
                </div>
                {secondsLeft === 0 && lock && (
                  <p className="text-muted" style={{ fontSize: 13, marginTop: 12 }}>
                    Your hold has expired. Go back and pick a new time.
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="booking__summary">
            <div className="card booking-summary">
              <h3>Booking summary</h3>

              <div className="booking-summary__salon">
                <img src={salon.image} alt="" />
                <div>
                  <div className="booking-summary__name">{salon.name}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{salon.area}, Accra</div>
                </div>
              </div>

              <div className="booking-summary__rows">
                <div className="booking-summary__row">
                  <span className="text-muted">Stylist</span>
                  <strong>{stylist?.name || '—'}</strong>
                </div>
                <div className="booking-summary__row">
                  <span className="text-muted">Service</span>
                  <strong>{service?.name || '—'}</strong>
                </div>
                <div className="booking-summary__row">
                  <span className="text-muted">Duration</span>
                  <strong>{service?.duration || '—'}</strong>
                </div>
                <div className="booking-summary__row">
                  <span className="text-muted">Date · Time</span>
                  <strong>
                    {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {time}
                  </strong>
                </div>
              </div>

              {service && (
                <div className="booking-summary__split">
                  <div className="booking-summary__row">
                    <span className="text-muted">Total service</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="booking-summary__row">
                    <span className="text-muted">Deposit (MoMo today)</span>
                    <strong>{formatPrice(deposit)}</strong>
                  </div>
                  <div className="booking-summary__row">
                    <span className="text-muted">Balance at salon</span>
                    <span>{formatPrice(balance)}</span>
                  </div>
                </div>
              )}

              {submitError && <div className="booking-summary__error">{submitError}</div>}
            </div>
          </aside>
        </form>
      </div>

      <MoMoModal
        open={momoOpen}
        onClose={() => !submitting && setMomoOpen(false)}
        deposit={deposit}
        balance={balance}
        total={total}
        onConfirm={handleMoMoConfirm}
        error={submitError}
      />
    </div>
  )
}
