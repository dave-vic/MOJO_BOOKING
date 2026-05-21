import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBar.css'

export default function SearchBar({ initialQuery = '', initialArea = 'All', areas = [] }) {
  const [query, setQuery] = useState(initialQuery)
  const [area, setArea] = useState(initialArea)
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (area && area !== 'All') params.set('area', area)
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <div className="search-bar__field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="search-bar__input"
          placeholder="Search salons, services or stylists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
      </div>

      <div className="search-bar__divider" />

      <div className="search-bar__field search-bar__field--select">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <select
          className="search-bar__input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          aria-label="Area"
        >
          <option value="All">All of Accra</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary search-bar__submit">
        Search
      </button>
    </form>
  )
}
