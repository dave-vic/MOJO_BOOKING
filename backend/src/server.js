const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Cancellation policy applies platform-wide (from MVP doc, S6/S8)
const CANCELLATION_POLICY = {
  fullRefundHoursBefore: 24,
  halfRefundHoursBefore: 6,
  description: [
    { window: '24+ hours before', refund: 'Full refund' },
    { window: '6–24 hours before', refund: '50% refund' },
    { window: 'Under 6 hours', refund: 'No refund' }
  ]
};

const DEPOSIT_PERCENT = 15; // ~GHS 53 on GHS 350, per the MVP journey
const PLATFORM_FEE_PERCENT = 4;

function calcDeposit(price) {
  const raw = price * (DEPOSIT_PERCENT / 100);
  return Math.max(20, Math.round(raw / 5) * 5);
}

// ── Auth stores ────────────────────────────────────────────────
const otpStore = new Map();   // phone → { otp, expiresAt }
const sessions = new Map();   // token → { phone, createdAt }

// ── Helpers ───────────────────────────────────────────────────
function normalizeGhanaPhone(raw) {
  const d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('233') && d.length === 12) return '+' + d;
  if (d.startsWith('0') && d.length === 10) return '+233' + d.slice(1);
  if (d.length === 9) return '+233' + d;
  return null;
}

function parseDurationMins(str) {
  const h = str?.match(/(\d+)\s*hr/);
  const m = str?.match(/(\d+)\s*min/);
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || 45;
}

async function sendSMS(to, message) {
  if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
    // Africa's Talking — no npm package needed, use native fetch
    const form = new URLSearchParams({ username: process.env.AT_USERNAME, to, message });
    const resp = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST', body: form.toString(),
      headers: {
        apiKey: process.env.AT_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (!resp.ok) console.error('AT SMS failed:', await resp.text());
  } else {
    // Dev fallback — log to console so you can see the OTP
    console.log(`\n📱 SMS → ${to}\n${message}\n`);
  }
}

// Mock Salon Data based on the Fresha reference for Accra
const salons = [
  {
    id: 'kai-beauty-studio',
    type: 'salon',
    name: 'Kai Beauty Studio',
    rating: 4.8,
    reviewsCount: 455,
    address: '10 Kinshasha Avenue, East Legon Residential Area, Accra',
    area: 'East Legon',
    lat: 5.6359, lng: -0.1553,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'kbs-s1', name: 'Home Service Hair Care', duration: '4 hr', price: 1200 },
      { id: 'kbs-s2', name: 'Textured Updo with Added Length', duration: '1 hr 15 min', price: 140 },
      { id: 'kbs-s3', name: 'Simple Textured Updo', duration: '1 hr', price: 100 }
    ],
    stylists: [
      {
        id: 'kbs-st1',
        name: 'Francisca M.',
        role: 'Senior Stylist',
        rating: 4.9,
        yearsExp: 8,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Natural hair', 'Textured updos', 'Home service'],
        serviceIds: ['kbs-s1', 'kbs-s2', 'kbs-s3']
      },
      {
        id: 'kbs-st2',
        name: 'Mina A.',
        role: 'Stylist',
        rating: 4.8,
        yearsExp: 5,
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Updos', 'Wash & style'],
        serviceIds: ['kbs-s2', 'kbs-s3']
      }
    ],
    about: 'At Kai Beauty Studio, we specialize in high-end haircare for natural and textured hair. Our salon in East Legon is designed as a sanctuary where premium service meets pain-free expertise.',
    reviews: [
      { author: 'Ereena S.', date: 'Dec 23, 2025', rating: 5, comment: 'As someone with very coarse natural hair, my experience at Kai Beauty Studio was the best care my hair has ever received in Accra. There was no tugging or pain, which has often been the case at other salons.' },
      { author: 'Aisha D.', date: 'Nov 7, 2025', rating: 5, comment: 'Fabulous experience at Kai Beauty Salon. The stylist that did it for me was Francisca; her hands are blessed and this is coming from someone that\'s tried several salons in Accra since 2000.' }
    ]
  },
  {
    id: 'beauty-technicians',
    type: 'salon',
    name: 'Beauty Technicians',
    rating: 4.9,
    reviewsCount: 2020,
    address: '102 Nii Nortei Nyanchi Street, Accra Ayawaso, Greater Accra Region',
    area: 'Ayawaso',
    lat: 5.6185, lng: -0.2012,
    // Warm salon styling session
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'bt-s1', name: 'Final Style Styling', duration: '1 hr', price: 100 },
      { id: 'bt-s2', name: 'Rod Set', duration: '3 hr', price: 450 },
      { id: 'bt-s3', name: 'Half up & Half down Ponytail on Relaxed hair', duration: '2 hr 30 min', price: 350 },
      { id: 'bt-s4', name: 'Trim', duration: '30 min', price: 100 }
    ],
    stylists: [
      {
        id: 'bt-st1',
        name: 'Joyce D.',
        role: 'Lead Stylist',
        rating: 4.95,
        yearsExp: 11,
        image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Rod sets', 'Cuts', 'Color'],
        serviceIds: ['bt-s1', 'bt-s2', 'bt-s3', 'bt-s4']
      },
      {
        id: 'bt-st2',
        name: 'Delali O.',
        role: 'Senior Stylist',
        rating: 4.9,
        yearsExp: 7,
        image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Styling', 'Wash & blow'],
        serviceIds: ['bt-s1', 'bt-s3', 'bt-s4']
      },
      {
        id: 'bt-st3',
        name: 'Olive K.',
        role: 'Curls Specialist',
        rating: 4.8,
        yearsExp: 6,
        image: 'https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Curls', 'Natural hair'],
        serviceIds: ['bt-s2', 'bt-s4']
      }
    ],
    about: 'Beauty Technicians is Accra\'s premier location for cutting-edge styles, vibrant colors, and deep hair treatments. Known for outstanding service and custom consultations.',
    reviews: [
      { author: 'Joyce D.', date: 'Feb 18, 2026', rating: 5, comment: 'Delali did a great job. I will go to her again during my time in Accra.' },
      { author: 'Eyra G.', date: 'Dec 24, 2025', rating: 5, comment: 'Olive was great with me, she gave me a style that suits my personality. Beauty Technicians has been the salon I\'ve been looking for to care for my curls.' }
    ]
  },
  {
    id: 'twists-locs-east-legon',
    type: 'salon',
    name: 'Twists & Locs - East Legon Branch',
    rating: 4.6,
    reviewsCount: 228,
    address: '7 Pineapple Loop, East Legon, Accra',
    area: 'East Legon',
    lat: 5.6416, lng: -0.1620,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'tl-s1', name: 'Bridal Hair consultation (Locs or Loose hair)', duration: '1 hr', price: 200 },
      { id: 'tl-s2', name: 'Wash & Dye (does not include product)', duration: '40 min', price: 100 },
      { id: 'tl-s3', name: 'VIP Service Add on', duration: '1 hr', price: 200 },
      { id: 'tl-s4', name: 'Hair trim (wet/ dry)', duration: '1 hr', price: 65 }
    ],
    stylists: [
      {
        id: 'tl-st1',
        name: 'Rashida B.',
        role: 'Locs Specialist',
        rating: 4.95,
        yearsExp: 10,
        image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Locs', 'Two-strand twists', 'Protein treatments'],
        serviceIds: ['tl-s1', 'tl-s3', 'tl-s4']
      },
      {
        id: 'tl-st2',
        name: 'Adwoa P.',
        role: 'Senior Stylist',
        rating: 4.7,
        yearsExp: 6,
        image: 'https://images.unsplash.com/photo-1612422656768-d5e4ec31fac0?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Wash & dye', 'Natural hair'],
        serviceIds: ['tl-s2', 'tl-s4']
      }
    ],
    about: 'Twists & Locs is a highly sought-after natural hair salon brand. Our East Legon branch offers full-service natural hair care, from loc installations to creative braiding and deep hydration treatments.',
    reviews: [
      { author: 'Wonu O.', date: 'Jan 13, 2026', rating: 5, comment: 'Great service, really efficient and I liked how they consulted with me about the products they wished to use for my chosen hair style.' },
      { author: 'Akosua A.', date: 'Jul 10, 2025', rating: 5, comment: 'Lovely service by Rashida from start to finish! She did beautiful two strand twists as the style, trimmed my hair wet, did a protein treatment, and washed my hair; it was so relaxing and soothing!' }
    ]
  },
  {
    id: 'nalabi-hair-beauty',
    type: 'salon',
    name: 'Nalabi Hair and Beauty',
    rating: 4.8,
    reviewsCount: 131,
    address: 'Nalabi Hair and Beauty, Blohum Road, Accra Ayawaso, Greater Accra Region',
    area: 'Ayawaso',
    lat: 5.6231, lng: -0.1978,
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'nh-s1', name: 'Glamour Waves on Natural Hair', duration: '1 hr 30 min', price: 300 },
      { id: 'nh-s2', name: 'Ponytail Style', duration: '1 hr 30 min', price: 450 },
      { id: 'nh-s3', name: 'Classic Up-Do Styling', duration: '1 hr 30 min', price: 450 },
      { id: 'nh-s4', name: 'Waves styling', duration: '45 min', price: 300 }
    ],
    stylists: [
      {
        id: 'nh-st1',
        name: 'Nadia L.',
        role: 'Lead Stylist',
        rating: 4.9,
        yearsExp: 9,
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Updos', 'Sew-ins', 'Steam treatments'],
        serviceIds: ['nh-s1', 'nh-s2', 'nh-s3', 'nh-s4']
      },
      {
        id: 'nh-st2',
        name: 'Abena F.',
        role: 'Stylist',
        rating: 4.7,
        yearsExp: 4,
        image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Glamour waves', 'Styling'],
        serviceIds: ['nh-s1', 'nh-s4']
      }
    ],
    about: 'Nalabi Hair and Beauty provides a stress-free and calm environment for executive women. We specialize in sew-in installations, steam treatments, and styling with premium-quality products.',
    reviews: [
      { author: 'Nicole K.', date: 'Apr 7, 2026', rating: 5, comment: 'I had a great experience at Nalabi for my sew in refresh. My shampoo and conditioner experience was wonderful and relaxing - which included a steam treatment.' },
      { author: 'Nana F.', date: 'Aug 19, 2025', rating: 5, comment: 'The only place in Accra where you get both expert hair care and quality products!' }
    ]
  },
  {
    id: '1957-grooming',
    type: 'barbershop',
    name: '1957 Grooming',
    rating: 4.9,
    reviewsCount: 1102,
    address: 'Christ Embassy Old Weija, Weija Market, Accra Weija Gbawe Municipal',
    area: 'Weija',
    lat: 5.5648, lng: -0.3355,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'gr-s1', name: 'Haircut & Taper Fade', duration: '45 min', price: 80 },
      { id: 'gr-s2', name: 'Fade + Beard Trim & Shape', duration: '1 hr', price: 110 },
      { id: 'gr-s3', name: 'Hot Towel Shave', duration: '40 min', price: 90 },
      { id: 'gr-s4', name: "Kids' Cut (under 12)", duration: '25 min', price: 60 }
    ],
    stylists: [
      {
        id: 'gr-st1',
        name: 'Kwame B.',
        role: 'Master Barber',
        rating: 4.95,
        yearsExp: 12,
        image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Taper fades', 'Beard sculpting', 'Hot towel shave'],
        serviceIds: ['gr-s1', 'gr-s2', 'gr-s3', 'gr-s4']
      },
      {
        id: 'gr-st2',
        name: 'Nii A.',
        role: 'Senior Barber',
        rating: 4.85,
        yearsExp: 6,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Skin fades', 'Kids cuts', 'Edge-up'],
        serviceIds: ['gr-s1', 'gr-s2', 'gr-s4']
      }
    ],
    about: '1957 Grooming is a premium barbershop delivering sharp fades, beard sculpting, and hot towel shaves for men who care about their look. Named after the year of Ghana\'s independence — precision runs in our DNA.',
    reviews: [
      { author: 'Fredrick S.', date: 'May 15, 2026', rating: 5, comment: 'Kwame always does it perfectly. My fade is still sharp after 3 weeks!' },
      { author: 'Richmond V.', date: 'May 10, 2026', rating: 5, comment: 'Best hot towel shave in Accra. The attention to detail is unreal.' }
    ]
  },
  {
    id: 'the-fade-room',
    type: 'barbershop',
    name: 'The Fade Room',
    rating: 4.8,
    reviewsCount: 342,
    address: '14 Boundary Road, East Legon, Accra',
    area: 'East Legon',
    lat: 5.6375, lng: -0.1575,
    image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'fr-s1', name: 'Signature Fade + Line-up', duration: '45 min', price: 100 },
      { id: 'fr-s2', name: 'Skin Fade', duration: '40 min', price: 90 },
      { id: 'fr-s3', name: 'Beard Trim & Design', duration: '25 min', price: 60 },
      { id: 'fr-s4', name: 'Full Groom (Fade + Beard + Scrub)', duration: '1 hr 15 min', price: 180 }
    ],
    stylists: [
      {
        id: 'fr-st1',
        name: 'Emmanuel D.',
        role: 'Head Barber',
        rating: 4.9,
        yearsExp: 9,
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Skin fades', 'Beard design', 'Line-up'],
        serviceIds: ['fr-s1', 'fr-s2', 'fr-s3', 'fr-s4']
      },
      {
        id: 'fr-st2',
        name: 'Kofi A.',
        role: 'Barber',
        rating: 4.75,
        yearsExp: 5,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Fades', 'Shape-ups', 'Twists'],
        serviceIds: ['fr-s1', 'fr-s2', 'fr-s3']
      }
    ],
    about: 'The Fade Room is East Legon\'s go-to barbershop for precision fades, clean line-ups, and beard artistry. Walk in looking good, walk out looking great.',
    reviews: [
      { author: 'Kwesi O.', date: 'Apr 22, 2026', rating: 5, comment: 'Emmanuel\'s skin fade is insane. I drive from Tema every time — worth every cedi.' },
      { author: 'Ato M.', date: 'Mar 14, 2026', rating: 5, comment: 'Best barbershop in East Legon hands down. Great vibes, sharp cuts every time.' }
    ]
  },
  {
    id: 'prestige-cuts-osu',
    type: 'barbershop',
    name: 'Prestige Cuts',
    rating: 4.7,
    reviewsCount: 188,
    address: '22 Oxford Street, Osu, Accra',
    area: 'Osu',
    lat: 5.5562, lng: -0.1755,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'pc-s1', name: 'Premium Haircut & Fade', duration: '50 min', price: 120 },
      { id: 'pc-s2', name: 'Taper + Edge-Up', duration: '40 min', price: 85 },
      { id: 'pc-s3', name: 'Beard Sculpt & Hot Towel', duration: '35 min', price: 80 },
      { id: 'pc-s4', name: "Kids' & Teens Cut", duration: '30 min', price: 70 }
    ],
    stylists: [
      {
        id: 'pc-st1',
        name: 'Mensah K.',
        role: 'Master Barber',
        rating: 4.85,
        yearsExp: 10,
        image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Taper fades', 'Beard sculpting', 'Hot towel'],
        serviceIds: ['pc-s1', 'pc-s2', 'pc-s3', 'pc-s4']
      },
      {
        id: 'pc-st2',
        name: 'Ato B.',
        role: 'Senior Barber',
        rating: 4.7,
        yearsExp: 6,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Edge-up', 'Kids cuts', 'Low fades'],
        serviceIds: ['pc-s1', 'pc-s2', 'pc-s4']
      }
    ],
    about: 'Prestige Cuts is the Osu neighbourhood\'s most trusted barbershop. We blend classic technique with modern style — every client gets a personalised consultation before the clippers even touch your head.',
    reviews: [
      { author: 'Nana K.', date: 'May 18, 2026', rating: 5, comment: 'Mensah really took his time with my shape-up. Listened to exactly what I wanted. Will be my regular spot.' },
      { author: 'Prince O.', date: 'Apr 2, 2026', rating: 4, comment: 'Clean shop, friendly staff. Haircut was solid and the price is fair for Osu.' }
    ]
  },
  {
    id: 'blomii-hair-spa',
    type: 'salon',
    name: 'Blomii Hair Spa',
    rating: 4.8,
    reviewsCount: 163,
    address: '66 Orphan Crescent, Accra, Greater Accra Region',
    area: 'Kpeshie',
    lat: 5.6266, lng: -0.1295,
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'bl-s1', name: 'Event Styling', duration: '1 hr', price: 500 },
      { id: 'bl-s2', name: 'Styling', duration: '1 hr', price: 80 },
      { id: 'bl-s3', name: 'Loc Retwist', duration: '1 hr', price: 800 },
      { id: 'bl-s4', name: 'Regular Wash & Blow Dry', duration: '1 hr', price: 200 }
    ],
    stylists: [
      {
        id: 'bl-st1',
        name: 'Ivy R.',
        role: 'Lead Stylist',
        rating: 4.95,
        yearsExp: 8,
        image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Event styling', 'Hair spa'],
        serviceIds: ['bl-s1', 'bl-s2', 'bl-s4']
      },
      {
        id: 'bl-st2',
        name: 'Esi T.',
        role: 'Locs Specialist',
        rating: 4.85,
        yearsExp: 7,
        image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Locs', 'Retwists'],
        serviceIds: ['bl-s3', 'bl-s4']
      }
    ],
    about: 'Blomii Hair Spa offers standard treatments, event styling, and hair spa therapies designed to restore, nourish, and elevate your hair.',
    reviews: [
      { author: 'Nhyiraba O.', date: 'Oct 26, 2025', rating: 5, comment: 'Ivy is a great stylist with excellent customer service. I love to visit anytime I come back to Greater Accra.' },
      { author: 'Shelli H.', date: 'May 16, 2026', rating: 5, comment: 'Awesome' }
    ]
  },

  // ── Freelance stylists & barbers ─────────────────────────────
  {
    id: 'amara-osei',
    type: 'freelance',
    name: 'Amara Osei',
    tagline: 'Natural Hair Specialist · Mobile, East Legon & Labone',
    rating: 4.9, reviewsCount: 94,
    address: 'Mobile service — East Legon & Labone, Accra',
    area: 'East Legon',
    lat: 5.6388, lng: -0.1501,
    image: 'https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'ao-s1', name: 'Knotless Box Braids (Medium)', duration: '3 hr', price: 350 },
      { id: 'ao-s2', name: 'Natural Hair Wash & Style', duration: '1 hr 30 min', price: 180 },
      { id: 'ao-s3', name: 'Loc Starter Set', duration: '2 hr 30 min', price: 420 },
      { id: 'ao-s4', name: 'Twist-out + Deep Conditioning', duration: '1 hr 30 min', price: 200 }
    ],
    stylists: [
      {
        id: 'ao-self',
        name: 'Amara Osei',
        role: 'Natural Hair Specialist',
        rating: 4.9, yearsExp: 7,
        image: 'https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Knotless braids', 'Natural hair', 'Locs'],
        serviceIds: ['ao-s1', 'ao-s2', 'ao-s3', 'ao-s4']
      }
    ],
    about: 'Amara Osei is a certified natural hair specialist with 7 years of experience. She travels to your home or office across East Legon, Labone, and Cantonments — bringing a premium salon experience directly to you. No commute, no waiting.',
    reviews: [
      { author: 'Abena M.', date: 'May 10, 2026', rating: 5, comment: 'Amara came to my house and did the most beautiful knotless braids I\'ve ever had. Skilled, punctual, and so easy to talk to.' },
      { author: 'Efua A.', date: 'Apr 3, 2026', rating: 5, comment: 'I\'ve been natural for 3 years and she\'s the first stylist who really understood my hair type. Absolutely incredible results.' }
    ]
  },
  {
    id: 'kweku-asante-barber',
    type: 'freelance',
    name: 'Kweku Asante',
    tagline: 'Freelance Barber · Home visits, East Legon & Cantonments',
    rating: 4.85, reviewsCount: 67,
    address: 'Mobile service — East Legon & Cantonments, Accra',
    area: 'East Legon',
    lat: 5.6402, lng: -0.1522,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=1600',
    gallery: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=90&w=1200',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=90&w=1200'
    ],
    featuredServices: [
      { id: 'kwa-s1', name: 'Home Visit Fade & Lineup', duration: '50 min', price: 150 },
      { id: 'kwa-s2', name: 'Beard Trim & Design', duration: '25 min', price: 80 },
      { id: 'kwa-s3', name: 'Kids\' Haircut (Home)', duration: '30 min', price: 100 }
    ],
    stylists: [
      {
        id: 'kwa-self',
        name: 'Kweku Asante',
        role: 'Freelance Barber',
        rating: 4.85, yearsExp: 5,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=500&h=500',
        specialties: ['Fades', 'Home visits', 'Beard design'],
        serviceIds: ['kwa-s1', 'kwa-s2', 'kwa-s3']
      }
    ],
    about: 'Kweku Asante brings the barbershop to your home. Book him for East Legon, Cantonments, and Airport Residential. Clean cuts, zero commute — ideal for professionals with busy schedules.',
    reviews: [
      { author: 'Yaw B.', date: 'May 5, 2026', rating: 5, comment: 'Best decision. Clean fade, came exactly on time. Perfect for my schedule.' },
      { author: 'Kofi O.', date: 'Apr 19, 2026', rating: 4, comment: 'Good barber, knows his craft. Came on time and the fade was nice. Will book again.' }
    ]
  }
];

// Inject deposit + policy onto every salon
salons.forEach((s) => {
  s.cancellationPolicy = CANCELLATION_POLICY;
  s.depositPercent = DEPOSIT_PERCENT;
  s.featuredServices.forEach((svc) => {
    svc.depositAmount = calcDeposit(svc.price);
  });
});

const bookings = [];
const locks = []; // { id, salonId, stylistId, serviceId, date, time, expiresAt }

// ---- Helpers ----
function findSalon(id) {
  return salons.find((s) => s.id === id);
}

// ---- Routes ----
app.get('/api/salons', (req, res) => {
  const { search, area, type } = req.query;
  let filtered = [...salons];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.about.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        (s.tagline && s.tagline.toLowerCase().includes(q)) ||
        s.featuredServices.some((sv) => sv.name.toLowerCase().includes(q)) ||
        s.stylists.some((st) =>
          st.name.toLowerCase().includes(q) ||
          st.role.toLowerCase().includes(q) ||
          st.specialties.some((sp) => sp.toLowerCase().includes(q))
        )
    );
  }

  if (area && area !== 'All') {
    filtered = filtered.filter((s) => s.area.toLowerCase() === area.toLowerCase());
  }

  if (type && type !== 'all') {
    filtered = filtered.filter((s) => s.type === type);
  }

  res.json(filtered);
});

app.get('/api/salons/:id', (req, res) => {
  const salon = findSalon(req.params.id);
  if (!salon) return res.status(404).json({ message: 'Salon not found' });
  res.json(salon);
});

// ── Real availability ─────────────────────────────────────────
app.get('/api/salons/:id/availability', (req, res) => {
  const salon = findSalon(req.params.id);
  if (!salon) return res.status(404).json({ message: 'Not found' });

  const { stylistId, date, serviceId } = req.query;
  if (!date) return res.status(400).json({ message: 'date required (YYYY-MM-DD)' });

  // Closed Sundays
  if (new Date(date + 'T12:00:00').getDay() === 0)
    return res.json({ date, slots: [], closed: true });

  const service = salon.featuredServices.find(s => s.id === serviceId);
  const slotMins = parseDurationMins(service?.duration);

  // Generate all possible slots 9 am – 6 pm
  const allSlots = [];
  for (let t = 9 * 60; t + slotMins <= 18 * 60; t += slotMins) {
    allSlots.push(
      `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
    );
  }

  // Remove already-booked and locked slots
  const taken = new Set([
    ...bookings
      .filter(b => b.salonId === salon.id &&
        (!stylistId || b.stylistId === stylistId) &&
        b.date === date)
      .map(b => b.time),
    ...locks
      .filter(l => l.salonId === salon.id &&
        (!stylistId || l.stylistId === stylistId) &&
        l.date === date && l.expiresAt > Date.now())
      .map(l => l.time)
  ]);

  res.json({ date, slots: allSlots.filter(s => !taken.has(s)), slotDuration: slotMins });
});

// ── Auth ──────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const normalized = normalizeGhanaPhone(phone);
    if (!normalized)
      return res.status(400).json({ message: 'Enter a valid Ghana number, e.g. 0244 123 456' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(normalized, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    await sendSMS(normalized, `Your MojoBooking code is ${otp}. Valid 5 mins. Don\'t share it.`);

    const devMode = !process.env.AT_API_KEY;
    res.json({ message: 'Code sent', phone: normalized, ...(devMode && { devOtp: otp }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send code. Try again.' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and code required' });

  const entry = otpStore.get(phone);
  if (!entry)
    return res.status(400).json({ message: 'No code found — request a new one.' });
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ message: 'Code expired. Request a new one.' });
  }
  if (entry.otp !== String(otp).trim())
    return res.status(400).json({ message: 'Incorrect code. Try again.' });

  otpStore.delete(phone);
  const token = `mj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  sessions.set(token, { phone, createdAt: Date.now() });
  res.json({ token, user: { phone } });
});

// Hold a slot for 2 minutes (S6 microlock from the MVP doc)
app.post('/api/bookings/lock', (req, res) => {
  const { salonId, stylistId, serviceId, date, time } = req.body || {};
  if (!salonId || !stylistId || !serviceId || !date || !time) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const conflict = locks.find(
    (l) =>
      l.salonId === salonId &&
      l.stylistId === stylistId &&
      l.date === date &&
      l.time === time &&
      l.expiresAt > Date.now()
  );
  if (conflict) {
    return res.status(409).json({ message: 'Slot just taken — pick a new time.' });
  }
  const lock = {
    id: `lk-${Math.random().toString(36).substr(2, 9)}`,
    salonId,
    stylistId,
    serviceId,
    date,
    time,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 1000
  };
  locks.push(lock);
  res.status(201).json(lock);
});

app.post('/api/bookings', (req, res) => {
  const {
    salonId,
    stylistId,
    serviceId,
    serviceName,
    price,
    date,
    time,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod, // 'momo' | 'card'
    momoNumber,
    lockId
  } = req.body;

  const required = { salonId, stylistId, serviceId, date, time, customerName, customerEmail, customerPhone, paymentMethod };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  const salon = findSalon(salonId);
  if (!salon) return res.status(404).json({ message: 'Salon not found' });

  const stylist = salon.stylists.find((s) => s.id === stylistId);
  if (!stylist) return res.status(404).json({ message: 'Stylist not found' });

  const service =
    salon.featuredServices.find((s) => s.id === serviceId) ||
    salon.featuredServices.find((s) => s.name === serviceName);
  if (!service) return res.status(404).json({ message: 'Service not found' });

  if (paymentMethod === 'momo' && !momoNumber) {
    return res.status(400).json({ message: 'momoNumber is required when paymentMethod is momo' });
  }

  const finalPrice = price ?? service.price;
  const depositAmount = service.depositAmount ?? calcDeposit(finalPrice);
  const balanceAmount = finalPrice - depositAmount;
  const platformFee = Math.round(finalPrice * (PLATFORM_FEE_PERCENT / 100));

  const id = `bk-${Math.random().toString(36).substr(2, 9)}`;
  const reference = `MJ-${id.slice(3, 9).toUpperCase()}`;

  const booking = {
    id,
    reference,
    salonId,
    salonName: salon.name,
    salonAddress: salon.address,
    salonImage: salon.image,
    stylistId,
    stylistName: stylist.name,
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    price: finalPrice,
    depositAmount,
    balanceAmount,
    platformFee,
    paymentMethod,
    momoNumberMasked: paymentMethod === 'momo' ? momoNumber.replace(/\d(?=\d{3})/g, '•') : null,
    date,
    time,
    customerName,
    customerEmail,
    customerPhone,
    cancellationPolicy: salon.cancellationPolicy,
    qrPayload: `mojobooking:checkin:${id}`,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  // consume the lock if provided
  if (lockId) {
    const idx = locks.findIndex((l) => l.id === lockId);
    if (idx >= 0) locks.splice(idx, 1);
  }

  bookings.push(booking);

  // SMS confirmation (fire-and-forget — don't block the response)
  const dateLabel = new Date(booking.date + 'T12:00:00')
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  sendSMS(booking.customerPhone, [
    `Booking confirmed! ✓`,
    `${booking.serviceName} at ${booking.salonName}`,
    `${dateLabel} · ${booking.time} with ${booking.stylistName}`,
    `Ref: ${booking.reference}`,
    `Balance GHS ${booking.balanceAmount} due at salon`,
    `mojobooking.com`
  ].join('\n')).catch(err => console.error('SMS error:', err));

  res.status(201).json(booking);
});

// My bookings — authenticated user only
app.get('/api/bookings/my', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ message: 'Session expired' });
  const mine = bookings
    .filter((b) => b.customerPhone === session.phone)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(mine);
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.listen(PORT, () => {
  console.log(`MojoBooking backend listening on port ${PORT}`);
});
