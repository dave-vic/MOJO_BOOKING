import { Link } from 'react-router-dom'
import RatingStars from './RatingStars.jsx'
import { formatPrice } from '../api.js'
import './SalonCard.css'

export default function SalonCard({ salon }) {
  const startingPrice =
    salon.featuredServices?.length
      ? Math.min(...salon.featuredServices.map((s) => s.price))
      : null

  return (
    <Link to={`/salons/${salon.id}`} className="salon-card card fade-in">
      <div className="salon-card__media">
        <img src={salon.image} alt={salon.name} loading="lazy" />
        <span className="salon-card__area chip">{salon.area}</span>
      </div>
      <div className="salon-card__body">
        <div className="salon-card__head">
          <h3 className="salon-card__name">{salon.name}</h3>
          <RatingStars rating={salon.rating} count={salon.reviewsCount} />
        </div>
        <p className="salon-card__address text-muted">{salon.address}</p>

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
          <span className="salon-card__cta">View & book →</span>
        </div>
      </div>
    </Link>
  )
}
