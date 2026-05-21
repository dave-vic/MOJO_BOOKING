import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { formatPrice } from '../api.js'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

const ACCRA_CENTER = [5.6037, -0.1870]

/** Builds the popup HTML shown on hover.
 *  @param {string}  image      - src URL
 *  @param {boolean} roundImage - true for stylist avatar (circle)
 */
function makePopupHtml(image, roundImage, title, subtitle, price) {
  return `<div class="mhp">
    ${image ? `<img class="mhp__img${roundImage ? ' mhp__img--round' : ''}" src="${image}" alt="" />` : ''}
    <div class="mhp__body">
      <strong class="mhp__title">${title}</strong>
      ${subtitle ? `<span class="mhp__sub">${subtitle}</span>` : ''}
      ${price    ? `<span class="mhp__price">${price}</span>`  : ''}
    </div>
  </div>`
}

const POPUP_OPTS = {
  closeButton: false,
  className: 'map-hover-popup',
  offset: [0, -6],
  autoPan: false,
}

export default function MapView({ salons, activeId, onSelect, hoveredPopup }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef({})

  // Keep onSelect stable inside event closures
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // ── Initialize map once ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: ACCRA_CENTER,
      zoom: 12,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' +
          ' &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = {}
    }
  }, [])

  // ── Sync markers whenever salons / activeId change ───────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    salons.forEach((salon) => {
      if (!salon.lat || !salon.lng) return

      const price = salon.featuredServices?.length
        ? Math.min(...salon.featuredServices.map((sv) => sv.price))
        : null
      const priceLabel = price != null ? formatPrice(price) : salon.area
      const isActive   = salon.id === activeId

      const icon = L.divIcon({
        className: '',
        html: `<div class="map-pin${isActive ? ' map-pin--active' : ''}">${priceLabel}</div>`,
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([salon.lat, salon.lng], { icon }).addTo(map)

      // Click → toggle active
      marker.on('click', () =>
        onSelectRef.current(salon.id === activeId ? null : salon.id)
      )

      // Hover on the pin itself → show name + price popup
      marker.on('mouseover', () => {
        const html = makePopupHtml(
          salon.image,
          false,
          salon.name,
          salon.area,
          price != null ? `From ${formatPrice(price)}` : null
        )
        marker.bindPopup(html, POPUP_OPTS).openPopup()
      })
      marker.on('mouseout', () => marker.closePopup())

      markersRef.current[salon.id] = marker
    })
  }, [salons, activeId])

  // ── Sidebar card hover → open popup on the matching pin ─────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.closePopup()
    if (!hoveredPopup) return

    const marker = markersRef.current[hoveredPopup.salonId]
    if (marker) {
      marker.bindPopup(hoveredPopup.html, POPUP_OPTS).openPopup()
    }
  }, [hoveredPopup])

  // ── Fly to active salon ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeId) return
    const salon = salons.find((s) => s.id === activeId)
    if (salon?.lat && salon?.lng) {
      map.flyTo([salon.lat, salon.lng], 15, { duration: 0.7 })
    }
  }, [activeId, salons])

  return <div ref={containerRef} className="map-container" />
}
