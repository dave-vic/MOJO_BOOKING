// In dev, Vite proxies /api → localhost:5001.
// In production, set VITE_API_URL to your deployed backend URL.
const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('mj_token');
}

async function request(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  // Venues
  listSalons: ({ search, area, type } = {}) => {
    const qs = new URLSearchParams(
      Object.entries({ search, area, type }).filter(([, v]) => v != null && v !== '')
    ).toString();
    return request(`/salons${qs ? `?${qs}` : ''}`);
  },
  getSalon: (id) => request(`/salons/${id}`),

  // Availability
  getAvailability: (salonId, { stylistId, date, serviceId } = {}) => {
    const qs = new URLSearchParams(
      Object.entries({ stylistId, date, serviceId }).filter(([, v]) => v)
    ).toString();
    return request(`/salons/${salonId}/availability${qs ? `?${qs}` : ''}`);
  },

  // Bookings
  lockSlot: (payload) =>
    request('/bookings/lock', { method: 'POST', body: JSON.stringify(payload) }),
  createBooking: (payload) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () =>
    request('/bookings/my'),

  // Auth
  sendOtp: (phone) =>
    request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
};

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(amount);
}
