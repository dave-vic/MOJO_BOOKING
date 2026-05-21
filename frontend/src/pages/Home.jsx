import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import SalonCard from '../components/SalonCard.jsx'
import './Home.css'

/* ─── Static data ────────────────────────────────────────────── */

const CATEGORIES = [
  { label: 'Braids',           query: 'braids',    count: '12 venues', icon: <IconBraids /> },
  { label: 'Natural Hair',     query: 'natural',   count: '8 venues',  icon: <IconNatural /> },
  { label: 'Color',            query: 'color',     count: '6 venues',  icon: <IconColor /> },
  { label: 'Locs',             query: 'loc',       count: '7 venues',  icon: <IconLocs /> },
  { label: 'Haircut & Fade',   query: 'fade',      count: '3 shops',   icon: <IconFade /> },
  { label: 'Beard & Shape',    query: 'beard',     count: '3 shops',   icon: <IconBeard /> },
  { label: 'Wash & Style',     query: 'wash',      count: '10 venues', icon: <IconWash /> },
  { label: "Kids' Cuts",       query: 'kids',      count: '4 venues',  icon: <IconKids /> },
]

const MARQUEE_SALONS = [
  { name: 'Kai Beauty Studio',    area: 'East Legon', rating: '4.9', type: 'salon' },
  { name: 'The Fade Room',        area: 'East Legon', rating: '4.8', type: 'barbershop' },
  { name: 'Beauty Technicians',   area: 'Ayawaso',    rating: '4.9', type: 'salon' },
  { name: 'Prestige Cuts',        area: 'Osu',        rating: '4.7', type: 'barbershop' },
  { name: 'Twists & Locs',        area: 'East Legon', rating: '4.6', type: 'salon' },
  { name: '1957 Grooming',        area: 'Weija',      rating: '4.9', type: 'barbershop' },
  { name: 'Nalabi Hair & Beauty', area: 'Ayawaso',    rating: '4.8', type: 'salon' },
  { name: 'Blomii Hair Spa',      area: 'Kpeshie',    rating: '4.8', type: 'salon' },
]

const TRUST_ITEMS = [
  { icon: <IconShield />,    label: 'Hand-vetted venues only' },
  { icon: <IconPrice />,     label: 'Prices shown upfront' },
  { icon: <IconMomo />,      label: 'Secure MoMo deposits' },
  { icon: <IconReview />,    label: 'Verified-client reviews' },
  { icon: <IconInstant />,   label: 'Instant confirmation' },
]

const LOOKBOOK = [
  {
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=90&w=700&h=900',
    style: 'Knotless Box Braids',
    query: 'braids',
    span: 'tall',
  },
  {
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=700&h=500',
    style: 'Silk Press',
    query: 'wash',
    span: '',
  },
  {
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=90&w=700&h=500',
    style: 'Natural Twist-out',
    query: 'natural',
    span: '',
  },
  {
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=1000&h=500',
    style: 'Color & Highlights',
    query: 'color',
    span: 'wide',
  },
]

const AREAS = [
  {
    name: 'East Legon',
    count: '2 salons',
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=800',
    query: 'East Legon',
  },
  {
    name: 'Labone',
    count: '2 salons',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=800',
    query: 'Labone',
  },
  {
    name: 'Airport Residential',
    count: '1 salon',
    img: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=800',
    query: 'Airport Residential',
  },
  {
    name: 'Accra Central',
    count: '1 salon',
    img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=800',
    query: 'Accra Central',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find your style',
    body: 'Browse hand-picked salons by service, area, or stylist. Real photos, honest reviews, upfront prices.',
  },
  {
    step: '02',
    title: 'Pick your slot',
    body: 'Live availability — see exactly which days and times work. Select your stylist, confirm your service.',
  },
  {
    step: '03',
    title: 'Secure with MoMo',
    body: 'A small MoMo deposit locks your appointment. Pay the balance at the salon. Zero surprises.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Booking my Saturday silk press takes 20 seconds now. The salons on MojoBooking are the only ones I trust.',
    name: 'Akua M.',
    role: 'Brand manager · East Legon',
    initials: 'AM',
  },
  {
    quote: 'Found my forever stylist here. The reviews are honest — exactly what I needed before trying somewhere new.',
    name: 'Esi A.',
    role: 'Lawyer · Cantonments',
    initials: 'EA',
  },
  {
    quote: 'I love seeing real prices before I arrive. No more awkward conversations at the counter.',
    name: 'Yaa O.',
    role: 'Doctor · Airport Residential',
    initials: 'YO',
  },
]

const RECENT_BOOKINGS = [
  { name: 'Akua',  service: 'Box Braids',   salon: 'Kai Beauty Studio',    time: 'just now' },
  { name: 'Esi',   service: 'Silk Press',    salon: 'Beauty Technicians',   time: '3 min ago' },
  { name: 'Yaa',   service: 'Locs Retwist', salon: 'Twists & Locs',        time: '7 min ago' },
  { name: 'Abena', service: 'Color & Cut',  salon: 'Nalabi Hair & Beauty',  time: '11 min ago' },
  { name: 'Adwoa', service: 'Wash & Style', salon: 'Blomii Hair Spa',       time: '14 min ago' },
]

/* ─── Page component ─────────────────────────────────────────── */

export default function Home() {
  const [featured, setFeatured]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    api.listSalons()
      .then((salons) => {
        if (!alive) return
        setFeatured([...salons].sort((a, b) => b.rating - a.rating).slice(0, 3))
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => { alive = false }
  }, [])

  return (
    <div className="home fade-in">

      {/* ── HERO ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero__blob hero__blob--1" aria-hidden="true" />
        <div className="hero__blob hero__blob--2" aria-hidden="true" />

        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="hero__eyebrow">Accra's premier hair & grooming directory</p>

            <h1>
              Your next great<br />
              <em>hair day</em> starts here.
            </h1>

            <p className="hero__lede">
              Hand-picked salons and barbershops, trusted stylists and barbers,
              instant booking — all in one place.
            </p>

            <form
              className="hero__search-form"
              onSubmit={(e) => {
                e.preventDefault()
                navigate(query ? `/search?search=${encodeURIComponent(query)}` : '/search')
              }}
            >
              <div className="hero__search-bar">
                <svg className="hero__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className="hero__search-input"
                  type="text"
                  placeholder="Search salons, barbers, services, areas…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                />
                <button type="submit" className="btn btn-primary hero__search-btn">
                  Search
                </button>
              </div>
            </form>

            <div className="hero__trending">
              <span className="hero__trending-label">Popular:</span>
              {CATEGORIES.slice(0, 4).map((c) => (
                <Link key={c.label} to={`/search?search=${encodeURIComponent(c.query)}`} className="hero__trend-pill">
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <strong>40+</strong>
                <span>vetted salons</span>
              </div>
              <div className="hero__stat-sep" />
              <div className="hero__stat">
                <strong>4.8★</strong>
                <span>avg. rating</span>
              </div>
              <div className="hero__stat-sep" />
              <div className="hero__stat">
                <strong>2 min</strong>
                <span>to book</span>
              </div>
            </div>
          </div>

          <div className="hero__visuals" aria-hidden="true">
            <div className="hero__img-card hero__img-card--a">
              <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=640" alt="" />
            </div>
            <div className="hero__img-card hero__img-card--b">
              <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=560" alt="" />
              <div className="hero__live-badge">
                <span className="hero__live-dot" />
                Live availability
              </div>
            </div>
            <div className="hero__img-card hero__img-card--c">
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=480" alt="" />
            </div>
            <div className="hero__confirm-card">
              <div className="hero__confirm-avatar">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=90&w=80" alt="" />
              </div>
              <div className="hero__confirm-info">
                <strong>Booking confirmed</strong>
                <span>Sat 10:00 AM · Silk Press</span>
              </div>
              <div className="hero__confirm-check">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────── */}
      <div className="marquee-band" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE_SALONS, ...MARQUEE_SALONS].map((s, i) => (
            <div key={i} className="marquee-item">
              <span className="marquee-item__dot" />
              <span className="marquee-item__name">{s.name}</span>
              <span className={`marquee-item__type marquee-item__type--${s.type}`}>
                {s.type === 'barbershop' ? '✂ Barbershop' : '✦ Salon'}
              </span>
              <span className="marquee-item__area">{s.area}</span>
              <span className="marquee-item__rating">★ {s.rating}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ───────────────────────────── */}
      <section className="sec-categories">
        <div className="container">
          <div className="sec-head">
            <h2>What are you looking for?</h2>
            <Link to="/search" className="sec-head__link">View all salons →</Link>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <Link key={c.label} to={`/search?search=${encodeURIComponent(c.query)}`} className="cat-card">
                <span className="cat-card__icon">{c.icon}</span>
                <span className="cat-card__label">{c.label}</span>
                <span className="cat-card__count">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────── */}
      <div className="trust-band">
        <div className="container">
          <div className="trust-strip">
            {TRUST_ITEMS.map((t, i) => (
              <div key={i} className="trust-item">
                <span className="trust-item__icon">{t.icon}</span>
                <span className="trust-item__label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED ─────────────────────────────── */}
      <section className="sec-featured">
        <div className="container">
          <div className="sec-head">
            <div>
              <h2>Top-rated this month</h2>
              <p className="text-muted" style={{ marginTop: 6, fontSize: 15 }}>
                The salons our community keeps coming back to.
              </p>
            </div>
            <Link to="/search" className="btn btn-ghost">View all</Link>
          </div>

          {loading ? (
            <div className="salon-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ overflow: 'hidden' }}>
                  <div className="skeleton" style={{ aspectRatio: '16/10', borderRadius: 0 }} />
                  <div style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 13, width: '40%' }} />
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

      {/* ── LOOKBOOK ─────────────────────────────── */}
      <section className="sec-lookbook">
        <div className="container">
          <div className="lookbook-intro">
            <div>
              <p className="how-eyebrow">Get inspired</p>
              <h2>Browse looks.<br /><em>Then book who can recreate them.</em></h2>
            </div>
            <Link to="/search" className="btn btn-ghost hide-mobile">Explore all styles</Link>
          </div>

          <div className="lookbook-grid">
            {LOOKBOOK.map((look) => (
              <Link
                key={look.style}
                to={`/search?search=${encodeURIComponent(look.query)}`}
                className={`look-card look-card--${look.span || 'normal'}`}
              >
                <img src={look.img} alt={look.style} loading="lazy" />
                <div className="look-card__overlay" />
                <div className="look-card__body">
                  <span className="look-card__style">{look.style}</span>
                  <span className="look-card__cta">Book this look →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="sec-how">
        <div className="container">
          <div className="how-intro">
            <p className="how-eyebrow">The process</p>
            <h2>Book in under 2 minutes.</h2>
          </div>
          <div className="how-steps">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="how-step">
                <div className="how-step__num">{s.step}</div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="how-step__connector" aria-hidden="true" />
                )}
                <h3 className="how-step__title">{s.title}</h3>
                <p className="how-step__body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AREA BROWSE ──────────────────────────── */}
      <section className="sec-areas">
        <div className="container">
          <div className="sec-head">
            <div>
              <h2>Find salons near you</h2>
              <p className="text-muted" style={{ marginTop: 6, fontSize: 15 }}>
                Browse by neighbourhood across Accra.
              </p>
            </div>
          </div>
          <div className="area-bento">
            {AREAS.map((a) => (
              <Link
                key={a.name}
                to={`/search?search=${encodeURIComponent(a.query)}`}
                className="area-card"
              >
                <img src={a.img} alt={a.name} loading="lazy" className="area-card__img" />
                <div className="area-card__overlay" />
                <div className="area-card__body">
                  <strong className="area-card__name">{a.name}</strong>
                  <span className="area-card__count">{a.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section className="sec-testimonials">
        <div className="container">
          <h2 className="testimonials-hed">
            Loved by women who<br /><em>refuse average appointments.</em>
          </h2>
          <div className="tcard-grid">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="tcard">
                <div className="tcard__mark">"</div>
                <blockquote className="tcard__quote">{t.quote}</blockquote>
                <figcaption className="tcard__author">
                  <div className="tcard__avatar">{t.initials}</div>
                  <div className="tcard__author-info">
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="sec-cta">
        <div className="container">
          <div className="cta-band">
            <div className="cta-band__glow" aria-hidden="true" />
            <div className="cta-band__copy">
              <h2>Ready to book your next appointment?</h2>
              <p>Pick your salon, your stylist, and your time. We'll handle the rest.</p>
            </div>
            <Link to="/search" className="btn btn-primary btn-lg cta-band__btn">
              Find a salon
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE BOOKING TOAST ───────────────────── */}
      <LiveToast bookings={RECENT_BOOKINGS} />

    </div>
  )
}

/* ─── Live booking toast ─────────────────────────────────────── */
function LiveToast({ bookings }) {
  const [idx, setIdx]         = useState(0)
  const [phase, setPhase]     = useState('hidden') // hidden | entering | visible | leaving
  const timerRef              = useRef(null)

  useEffect(() => {
    // First appearance after 4 s
    timerRef.current = setTimeout(() => setPhase('entering'), 4000)
    return () => clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)

    if (phase === 'entering') {
      timerRef.current = setTimeout(() => setPhase('visible'), 20)
    } else if (phase === 'visible') {
      timerRef.current = setTimeout(() => setPhase('leaving'), 4200)
    } else if (phase === 'leaving') {
      timerRef.current = setTimeout(() => {
        setIdx((i) => (i + 1) % bookings.length)
        setPhase('hidden')
      }, 400)
    } else if (phase === 'hidden') {
      timerRef.current = setTimeout(() => setPhase('entering'), 5000)
    }
    return () => clearTimeout(timerRef.current)
  }, [phase, bookings.length])

  if (phase === 'hidden') return null

  const b = bookings[idx]
  return (
    <div className={`live-toast live-toast--${phase}`} role="status" aria-live="polite">
      <div className="live-toast__dot" />
      <div className="live-toast__body">
        <span className="live-toast__action">
          <strong>{b.name}</strong> just booked <strong>{b.service}</strong>
        </span>
        <span className="live-toast__meta">{b.salon} · {b.time}</span>
      </div>
    </div>
  )
}

/* ─── SVG icons ──────────────────────────────────────────────── */
function IconBraids() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2 C10 6 14 10 12 14 C10 18 12 22 12 22" />
      <path d="M8 4 C6 8 10 12 8 16 C6 20 8 22 8 22" />
      <path d="M16 4 C14 8 18 12 16 16 C14 20 16 22 16 22" />
    </svg>
  )
}
function IconNatural() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22 C12 22 4 16 4 9 A8 8 0 0 1 20 9 C20 16 12 22 12 22Z" />
      <path d="M12 22 L12 10" />
    </svg>
  )
}
function IconColor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 4-5 8-5 8S7 11 7 7a5 5 0 0 1 5-5z" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconUpdo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20 C6 16 18 16 18 20" />
      <path d="M12 12 L12 16" />
    </svg>
  )
}
function IconWash() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 C4 7 8 4 12 4 C16 4 20 7 20 12 L20 16 C20 18 18 20 16 20 L8 20 C6 20 4 18 4 16Z" />
      <path d="M9 9 C9 9 10 11 12 11 C14 11 15 9 15 9" />
    </svg>
  )
}
function IconLocs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 2 C8 6 10 10 9 14 C8 18 9 22 9 22" />
      <path d="M12 2 C11 7 13 11 12 16 C11 19 12 22 12 22" />
      <path d="M15 2 C14 6 16 10 15 14 C14 18 15 22 15 22" />
    </svg>
  )
}
function IconFade() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 L6 15 A3 3 0 1 0 9 15 L9 3" />
      <path d="M15 9 L21 15 A3 3 0 1 1 18 18 L12 12" />
      <line x1="6" y1="9" x2="9" y2="9" />
    </svg>
  )
}
function IconBeard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8 C5 5 8 3 12 3 C16 3 19 5 19 8" />
      <path d="M5 8 C4 12 5 16 7 18 C9 21 12 22 12 22 C12 22 15 21 17 18 C19 16 20 12 19 8" />
      <path d="M9 12 C9 14 10 15 12 15 C14 15 15 14 15 12" />
    </svg>
  )
}
function IconKids() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21 C5 17.5 8 15 12 15 C16 15 19 17.5 19 21" />
      <path d="M9 7 C9 5 10 4 12 4" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L20 6 L20 12 C20 17 12 22 12 22 C12 22 4 17 4 12 L4 6 Z" />
      <path d="M9 12 l2 2 4-4" />
    </svg>
  )
}
function IconPrice() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h4.5a1.5 1.5 0 0 1 0 3H9m6 3H9" />
      <line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  )
}
function IconMomo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconReview() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconInstant() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 L4.5 13.5 H11 L10 22 L19.5 10.5 H13 Z" />
    </svg>
  )
}
