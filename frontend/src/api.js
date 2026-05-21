// In dev, Vite proxies /api → localhost:5001.
// In production, set VITE_API_URL to your deployed backend URL.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const e = new Error(err.message || `Request failed: ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export const api = {
  listSalons: ({ search, area, type } = {}) => {
    const qs = new URLSearchParams(
      Object.entries({ search, area, type }).filter(([, v]) => v != null && v !== '')
    ).toString();
    return request(`/salons${qs ? `?${qs}` : ''}`);
  },
  getSalon: (id) => request(`/salons/${id}`),
  lockSlot: (payload) =>
    request('/bookings/lock', { method: 'POST', body: JSON.stringify(payload) }),
  createBooking: (payload) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
};

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(amount);
}
