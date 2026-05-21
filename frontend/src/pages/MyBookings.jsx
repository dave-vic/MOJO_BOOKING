import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, formatPrice } from '../api.js'
import './MyBookings.css'

const STATUS_COLOUR = {
  Confirmed: 'green',
  Pending:   'amber',
  Cancelled: 'red',
  Completed: 'grey',
}

function StatusBadge({ status }) {
  const colour = STATUS_COLOUR[status] || 'grey'
  return <span className={`booking-status booking-status--${colour}`}>{status}</span>
}

function BookingCard({ booking }) {
  const date = new Date(booking.date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="booking-card">
      <div className="booking-card__img-wrap">
        {booking.salonImage ? (
          <img src={booking.salonImage} alt={booking.salonName} className="booking-card__img" />
        ) : (
          <div className="booking-card__img-placeholder">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <path d="M2 17 Q2 3 10 3 Q18 3 18 17" stroke="rgba(0,0,0,0.15)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M5 17 Q5 8.5 10 8.5 Q15 8.5 15 17" stroke="rgba(0,0,0,0.3)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M8 17 Q8 13 10 13 Q12 13 12 17" stroke="rgba(0,0,0,0.6)" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      <div className="booking-card__body">
        <div className="booking-card__top">
          <div>
            <p className="booking-card__salon">{booking.salonName}</p>
            <p className="booking-card__service">{booking.serviceName} · {booking.stylistName}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="booking-card__meta">
          <span className="booking-card__meta-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="3" width="12" height="12" rx="2"/>
              <path d="M5 1v4M11 1v4M2 7h12"/>
            </svg>
            {date} · {booking.time}
          </span>
          <span className="booking-card__meta-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3l2 2"/>
            </svg>
            {booking.duration}
          </span>
        </div>

        <div className="booking-card__footer">
          <div className="booking-card__price-info">
            <span className="booking-card__ref">Ref: {booking.reference}</span>
            <span className="booking-card__total">{formatPrice(booking.price)}</span>
          </div>
          <Link to={`/salons/${booking.salonId}`} className="booking-card__cta">
            View salon →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function MyBookings() {
  const { isAuthenticated, user, logout } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    api.getMyBookings()
      .then(setBookings)
      .catch((err) => {
        // Old mj-xxx token from before JWT migration — auto sign-out cleanly
        if (err.status === 401) {
          logout()
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const upcoming = bookings.filter((b) => {
    const d = new Date(b.date + 'T23:59:59')
    return d >= new Date() && b.status !== 'Cancelled'
  })
  const past = bookings.filter((b) => {
    const d = new Date(b.date + 'T23:59:59')
    return d < new Date() || b.status === 'Cancelled'
  })

  if (!isAuthenticated) {
    return (
      <div className="my-bookings container">
        <div className="my-bookings__empty">
          <div className="my-bookings__empty-icon">🔒</div>
          <h2>Sign in to view your bookings</h2>
          <p>You need to be signed in to see your booking history.</p>
          <Link to="/search" className="btn btn-primary">Browse salons</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="my-bookings">
      <div className="container">

        {/* Header */}
        <div className="my-bookings__header">
          <div>
            <h1>My bookings</h1>
            <p className="my-bookings__sub">
              {user?.phone && <span>Signed in as {user.phone}</span>}
            </p>
          </div>
          <Link to="/search" className="btn btn-primary">Book again</Link>
        </div>

        {loading && (
          <div className="my-bookings__loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="booking-card booking-card--skeleton">
                <div className="booking-card__img-wrap skeleton-box" />
                <div className="booking-card__body">
                  <div className="skeleton-line" style={{ width: '55%' }} />
                  <div className="skeleton-line" style={{ width: '35%', marginTop: 8 }} />
                  <div className="skeleton-line" style={{ width: '70%', marginTop: 16 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="my-bookings__error">
            Could not load bookings: {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="my-bookings__empty">
            <div className="my-bookings__empty-icon">📅</div>
            <h2>No bookings yet</h2>
            <p>You haven't made any bookings. Ready to find a stylist?</p>
            <Link to="/search" className="btn btn-primary">Browse salons</Link>
          </div>
        )}

        {!loading && !error && upcoming.length > 0 && (
          <section className="my-bookings__section">
            <h2 className="my-bookings__section-title">Upcoming</h2>
            <div className="my-bookings__list">
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

        {!loading && !error && past.length > 0 && (
          <section className="my-bookings__section">
            <h2 className="my-bookings__section-title">Past</h2>
            <div className="my-bookings__list my-bookings__list--past">
              {past.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
