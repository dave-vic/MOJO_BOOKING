import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import SearchBar from '../components/SearchBar.jsx'
import SalonCard from '../components/SalonCard.jsx'
import './Home.css'

const CATEGORIES = [
  { label: 'Braids', query: 'braids', icon: '𓎟' },
  { label: 'Natural Hair', query: 'natural', icon: '✦' },
  { label: 'Color & Balayage', query: 'color', icon: '◐' },
  { label: 'Updos & Events', query: 'updo', icon: '❀' },
  { label: 'Wash & Style', query: 'wash', icon: '~' },
  { label: 'Locs', query: 'loc', icon: '⟁' },
]

const TESTIMONIALS = [
  {
    quote: 'Booking my Saturday silk press takes 20 seconds now. The salons on MojoBooking are the only ones I trust.',
    name: 'Akua, 29',
    role: 'Brand manager · East Legon',
  },
  {
    quote: 'Found my forever stylist through MojoBooking. The reviews are honest — exactly what I needed.',
    name: 'Esi, 32',
    role: 'Lawyer · Cantonments',
  },
  {
    quote: 'I love that I can see real prices before I arrive. No more awkward conversations at the counter.',
    name: 'Yaa, 27',
    role: 'Doctor · Airport Residential',
  },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState([])

  useEffect(() => {
    let mounted = true
    api.listSalons().then((salons) => {
      if (!mounted) return
      const sorted = [...salons].sort((a, b) => b.rating - a.rating)
      setFeatured(sorted.slice(0, 6))
      setAreas([...new Set(salons.map((s) => s.area))].sort())
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="home fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">Premium salon directory · Accra</span>
            <h1>
              Find your <em>next</em> hair appointment <span className="hero__accent">in seconds.</span>
            </h1>
            <p className="hero__lede">
              A curated edit of Accra's best salons — for women who want consistent results,
              trusted stylists, and a booking experience that feels effortless.
            </p>

            <div className="hero__search">
              <SearchBar areas={areas} />
            </div>

            <div className="hero__pills">
              <span className="text-muted" style={{ fontSize: 13 }}>Popular:</span>
              {CATEGORIES.slice(0, 4).map((c) => (
                <Link key={c.label} to={`/search?search=${encodeURIComponent(c.query)}`} className="chip">
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="hero__stats">
              <div>
                <strong>40+</strong>
                <span>vetted salons</span>
              </div>
              <div>
                <strong>4.8★</strong>
                <span>avg. rating</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>instant booking</span>
              </div>
            </div>
          </div>

          <div className="hero__media" aria-hidden="true">
            <div className="hero__media-card hero__media-card--1">
              <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600" alt="" />
            </div>
            <div className="hero__media-card hero__media-card--2">
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600" alt="" />
            </div>
            <div className="hero__media-card hero__media-card--3">
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600" alt="" />
            </div>
            <div className="hero__media-badge">
              <span className="hero__media-badge-dot" />
              Live availability
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Browse by what you want</h2>
            <Link to="/search" className="link-underline">See all salons →</Link>
          </div>
          <div className="categories">
            {CATEGORIES.map((c) => (
              <Link key={c.label} to={`/search?search=${encodeURIComponent(c.query)}`} className="category-card">
                <span className="category-card__icon" aria-hidden="true">{c.icon}</span>
                <span className="category-card__label">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured salons */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <h2>Top-rated this month</h2>
              <p className="text-muted" style={{ marginTop: 8 }}>
                The salons our community keeps coming back to.
              </p>
            </div>
            <Link to="/search" className="btn btn-ghost">View all</Link>
          </div>

          {loading ? (
            <div className="salon-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 0 }} />
                  <div style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="salon-grid">
              {featured.map((s) => <SalonCard key={s.id} salon={s} />)}
            </div>
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="section">
        <div className="container values">
          <div className="value">
            <div className="value__icon" aria-hidden="true">✓</div>
            <h3>Hand-picked, never random</h3>
            <p>Every salon is vetted for service quality, hygiene and stylist skill. We say no often.</p>
          </div>
          <div className="value">
            <div className="value__icon" aria-hidden="true">⏱</div>
            <h3>Real prices, real durations</h3>
            <p>No surprises at the counter. See exactly what you'll pay and how long it will take.</p>
          </div>
          <div className="value">
            <div className="value__icon" aria-hidden="true">★</div>
            <h3>Reviews you can trust</h3>
            <p>Only verified clients can review, so what you read is what you'll get.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section section--tinted">
        <div className="container">
          <h2 style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--s-10)' }}>
            Loved by women who refuse to settle for an average appointment.
          </h2>
          <div className="testimonials">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="testimonial card">
                <blockquote>"{t.quote}"</blockquote>
                <figcaption>
                  <strong>{t.name}</strong>
                  <span className="text-muted">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div>
              <h2>Ready to book?</h2>
              <p style={{ marginTop: 8, maxWidth: 460 }}>
                Pick your salon, your stylist, and your time. We'll handle the rest.
              </p>
            </div>
            <Link to="/search" className="btn btn-primary btn-lg">Find a salon</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
