import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './Layout.css'

function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Link to="/" className="brand">
          <span className="brand__mark" aria-hidden="true">m</span>
          <span className="brand__wordmark">
            mojo<span className="brand__wordmark-accent">booking</span>
          </span>
        </Link>

        <nav className="site-nav hide-mobile" aria-label="Primary">
          <NavLink to="/search" className="site-nav__link link-underline">Browse salons</NavLink>
          <NavLink to="/search?category=Braids" className="site-nav__link link-underline">Braids</NavLink>
          <NavLink to="/search?category=Color" className="site-nav__link link-underline">Color</NavLink>
          <NavLink to="/search?category=Natural Hair" className="site-nav__link link-underline">Natural Hair</NavLink>
        </nav>

        <div className="site-header__actions">
          <Link to="/search" className="btn btn-light hide-mobile">Find a salon</Link>
          <Link to="/search" className="btn btn-primary">Book now</Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="brand brand--light">
            <span className="brand__mark" aria-hidden="true">m</span>
            <span className="brand__wordmark">
              mojo<span className="brand__wordmark-accent">booking</span>
            </span>
          </Link>
          <p className="text-muted" style={{ maxWidth: 320, marginTop: 12 }}>
            The premium salon directory for Accra. Discover stylists you trust, book in seconds, glow on schedule.
          </p>
        </div>

        <div className="site-footer__cols">
          <div>
            <h4 className="site-footer__heading">Explore</h4>
            <ul>
              <li><Link to="/search">All salons</Link></li>
              <li><Link to="/search?category=Braids">Braids</Link></li>
              <li><Link to="/search?category=Color">Color & balayage</Link></li>
              <li><Link to="/search?category=Natural Hair">Natural hair</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="site-footer__heading">For salons</h4>
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
        <span className="text-muted">© {new Date().getFullYear()} MojoBooking · Accra, Ghana</span>
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
