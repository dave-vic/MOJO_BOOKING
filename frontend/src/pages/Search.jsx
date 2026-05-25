import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, Map as MapIcon } from 'lucide-react'
import { api, formatPrice } from '../api.js'
import SalonCard from '../components/SalonCard.jsx'
import MapView from '../components/MapView.jsx'
import RatingStars from '../components/RatingStars.jsx'
import './Search.css'

export default function Search() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [allSalons, setAllSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('rating')
  // Default to map on all screen sizes
  const [viewMode, setViewMode] = useState('map')
  const [mapTab, setMapTab] = useState('salons')    // 'salons' | 'stylists'
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [activeId, setActiveId] = useState(null)      // active salon id on map
  const [hoveredPopup, setHoveredPopup] = useState(null) // { salonId, html }
  const activeCardRef = useRef(null)

  const search = params.get('search') || ''
  const area   = params.get('area')   || 'All'
  const type   = params.get('type')   || 'all'

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.listSalons({ search, area: area === 'All' ? '' : area, type: type === 'all' ? '' : type })
      .then((data) => {
        if (!mounted) return
        setAllSalons(data)
        setError(null)
      })
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [search, area, type])

  const [allAreas, setAllAreas] = useState([])
  useEffect(() => {
    api.listSalons().then((all) => {
      setAllAreas([...new Set(all.map((s) => s.area))].sort())
    }).catch(() => {})
  }, [])

  const sortedSalons = useMemo(() => {
    const list = [...allSalons]
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'reviews') list.sort((a, b) => b.reviewsCount - a.reviewsCount)
    if (sort === 'price-low') {
      const minP = (s) => Math.min(...(s.featuredServices || []).map((x) => x.price))
      list.sort((a, b) => minP(a) - minP(b))
    }
    return list
  }, [allSalons, sort])

  // Flat list of all stylists with their salon reference for the map sidebar
  const allStylists = useMemo(() => {
    return sortedSalons.flatMap((s) =>
      (s.stylists || []).map((st) => ({
        ...st,
        salonId: s.id,
        salonName: s.name,
        salonArea: s.area,
        lat: s.lat,
        lng: s.lng,
      }))
    )
  }, [sortedSalons])

  // Scroll active sidebar card into view when selection changes
  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeId])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'All') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Shared view-mode toggle pill (used in both modes)
  const viewToggle = (
    <div className="view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        className={`view-toggle__btn${viewMode === 'grid' ? ' is-active' : ''}`}
        title="Grid view"
      >
        <LayoutGrid size={15} strokeWidth={2.2} />
        <span>Grid</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode('map')}
        className={`view-toggle__btn${viewMode === 'map' ? ' is-active' : ''}`}
        title="Map view"
      >
        <MapIcon size={15} strokeWidth={2.2} />
        <span>Map</span>
      </button>
    </div>
  )

  /* ─── MAP MODE ─── */
  if (viewMode === 'map') {
    return (
      <div className="search-page is-map">
        <div className="search-map-layout">

          {/* ── Left sidebar / bottom sheet ── */}
          <div className={`search-map-sidebar${sheetExpanded ? ' is-expanded' : ''}`}>

            {/* Bottom-sheet header — mobile only */}
            <div className="sheet-header">
              <span className="sheet-handle-bar" />
              <div className="sheet-header-row">
                <button
                  type="button"
                  className="sheet-header-count"
                  onClick={() => setSheetExpanded(e => !e)}
                  aria-label={sheetExpanded ? 'Collapse list' : 'Expand list'}
                >
                  <svg className={`sheet-handle-chevron${sheetExpanded ? ' is-up' : ''}`} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                  {loading ? 'Searching…' : `${sortedSalons.length} venue${sortedSalons.length !== 1 ? 's' : ''} nearby`}
                </button>
                {viewToggle}
              </div>
            </div>

            {/* Compact filter bar */}
            <div className="search-map-topbar">
              <input
                className="input search-map-input"
                placeholder="Salon, barber, service, stylist…"
                value={search}
                onChange={(e) => setParam('search', e.target.value)}
              />
              {/* Type filter */}
              <div className="search-map-filter-group">
                <span className="search-map-filter-label">Type</span>
                <div className="search-map-types">
                  {[
                    { key: 'all',        label: 'All' },
                    { key: 'salon',      label: '✦ Hair Salons' },
                    { key: 'barbershop', label: '✂ Barbershops' },
                    { key: 'freelance',  label: '👤 Freelance' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setParam('type', t.key)}
                      className={`chip${type === t.key ? ' chip-active' : ''}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              {/* Area filter */}
              <div className="search-map-filter-group">
                <span className="search-map-filter-label">Area</span>
                <div className="search-map-areas">
                  <button
                    type="button"
                    onClick={() => setParam('area', 'All')}
                    className={`chip${area === 'All' ? ' chip-active' : ''}`}
                  >All areas</button>
                  {allAreas.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setParam('area', a)}
                      className={`chip${area === a ? ' chip-active' : ''}`}
                    >{a}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab row: Salons | Stylists + view toggle */}
            <div className="search-map-tabrow">
              <div className="search-map-tabs">
                <button
                  type="button"
                  onClick={() => setMapTab('salons')}
                  className={`search-map-tab${mapTab === 'salons' ? ' is-active' : ''}`}
                >
                  Venues
                  <span className="search-map-tab__count">{sortedSalons.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapTab('stylists')}
                  className={`search-map-tab${mapTab === 'stylists' ? ' is-active' : ''}`}
                >
                  Staff
                  <span className="search-map-tab__count">{allStylists.length}</span>
                </button>
              </div>
              {viewToggle}
            </div>

            {/* Scrollable results list */}
            <div className="search-map-list">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="map-card-skeleton">
                    <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '65%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 11, width: '45%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 11, width: '55%' }} />
                    </div>
                  </div>
                ))
              ) : mapTab === 'salons' ? (
                sortedSalons.length === 0 ? (
                  <div className="search-map-empty">
                    <p>No salons match. <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>Clear filters</button></p>
                  </div>
                ) : sortedSalons.map((s) => {
                  const startPrice = s.featuredServices?.length
                    ? Math.min(...s.featuredServices.map((sv) => sv.price))
                    : null
                  const isActive = activeId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      ref={isActive ? activeCardRef : null}
                      className={`map-salon-card${isActive ? ' is-active' : ''}`}
                      onClick={() => setActiveId(isActive ? null : s.id)}
                      onMouseEnter={() => setHoveredPopup({
                        salonId: s.id,
                        html: `<div class="mhp">
                          <img class="mhp__img" src="${s.image}" alt="${s.name}" />
                          <div class="mhp__body">
                            <strong class="mhp__title">${s.name}</strong>
                            <span class="mhp__sub">${s.area}</span>
                            ${startPrice != null ? `<span class="mhp__price">From ${formatPrice(startPrice)}</span>` : ''}
                          </div>
                        </div>`,
                      })}
                      onMouseLeave={() => setHoveredPopup(null)}
                    >
                      <img src={s.image} alt={s.name} className="map-salon-card__img" />
                      <div className="map-salon-card__body">
                        <strong className="map-salon-card__name">{s.name}</strong>
                        <span className="map-salon-card__area">{s.area}</span>
                        <RatingStars rating={s.rating} count={s.reviewsCount} />
                        {startPrice != null && (
                          <span className="map-salon-card__price">
                            From {formatPrice(startPrice)}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/salons/${s.id}`}
                        className="map-salon-card__cta"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </button>
                  )
                })
              ) : (
                /* Staff tab (stylists + barbers) */
                allStylists.length === 0 ? (
                  <div className="search-map-empty">
                    <p>No staff match. <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>Clear filters</button></p>
                  </div>
                ) : allStylists.map((st) => {
                  const isActive = activeId === st.salonId
                  return (
                    <button
                      key={st.id}
                      type="button"
                      ref={isActive ? activeCardRef : null}
                      className={`map-stylist-card${isActive ? ' is-active' : ''}`}
                      onClick={() => {
                        setActiveId(isActive ? null : st.salonId)
                        const salon = sortedSalons.find((s) => s.id === st.salonId)
                        navigate(`/salons/${st.salonId}/book`, { state: { salon, stylist: st } })
                      }}
                      onMouseEnter={() => {
                        const salon = sortedSalons.find((s) => s.id === st.salonId)
                        const salonMinPrice = salon?.featuredServices?.length
                          ? Math.min(...salon.featuredServices.map((sv) => sv.price))
                          : null
                        setHoveredPopup({
                          salonId: st.salonId,
                          html: `<div class="mhp">
                            <img class="mhp__img mhp__img--round" src="${st.image}" alt="${st.name}" />
                            <div class="mhp__body">
                              <strong class="mhp__title">${st.name}</strong>
                              <span class="mhp__sub">${st.salonName}</span>
                              ${salonMinPrice != null ? `<span class="mhp__price">From ${formatPrice(salonMinPrice)}</span>` : ''}
                            </div>
                          </div>`,
                        })
                      }}
                      onMouseLeave={() => setHoveredPopup(null)}
                    >
                      <img
                        src={st.image}
                        alt={st.name}
                        className="map-stylist-card__avatar"
                      />
                      <div className="map-stylist-card__body">
                        <strong className="map-stylist-card__name">{st.name}</strong>
                        <span className="map-stylist-card__meta">{st.role} · {st.salonName}</span>
                        <div className="map-stylist-card__tags">
                          {st.specialties.slice(0, 2).map((sp) => (
                            <span key={sp} className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>{sp}</span>
                          ))}
                        </div>
                      </div>
                      <div className="map-stylist-card__right">
                        <span className="map-stylist-card__rating">★ {st.rating}</span>
                        <span className="map-stylist-card__book">Book →</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Map canvas ── */}
          <div className="search-map-canvas">
            <MapView
              salons={sortedSalons.filter((s) => s.lat && s.lng)}
              activeId={activeId}
              onSelect={setActiveId}
              hoveredPopup={hoveredPopup}
            />
          </div>
        </div>
      </div>
    )
  }

  /* ─── GRID MODE ─── */
  return (
    <div className="search-page fade-in">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          <span>Salons in Accra</span>
        </nav>

        <header className="search-page__header">
          <div>
            <h1>
              {search ? `Results for "${search}"` : 'Premium salons in Accra'}
            </h1>
            <p className="text-muted">
              {loading ? 'Searching…' : `${sortedSalons.length} salon${sortedSalons.length === 1 ? '' : 's'} found`}
              {area !== 'All' && ` in ${area}`}
            </p>
          </div>
          {viewToggle}
        </header>

        <div className="search-page__layout">
          <aside className="filters">
            <div className="filters__group">
              <h4>Search</h4>
              <input
                className="input"
                placeholder="Salon, service, stylist…"
                value={search}
                onChange={(e) => setParam('search', e.target.value)}
              />
            </div>

            <div className="filters__group">
              <h4>Type</h4>
              <div className="filters__chips">
                {[
                  { key: 'all',        label: 'All' },
                  { key: 'salon',      label: '✦ Hair Salons' },
                  { key: 'barbershop', label: '✂ Barbershops' },
                  { key: 'freelance',  label: '👤 Freelance' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setParam('type', t.key)}
                    className={`chip${type === t.key ? ' chip-active' : ''}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <h4>Area</h4>
              <div className="filters__chips">
                <button
                  type="button"
                  onClick={() => setParam('area', 'All')}
                  className={`chip${area === 'All' ? ' chip-active' : ''}`}
                >All</button>
                {allAreas.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setParam('area', a)}
                    className={`chip${area === a ? ' chip-active' : ''}`}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <h4>Sort by</h4>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rating">Highest rated</option>
                <option value="reviews">Most reviewed</option>
                <option value="price-low">Price: low to high</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => setParams({}, { replace: true })}
            >
              Clear filters
            </button>
          </aside>

          <section className="search-results">
            {error && (
              <div className="search-results__error">
                Sorry, we couldn't load salons right now. {error}
              </div>
            )}

            {loading ? (
              <div className="salon-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 0 }} />
                    <div style={{ padding: 20 }}>
                      <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                      <div className="skeleton" style={{ height: 12, width: '90%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedSalons.length === 0 ? (
              <div className="search-empty card">
                <h3>No salons match your search.</h3>
                <p style={{ marginTop: 8 }}>Try removing a filter or browsing all areas.</p>
                <button type="button" onClick={() => setParams({}, { replace: true })} className="btn btn-primary" style={{ marginTop: 16 }}>
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="salon-grid">
                {sortedSalons.map((s) => <SalonCard key={s.id} salon={s} />)}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Floating "Show map" button — mobile only */}
      <button
        type="button"
        className="search-fab search-fab--map"
        onClick={() => setViewMode('map')}
        aria-label="Show map"
      >
        <MapIcon size={16} strokeWidth={2.2} />
        Show map
      </button>
    </div>
  )
}
