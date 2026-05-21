import './RatingStars.css'

export default function RatingStars({ rating = 0, count, size = 'sm', showNumber = true }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className={`rating rating--${size}`} aria-label={`Rated ${rating} out of 5`}>
      <span className="rating__stars" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFull = i < full
          const isHalf = i === full && half
          return (
            <svg key={i} viewBox="0 0 20 20" className={`rating__star ${isFull || isHalf ? 'is-on' : ''}`}>
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.5l2.7 5.46 6.03.88-4.36 4.25 1.03 6L10 15.27l-5.4 2.83 1.03-6L1.27 7.84l6.03-.88L10 1.5z"
                fill={isFull ? 'currentColor' : isHalf ? `url(#half-${i})` : 'none'}
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          )
        })}
      </span>
      {showNumber && <span className="rating__number">{rating.toFixed(1)}</span>}
      {count != null && <span className="rating__count">({count.toLocaleString()})</span>}
    </span>
  )
}
