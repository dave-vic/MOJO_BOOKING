import { Link } from 'react-router-dom'
import RatingStars from './RatingStars.jsx'
import { formatPrice } from '../api.js'
import './SalonCard.css'

const TYPE_LABEL = { barbershop: 'Barbershop', salon: 'Hair Salon', freelance: 'Freelance' }

export default function SalonCard({ salon }) {
  const startingPrice =
    salon.featuredServices?.length
      ? Math.min(...salon.featuredServices.map((s) => s.price))
      : null

  const isBarber = salon.type === 'barbershop'
  const isFreelance = salon.type === 'freelance'

  return (
    <Link to={`/salons/${salon.id}`} className="salon-card card fade-in">
      <div className="salon-card__media">
        <img src={salon.image} alt={salon.name} loading="lazy" />
        <span className="salon-card__area chip">{salon.area}</span>
        {salon.type && (
          <span className={`salon-card__type-badge${isBarber ? ' salon-card__type-badge--barber' : ''}${isFreelance ? ' salon-card__type-badge--freelance' : ''}`}>
            {isFreelance ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            ) : isBarber ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3 L6 15 A3 3 0 1 0 9 15 L9 3" />
                <path d="M15 9 L21 15 A3 3 0 1 1 18 18 L12 12" />
                <line x1="6" y1="9" x2="9" y2="9" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 C10 6 14 10 12 14 C10 18 12 22 12 22" />
                <path d="M8 4 C6 8 10 12 8 16" />
                <path d="M16 4 C14 8 18 12 16 16" />
              </svg>
            )}
            {TYPE_LABEL[salon.type] ?? salon.type}
          </span>
        )}
      </div>
      <div className="salon-card__body">
        <div className="salon-card__head">
          <h3 className="salon-card__name">{salon.name}</h3>
          <RatingStars rating={salon.rating} count={salon.reviewsCount} />
        </div>
        <p className="salon-card__address text-muted">
          {isFreelance ? salon.tagline : salon.address}
        </p>

        {salon.featuredServices?.length > 0 && (
          <ul className="salon-card__services">
            {salon.featuredServices.slice(0, 2).map((s) => (
              <li key={s.name}>
                <span className="salon-card__service-name">{s.name}</span>
                <span className="salon-card__service-meta">
                  {s.duration} · {formatPrice(s.price)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="salon-card__footer">
          {startingPrice != null && (
            <span className="salon-card__from">
              From <strong>{formatPrice(startingPrice)}</strong>
            </span>
          )}
          <span className="salon-card__cta">
            {isFreelance ? 'Book now →' : isBarber ? 'Book a cut →' : 'View & book →'}
          </span>
        </div>
      </div>
    </Link>
  )
}
