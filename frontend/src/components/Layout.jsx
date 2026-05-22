import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import './Layout.css'

/* Custom nav link — handles query-string aware active state */
function NavItem({ to, children, onClick }) {
  const { pathname, search } = useLocation()
  const [toPath, toQuery] = to.split('?')

  const isActive = (() => {
    if (pathname !== toPath) return false
    if (!toQuery) {
      // "Explore" — active only when no type filter is set
      return !search || !search.includes('type=')
    }
    return search.includes(toQuery)
  })()

  return (
    <Link
      to={to}
      className={`nav-link${isActive ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

const NAV_LINKS = [
  { to: '/search',                 label: 'Explore' },
  { to: '/search?type=salon',      label: 'Hair Salons' },
  { to: '/search?type=barbershop', label: 'Barbershops' },
  { to: '/search?search=braids',   label: 'Braids' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const userMenuRef = useRef(null)

  // Close drawer on navigation
  useEffect(() => setOpen(false), [pathname])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  return (
    <>
    <header className={`site-header${open ? ' nav-is-open' : ''}`}>
      <div className="container site-header__row">

        {/* ── Brand ── */}
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 17 Q2 3 10 3 Q18 3 18 17" stroke="rgba(255,255,255,0.28)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M5 17 Q5 8.5 10 8.5 Q15 8.5 15 17" stroke="rgba(255,255,255,0.60)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M8 17 Q8 13 10 13 Q12 13 12 17" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand__wordmark">
            mojo<em className="brand__accent">booking</em>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="site-nav" aria-label="Primary navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavItem key={to} to={to}>{label}</NavItem>
          ))}
        </nav>

        {/* ── Desktop actions ── */}
        <div className="site-header__actions">
          <a href="#join" className="nav-biz-link" aria-label="List your business">
            For businesses
          </a>
          <span className="nav-sep" aria-hidden="true" />

          {isAuthenticated ? (
            <div className="nav-user" ref={userMenuRef}>
              <button
                type="button"
                className="nav-user__btn"
                onClick={() => setUserMenuOpen(o => !o)}
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
              >
                <span className="nav-user__avatar">
                  {(user?.name || user?.phone || '?')[0].toUpperCase()}
                </span>
                <span className="nav-user__name">
                  {user?.name || 'My account'}
                </span>
                <svg className="nav-user__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {userMenuOpen && (
                <div className="nav-user__menu">
                  <Link to="/bookings" className="nav-user__menu-item" onClick={() => setUserMenuOpen(false)}>
                    My bookings
                  </Link>
                  <button type="button" className="nav-user__menu-item nav-user__menu-item--danger" onClick={() => { logout(); setUserMenuOpen(false) }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-nav"
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </button>
          )}

          <Link to="/search" className="btn btn-primary btn-nav">
            Book now
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="nav-burger"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
          >
            <span className="nav-burger__line" />
            <span className="nav-burger__line" />
            <span className="nav-burger__line" />
          </button>
        </div>

      </div>

      {/* ── Mobile drawer ── */}
      <div
        id="mobile-nav"
        className={`nav-drawer${open ? ' is-open' : ''}`}
        aria-hidden={!open}
      >
        <div className="container nav-drawer__body">
          <p className="nav-drawer__label">Browse</p>
          {NAV_LINKS.map(({ to, label }) => (
            <NavItem key={to} to={to} onClick={() => setOpen(false)}>
              <span className="nav-drawer__link-inner">{label}</span>
            </NavItem>
          ))}

          <div className="nav-drawer__divider" />

          <a href="#join" className="nav-drawer__biz" onClick={() => setOpen(false)}>
            For businesses
          </a>

          {isAuthenticated ? (
            <>
              <div className="nav-drawer__user">
                <span className="nav-user__avatar nav-user__avatar--sm">
                  {(user?.name || user?.phone || '?')[0].toUpperCase()}
                </span>
                <span className="nav-drawer__user-name">
                  {user?.name || user?.phone || 'My account'}
                </span>
              </div>
              <button
                type="button"
                className="nav-drawer__signout"
                onClick={() => { logout(); setOpen(false) }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-outline nav-drawer__cta"
              onClick={() => { setShowAuth(true); setOpen(false) }}
            >
              Sign in
            </button>
          )}

          <Link
            to="/search"
            className="btn btn-primary nav-drawer__cta"
            onClick={() => setOpen(false)}
          >
            Book now
          </Link>
        </div>
      </div>
    </header>

    {/* Auth modal — rendered outside <header> so backdrop-filter doesn't trap it */}
    {showAuth && (
      <AuthModal
        onSuccess={() => setShowAuth(false)}
        onClose={() => setShowAuth(false)}
      />
    )}
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="brand brand--light">
            <span className="brand__mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M2 17 Q2 3 10 3 Q18 3 18 17" stroke="rgba(255,255,255,0.28)" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M5 17 Q5 8.5 10 8.5 Q15 8.5 15 17" stroke="rgba(255,255,255,0.60)" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M8 17 Q8 13 10 13 Q12 13 12 17" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="brand__wordmark">
              mojo<em className="brand__accent">booking</em>
            </span>
          </Link>
          <p className="site-footer__tagline">
            The premium hair & grooming directory for Accra.
            Discover stylists you trust, book in seconds.
          </p>
        </div>

        <div className="site-footer__cols">
          <div>
            <h4 className="site-footer__heading">Explore</h4>
            <ul>
              <li><Link to="/search">All venues</Link></li>
              <li><Link to="/search?type=salon">Hair Salons</Link></li>
              <li><Link to="/search?type=barbershop">Barbershops</Link></li>
              <li><Link to="/search?search=braids">Braids</Link></li>
              <li><Link to="/search?search=fade">Fades & Cuts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="site-footer__heading">For businesses</h4>
            <ul>
              <li><a href="#join">Join MojoBooking</a></li>
              <li><a href="#partners">Partner program</a></li>
              <li><a href="#tools">Salon tools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="site-footer__heading">Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container site-footer__bottom">
        <span className="site-footer__copy">
          © {new Date().getFullYear()} MojoBooking · Accra, Ghana
        </span>
        <div className="site-footer__legal">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
