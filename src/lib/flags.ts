import { isIndianAirport } from '@/lib/utils'

// SINGLE source of truth for airport/city → country flag emoji.
//
// This used to be duplicated across routes.ts (FLAG), HeroDeals.tsx (DEST_META)
// and DestinationGrid.tsx (FLAG), and the three drifted — e.g. GVA/MXP were
// missing from some, so Geneva & Milan rendered a bare ✈️ instead of 🇨🇭 / 🇮🇹.
// Keep every destination we publish deals for HERE and nowhere else.
// When you publish a deal to a NEW city, add its IATA below.
const FLAG: Record<string, string> = {
  // Thailand / SE-Asia
  BKK: '🇹🇭', DMK: '🇹🇭', HKT: '🇹🇭', DPS: '🇮🇩', CGK: '🇮🇩', SIN: '🇸🇬',
  KUL: '🇲🇾', HAN: '🇻🇳', SGN: '🇻🇳',
  // Gulf / Middle East
  DXB: '🇦🇪', AUH: '🇦🇪', DOH: '🇶🇦', KWI: '🇰🇼', RUH: '🇸🇦', JED: '🇸🇦',
  BAH: '🇧🇭', MCT: '🇴🇲',
  // Europe
  LHR: '🇬🇧', LGW: '🇬🇧', LON: '🇬🇧', CDG: '🇫🇷', PAR: '🇫🇷', AMS: '🇳🇱',
  FCO: '🇮🇹', MXP: '🇮🇹', LIN: '🇮🇹', BGY: '🇮🇹', VIE: '🇦🇹',
  GVA: '🇨🇭', ZRH: '🇨🇭', MUC: '🇩🇪', FRA: '🇩🇪', MAD: '🇪🇸', BCN: '🇪🇸',
  LIS: '🇵🇹', IST: '🇹🇷', TBS: '🇬🇪', EVN: '🇦🇲',
  // East Asia
  NRT: '🇯🇵', HND: '🇯🇵', ICN: '🇰🇷', HKG: '🇭🇰', PVG: '🇨🇳', SHA: '🇨🇳',
  PEK: '🇨🇳', TPE: '🇹🇼',
  // Americas / Oceania
  JFK: '🇺🇸', NYC: '🇺🇸', EWR: '🇺🇸', IAD: '🇺🇸', ATL: '🇺🇸', YYZ: '🇨🇦',
  MEL: '🇦🇺', SYD: '🇦🇺', AKL: '🇳🇿',
  // South / Central Asia
  CMB: '🇱🇰', MLE: '🇲🇻', GAN: '🇲🇻', KTM: '🇳🇵', DAC: '🇧🇩',
  TAS: '🇺🇿', ALA: '🇰🇿', CAI: '🇪🇬',
  // India (domestic — also covered by the isIndianAirport fallback below)
  DEL: '🇮🇳', BOM: '🇮🇳', BLR: '🇮🇳', MAA: '🇮🇳', HYD: '🇮🇳', CCU: '🇮🇳',
  PNQ: '🇮🇳', GOI: '🇮🇳', GOX: '🇮🇳', IXL: '🇮🇳', COK: '🇮🇳', UDR: '🇮🇳',
  SXR: '🇮🇳', IXB: '🇮🇳', IXZ: '🇮🇳', DED: '🇮🇳', JAI: '🇮🇳', VNS: '🇮🇳',
}

// Flag for an airport/city code. Any Indian airport falls back to 🇮🇳, so a new
// domestic route is never flagless; anything else unknown falls back to ✈️.
export function flagFor(iata: string): string {
  return FLAG[iata] ?? (isIndianAirport(iata) ? '🇮🇳' : '✈️')
}
