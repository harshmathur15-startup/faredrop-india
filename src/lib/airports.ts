export interface Airport {
  iata: string
  city: string
  name: string
  country: string
  isIndia: boolean
}

export const AIRPORTS: Airport[] = [
  // ── India ────────────────────────────────────────────────
  { iata: 'DEL', city: 'New Delhi',          name: 'Indira Gandhi International',             country: 'India', isIndia: true },
  { iata: 'BOM', city: 'Mumbai',             name: 'Chhatrapati Shivaji Maharaj International', country: 'India', isIndia: true },
  { iata: 'BLR', city: 'Bengaluru',          name: 'Kempegowda International',                country: 'India', isIndia: true },
  { iata: 'MAA', city: 'Chennai',            name: 'Chennai International',                   country: 'India', isIndia: true },
  { iata: 'CCU', city: 'Kolkata',            name: 'Netaji Subhas Chandra Bose International', country: 'India', isIndia: true },
  { iata: 'HYD', city: 'Hyderabad',          name: 'Rajiv Gandhi International',              country: 'India', isIndia: true },
  { iata: 'COK', city: 'Kochi',              name: 'Cochin International',                    country: 'India', isIndia: true },
  { iata: 'PNQ', city: 'Pune',               name: 'Pune International',                      country: 'India', isIndia: true },
  { iata: 'AMD', city: 'Ahmedabad',          name: 'Sardar Vallabhbhai Patel International',  country: 'India', isIndia: true },
  { iata: 'GOI', city: 'Goa',               name: 'Goa International (Dabolim)',              country: 'India', isIndia: true },
  { iata: 'JAI', city: 'Jaipur',             name: 'Jaipur International',                    country: 'India', isIndia: true },
  { iata: 'LKO', city: 'Lucknow',            name: 'Chaudhary Charan Singh International',   country: 'India', isIndia: true },
  { iata: 'ATQ', city: 'Amritsar',           name: 'Sri Guru Ram Dass Jee International',    country: 'India', isIndia: true },
  { iata: 'BBI', city: 'Bhubaneswar',        name: 'Biju Patnaik International',             country: 'India', isIndia: true },
  { iata: 'GAU', city: 'Guwahati',           name: 'Lokpriya Gopinath Bordoloi International', country: 'India', isIndia: true },
  { iata: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum International',               country: 'India', isIndia: true },
  { iata: 'CJB', city: 'Coimbatore',         name: 'Coimbatore International',               country: 'India', isIndia: true },
  { iata: 'VTZ', city: 'Visakhapatnam',      name: 'Visakhapatnam International',            country: 'India', isIndia: true },
  { iata: 'IXC', city: 'Chandigarh',         name: 'Chandigarh International',               country: 'India', isIndia: true },
  { iata: 'IXE', city: 'Mangalore',          name: 'Mangalore International',                country: 'India', isIndia: true },
  { iata: 'SXR', city: 'Srinagar',           name: 'Srinagar International',                 country: 'India', isIndia: true },
  { iata: 'NAG', city: 'Nagpur',             name: 'Dr. Babasaheb Ambedkar International',   country: 'India', isIndia: true },
  { iata: 'PAT', city: 'Patna',              name: 'Jay Prakash Narayan International',      country: 'India', isIndia: true },
  { iata: 'IXB', city: 'Siliguri',           name: 'Bagdogra Airport',                       country: 'India', isIndia: true },
  { iata: 'RPR', city: 'Raipur',             name: 'Swami Vivekananda Airport',              country: 'India', isIndia: true },

  // ── Middle East ──────────────────────────────────────────
  { iata: 'DXB', city: 'Dubai',         name: 'Dubai International',         country: 'UAE',          isIndia: false },
  { iata: 'AUH', city: 'Abu Dhabi',     name: 'Zayed International',         country: 'UAE',          isIndia: false },
  { iata: 'DOH', city: 'Doha',          name: 'Hamad International',         country: 'Qatar',        isIndia: false },
  { iata: 'KWI', city: 'Kuwait City',   name: 'Kuwait International',        country: 'Kuwait',       isIndia: false },
  { iata: 'RUH', city: 'Riyadh',        name: 'King Khalid International',   country: 'Saudi Arabia', isIndia: false },
  { iata: 'BAH', city: 'Manama',        name: 'Bahrain International',       country: 'Bahrain',      isIndia: false },
  { iata: 'MCT', city: 'Muscat',        name: 'Muscat International',        country: 'Oman',         isIndia: false },

  // ── Southeast Asia ───────────────────────────────────────
  { iata: 'SIN', city: 'Singapore',        name: 'Singapore Changi',             country: 'Singapore',  isIndia: false },
  { iata: 'BKK', city: 'Bangkok',          name: 'Suvarnabhumi International',   country: 'Thailand',   isIndia: false },
  { iata: 'KUL', city: 'Kuala Lumpur',     name: 'Kuala Lumpur International',   country: 'Malaysia',   isIndia: false },
  { iata: 'HAN', city: 'Hanoi',            name: 'Noi Bai International',        country: 'Vietnam',    isIndia: false },
  { iata: 'SGN', city: 'Ho Chi Minh City', name: 'Tan Son Nhat International',   country: 'Vietnam',    isIndia: false },
  { iata: 'DPS', city: 'Bali',             name: 'Ngurah Rai International',     country: 'Indonesia',  isIndia: false },
  { iata: 'CGK', city: 'Jakarta',          name: 'Soekarno-Hatta International', country: 'Indonesia',  isIndia: false },
  { iata: 'MNL', city: 'Manila',           name: 'Ninoy Aquino International',   country: 'Philippines',isIndia: false },
  { iata: 'RGN', city: 'Yangon',           name: 'Yangon International',         country: 'Myanmar',    isIndia: false },
  { iata: 'REP', city: 'Siem Reap',        name: 'Siem Reap International',      country: 'Cambodia',   isIndia: false },

  // ── East Asia ────────────────────────────────────────────
  { iata: 'NRT', city: 'Tokyo',     name: 'Narita International',          country: 'Japan',       isIndia: false },
  { iata: 'HND', city: 'Tokyo',     name: 'Haneda International',          country: 'Japan',       isIndia: false },
  { iata: 'OSA', city: 'Osaka',     name: 'Kansai International',          country: 'Japan',       isIndia: false },
  { iata: 'ICN', city: 'Seoul',     name: 'Incheon International',         country: 'South Korea', isIndia: false },
  { iata: 'HKG', city: 'Hong Kong', name: 'Hong Kong International',       country: 'Hong Kong',   isIndia: false },
  { iata: 'PEK', city: 'Beijing',   name: 'Beijing Capital International', country: 'China',       isIndia: false },
  { iata: 'PVG', city: 'Shanghai',  name: 'Shanghai Pudong International', country: 'China',       isIndia: false },
  { iata: 'TPE', city: 'Taipei',    name: 'Taiwan Taoyuan International',  country: 'Taiwan',      isIndia: false },

  // ── South Asia & Nearby ──────────────────────────────────
  { iata: 'CMB', city: 'Colombo',   name: 'Bandaranaike International',          country: 'Sri Lanka',  isIndia: false },
  { iata: 'KTM', city: 'Kathmandu', name: 'Tribhuvan International',             country: 'Nepal',      isIndia: false },
  { iata: 'DAC', city: 'Dhaka',     name: 'Hazrat Shahjalal International',      country: 'Bangladesh', isIndia: false },
  { iata: 'MLE', city: 'Malé',      name: 'Velana International',                country: 'Maldives',   isIndia: false },
  { iata: 'BKK', city: 'Phuket',    name: 'Phuket International',               country: 'Thailand',   isIndia: false },

  // ── Europe ───────────────────────────────────────────────
  { iata: 'LHR', city: 'London',       name: 'Heathrow',                       country: 'United Kingdom', isIndia: false },
  { iata: 'LGW', city: 'London',       name: 'Gatwick',                        country: 'United Kingdom', isIndia: false },
  { iata: 'CDG', city: 'Paris',        name: 'Charles de Gaulle',              country: 'France',         isIndia: false },
  { iata: 'FRA', city: 'Frankfurt',    name: 'Frankfurt International',        country: 'Germany',        isIndia: false },
  { iata: 'MUC', city: 'Munich',       name: 'Munich International',           country: 'Germany',        isIndia: false },
  { iata: 'AMS', city: 'Amsterdam',    name: 'Schiphol',                       country: 'Netherlands',    isIndia: false },
  { iata: 'ZRH', city: 'Zurich',       name: 'Zurich International',           country: 'Switzerland',    isIndia: false },
  { iata: 'GVA', city: 'Geneva',       name: 'Geneva International',           country: 'Switzerland',    isIndia: false },
  { iata: 'FCO', city: 'Rome',         name: 'Leonardo da Vinci International',country: 'Italy',          isIndia: false },
  { iata: 'MXP', city: 'Milan',        name: 'Malpensa International',         country: 'Italy',          isIndia: false },
  { iata: 'BCN', city: 'Barcelona',    name: 'El Prat International',          country: 'Spain',          isIndia: false },
  { iata: 'MAD', city: 'Madrid',       name: 'Adolfo Suárez Madrid-Barajas',  country: 'Spain',          isIndia: false },
  { iata: 'VIE', city: 'Vienna',       name: 'Vienna International',           country: 'Austria',        isIndia: false },
  { iata: 'IST', city: 'Istanbul',     name: 'Istanbul Airport',               country: 'Turkey',         isIndia: false },
  { iata: 'CPH', city: 'Copenhagen',   name: 'Copenhagen Airport',             country: 'Denmark',        isIndia: false },
  { iata: 'ARN', city: 'Stockholm',    name: 'Arlanda Airport',                country: 'Sweden',         isIndia: false },

  // ── Oceania ──────────────────────────────────────────────
  { iata: 'SYD', city: 'Sydney',    name: 'Kingsford Smith International', country: 'Australia',    isIndia: false },
  { iata: 'MEL', city: 'Melbourne', name: 'Melbourne Airport',            country: 'Australia',    isIndia: false },
  { iata: 'BNE', city: 'Brisbane',  name: 'Brisbane Airport',             country: 'Australia',    isIndia: false },
  { iata: 'PER', city: 'Perth',     name: 'Perth Airport',                country: 'Australia',    isIndia: false },
  { iata: 'AKL', city: 'Auckland',  name: 'Auckland International',       country: 'New Zealand',  isIndia: false },

  // ── North America ────────────────────────────────────────
  { iata: 'JFK', city: 'New York',       name: 'John F. Kennedy International',    country: 'USA',    isIndia: false },
  { iata: 'EWR', city: 'Newark',         name: 'Newark Liberty International',     country: 'USA',    isIndia: false },
  { iata: 'ORD', city: 'Chicago',        name: "O'Hare International",             country: 'USA',    isIndia: false },
  { iata: 'LAX', city: 'Los Angeles',    name: 'Los Angeles International',        country: 'USA',    isIndia: false },
  { iata: 'SFO', city: 'San Francisco',  name: 'San Francisco International',      country: 'USA',    isIndia: false },
  { iata: 'SEA', city: 'Seattle',        name: 'Seattle-Tacoma International',     country: 'USA',    isIndia: false },
  { iata: 'IAD', city: 'Washington DC',  name: 'Dulles International',             country: 'USA',    isIndia: false },
  { iata: 'ATL', city: 'Atlanta',        name: 'Hartsfield-Jackson International', country: 'USA',    isIndia: false },
  { iata: 'YYZ', city: 'Toronto',        name: 'Pearson International',            country: 'Canada', isIndia: false },
  { iata: 'YVR', city: 'Vancouver',      name: 'Vancouver International',          country: 'Canada', isIndia: false },
]

export const AIRPORT_MAP = new Map(AIRPORTS.map(a => [a.iata, a]))
export const INDIAN_AIRPORTS = AIRPORTS.filter(a => a.isIndia)
export const INTL_AIRPORTS = AIRPORTS.filter(a => !a.isIndia)

export function getAirport(iata: string): Airport | undefined {
  return AIRPORT_MAP.get(iata.toUpperCase())
}

export function searchAirports(query: string, limit = 8): Airport[] {
  if (!query || query.length < 1) return INDIAN_AIRPORTS.slice(0, limit)
  const q = query.toLowerCase()
  return AIRPORTS.filter(a =>
    a.iata.toLowerCase().startsWith(q) ||
    a.city.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  ).slice(0, limit)
}
