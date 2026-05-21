import { Link, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { formatPrice } from '../api.js'
import './Confirmation.css'

export default function Confirmation() {
  const { state } = useLocation()
  const booking = state?.booking
  const salon = state?.salon

  if (!booking) {
    return (
      <div className="container" style={{ padding: 'var(--s-16) 0' }}>
        <h2>Booking not found</h2>
        <p className="text-muted" style={{ marginTop: 8 }}>
          We couldn't load this booking. Please open it from the link in your email.
        </p>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: 16 }}>Browse salons</Link>
      </div>
    )
  }

  const policy = booking.cancellationPolicy?.description || []

  return (
    <div className="confirmation fade-in">
      <div className="container">
        <div className="confirmation__grid">
          <div className="confirmation__card">
            <div className="confirmation__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>

            <h1>You're booked.</h1>
            <p className="text-muted" style={{ marginTop: 12 }}>
              We've sent a confirmation to <strong>{booking.customerEmail}</strong> and an SMS to your phone.
            </p>

            <div className="confirmation__qr">
              <QRCodeSVG
                value={booking.qrPayload || `mojobooking:checkin:${booking.id}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#1a1020"
                level="M"
                imageSettings={{
                  src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="%23b9572d"/><text x="12" y="17" text-anchor="middle" font-family="Georgia" font-size="14" fill="%23fff">m</text></svg>',
                  height: 28,
                  width: 28,
                  excavate: true,
                }}
              />
              <div className="confirmation__qr-meta">
                <div className="text-muted" style={{ fontSize: 12 }}>SHOW AT THE SALON</div>
                <strong>{booking.reference}</strong>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Staff will scan this on arrival to check you in.
                </p>
              </div>
            </div>

            <div className="confirmation__details">
              <dl>
                <div>
                  <dt>Salon</dt>
                  <dd>
                    <strong>{booking.salonName}</strong>
                    <br />
                    <span className="text-muted" style={{ fontSize: 13 }}>{booking.salonAddress}</span>
                  </dd>
                </div>
                <div>
                  <dt>Stylist</dt>
                  <dd>{booking.stylistName}</dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd>{booking.serviceName} · {booking.duration}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>
                    {new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at {booking.time}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="confirmation__actions">
              <a href="#calendar" className="btn btn-ghost">Add to calendar</a>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(booking.salonAddress)}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                Get directions
              </a>
              <Link to="/" className="btn btn-primary">Back to home</Link>
            </div>
          </div>

          <aside className="confirmation__aside">
            <div className="card confirmation__panel">
              <h3>Payment</h3>
              <div className="confirmation__payment">
                <div className="confirmation__pay-row">
                  <span className="text-muted">Deposit paid via {booking.paymentMethod === 'momo' ? 'MoMo' : 'Card'}</span>
                  <strong className="confirmation__pay-amount">{formatPrice(booking.depositAmount)}</strong>
                </div>
                {booking.momoNumberMasked && (
                  <div className="confirmation__pay-row">
                    <span className="text-muted">From</span>
                    <span>{booking.momoNumberMasked}</span>
                  </div>
                )}
                <div className="confirmation__pay-row">
                  <span className="text-muted">Balance due at the salon</span>
                  <strong>{formatPrice(booking.balanceAmount)}</strong>
                </div>
                <div className="confirmation__pay-row confirmation__pay-row--total">
                  <span>Total service</span>
                  <strong>{formatPrice(booking.price)}</strong>
                </div>
              </div>
            </div>

            {policy.length > 0 && (
              <div className="card confirmation__panel">
                <h3>Cancellation policy</h3>
                <ul className="policy-list">
                  {policy.map((p) => (
                    <li key={p.window}>
                      <span>{p.window}</span>
                      <strong>{p.refund}</strong>
                    </li>
                  ))}
                </ul>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
                  Refunds go back to the same MoMo number you paid from, usually within 5 minutes.
                </p>
              </div>
            )}

            <div className="card confirmation__panel confirmation__panel--soft">
              <h3>Before your visit</h3>
              <ul className="confirmation__tips">
                <li>You'll get an SMS reminder 24 hours and 2 hours before.</li>
                <li>Running late? Reply to the SMS — we'll let the salon know.</li>
                <li>Need to reschedule? Tap the link in your email.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
