import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container fade-in" style={{ padding: 'var(--s-20) 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(64px, 10vw, 120px)', lineHeight: 1 }}>404</h1>
      <h2 style={{ marginTop: 12 }}>This page got a bad blowout.</h2>
      <p className="text-muted" style={{ marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
        Whatever you were looking for, it's not here. Try heading home or browsing our salons.
      </p>
      <div style={{ marginTop: 28, display: 'inline-flex', gap: 12 }}>
        <Link to="/" className="btn btn-ghost">Go home</Link>
        <Link to="/search" className="btn btn-primary">Browse salons</Link>
      </div>
    </div>
  )
}
