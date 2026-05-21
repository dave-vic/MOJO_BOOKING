import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api, formatPrice } from '../api.js'
import RatingStars from '../components/RatingStars.jsx'
import './SalonDetails.css'

export default function SalonDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.getSalon(id)
      .then((data) => mounted && setSalon(data))
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="container salon-loading">
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--r-lg)', marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 12 }} />
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="container" style={{ padding: 'var(--s-16) 0' }}>
        <h2>Not found</h2>
        <p className="text-muted" style={{ marginTop: 12 }}>That salon or barbershop doesn't exist or has moved.</p>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: 24 }}>Browse salons & barbers</Link>
      </div>
    )
  }

  const startingPrice = Math.min(...(salon.featuredServices || []).map((s) => s.price))
  const gallery = salon.gallery?.length ? salon.gallery : [salon.image]

  const startBookingWith = (stylist) => {
    navigate(`/salons/${salon.id}/book`, { state: { salon, stylist } })
  }

  return (
    <div className="salon-details fade-in">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link to={salon.type === 'barbershop' ? '/search?type=barbershop' : '/search?type=salon'}>
            {salon.type === 'barbershop' ? 'Barbershops' : 'Hair Salons'}
          </Link>
          <span aria-hidden="true">›</span>
          <span>{salon.name}</span>
        </nav>

        {/* Gallery */}
        <div className="gallery">
          <div className="gallery__main">
            <img src={gallery[activeImage]} alt={salon.name} />
            <span className="chip gallery__area">{salon.area}</span>
          </div>
          {gallery.length > 1 && (
            <div className="gallery__thumbs">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  className={`gallery__thumb ${i === activeImage ? 'is-active' : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View photo ${i + 1}`}
                >
                  <img src={g} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <header className="salon-header">
          <div className="salon-header__left">
            <h1>{salon.name}</h1>
            <div className="salon-header__meta">
              <RatingStars rating={salon.rating} count={salon.reviewsCount} size="md" />
              <span className="text-muted">·</span>
              <span className="text-muted">{salon.address}</span>
            </div>
            <div className="salon-header__badges">
              <span className="chip"><span className="chip__dot chip__dot--green" /> Open until 7:00 PM</span>
              <span className="chip">MoMo accepted</span>
              <span className="chip">Free cancellation 24h+</span>
            </div>
          </div>
          <div className="salon-header__cta">
            <span className="text-muted" style={{ fontSize: 13 }}>From</span>
            <strong className="salon-header__price">{formatPrice(startingPrice)}</strong>
            <a href="#stylists" className="btn btn-primary btn-lg">Book an appointment</a>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
              {salon.depositPercent}% deposit via MoMo · Balance at the salon
            </p>
          </div>
        </header>

        <div className="salon-layout">
          <div className="salon-main">
            <section className="salon-section">
              <h2>About</h2>
              <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.65 }}>{salon.about}</p>
            </section>

            <section className="salon-section" id="stylists">
              <div className="salon-section__head">
                <h2>Meet the team</h2>
                <span className="text-muted">
                  {salon.type === 'barbershop' ? 'Pick a barber to start booking' : 'Pick a stylist to start booking'}
                </span>
              </div>
              <div className="stylist-grid">
                {salon.stylists.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className="stylist-card"
                    onClick={() => startBookingWith(st)}
                  >
                    <img src={st.image} alt={st.name} />
                    <div className="stylist-card__body">
                      <div className="stylist-card__name">{st.name}</div>
                      <div className="stylist-card__role">{st.role}</div>
                      <div className="stylist-card__rating">
                        <RatingStars rating={st.rating} size="sm" showNumber />
                        <span className="text-muted" style={{ fontSize: 12 }}>· {st.yearsExp}y exp</span>
                      </div>
                      <div className="stylist-card__specialties">
                        {st.specialties.slice(0, 2).map((s) => <span key={s} className="chip">{s}</span>)}
                      </div>
                    </div>
                    <span className="stylist-card__arrow" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="salon-section" id="services">
              <h2>Featured services</h2>
              <ul className="service-list">
                {salon.featuredServices.map((s) => (
                  <li key={s.id} className="service-row">
                    <div>
                      <div className="service-row__name">{s.name}</div>
                      <div className="service-row__meta">{s.duration}</div>
                    </div>
                    <div className="service-row__actions">
                      <div className="service-row__pricing">
                        <span className="service-row__price">{formatPrice(s.price)}</span>
                        <span className="service-row__deposit text-muted">
                          {formatPrice(s.depositAmount)} deposit
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate(`/salons/${salon.id}/book`, { state: { salon, service: s } })}
                      >
                        Book
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="salon-section">
              <div className="salon-section__head">
                <h2>Reviews</h2>
                <RatingStars rating={salon.rating} count={salon.reviewsCount} size="md" />
              </div>
              <ul className="review-list">
                {salon.reviews.map((r, i) => (
                  <li key={i} className="review">
                    <div className="review__head">
                      <div className="review__avatar" aria-hidden="true">{r.author.charAt(0)}</div>
                      <div>
                        <div className="review__author">{r.author}</div>
                        <div className="review__date">{r.date}</div>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <RatingStars rating={r.rating} showNumber={false} />
                      </div>
                    </div>
                    <p className="review__body">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="salon-aside">
            <div className="card salon-aside__card">
              <h3>Visit</h3>
              <p style={{ marginTop: 12 }}>{salon.address}</p>

              <div className="salon-aside__divider" />

              <h3>Cancellation policy</h3>
              <ul className="policy-list">
                {salon.cancellationPolicy.description.map((p) => (
                  <li key={p.window}>
                    <span>{p.window}</span>
                    <strong>{p.refund}</strong>
                  </li>
                ))}
              </ul>

              <div className="salon-aside__divider" />

              <h3>Opening hours</h3>
              <ul className="hours-list">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <li key={d}>
                    <span>{d}</span>
                    <span className="text-muted">{i === 6 ? 'Closed' : '09:00 – 19:00'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
