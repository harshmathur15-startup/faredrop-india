// Customer-friendly Flight-details panel. Parses the dense machine-text
// curator_note into clean legs at render time. Pure (no state/effects) — used
// inside <DealDetails>, which only ever receives the note for an ENTITLED viewer.

const FARE_DISCLAIMER =
  "*Flight prices are dynamic and may change at any time. Please confirm the final fare and review the booking platform's or airline's terms & conditions before you book."

type Leg = { stops: string; dur: string; lay: string }

const CITY_NAMES: Record<string, string> = {
  CPH: 'Copenhagen', KWI: 'Kuwait', HKG: 'Hong Kong', BOM: 'Mumbai', DOH: 'Doha',
  KUL: 'Kuala Lumpur', SIN: 'Singapore', AUH: 'Abu Dhabi', DXB: 'Dubai', CMB: 'Colombo',
  LHR: 'London', PAT: 'Patna', DEL: 'Delhi', BLR: 'Bengaluru', MAA: 'Chennai',
  HYD: 'Hyderabad', CCU: 'Kolkata', IST: 'Istanbul', AMS: 'Amsterdam',
}
const cityName = (s: string) => {
  const t = s.replace(/\(.*?\)/, '').trim()
  return CITY_NAMES[t.toUpperCase()] ?? CITY_NAMES[t] ?? t
}
const prettyDur = (d: string) => (d ? d.replace(/(\d+)h\s?(\d+)m?/, '$1h $2m').replace(/(\d+)h(?!\s?\d)/, '$1h') : '')
const stripInternal = (n: string) => n.replace(/\s*\[auto-discovered\]\s*/gi, ' ').trim()
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const friendlyDates = (s: string) =>
  s.replace(/\((\d{4})-(\d{2})-(\d{2})\s*→\s*(\d{4})-(\d{2})-(\d{2})\)/g, (_m, _y1, m1, d1, _y2, m2, d2) => {
    const a = +d1, b = +d2
    return m1 === m2 ? `(${a}–${b} ${MONTHS[+m1 - 1]})` : `(${a} ${MONTHS[+m1 - 1]}–${b} ${MONTHS[+m2 - 1]})`
  })
const pctUnder = (n: string) => {
  const m = n.match(/~?\s*(\d+)\s*%\s*under\s*(?:typical|normal)/i)
  return m ? +m[1] : null
}
function parseLeg(seg: string): Leg {
  seg = seg.replace(/^·|·$/g, '').trim()
  const sm = seg.match(/(Nonstop|\d+\s*stops?(?:\s*via\s*[^·(]+)?)/i)
  let stops = sm ? sm[1].trim() : ''
  stops = stops.replace(/via\s*([A-Za-z ()]+)/i, (_m, p) => 'via ' + cityName(p.trim())).replace(/nonstop/i, 'Non-stop')
  const lay = (seg.match(/layover\s*(\d{1,2}h\s?\d{0,2}m?)/i) ?? [])[1] ?? ''
  const durs = seg.match(/\b\d{1,2}h\s?\d{0,2}m?\b/g) ?? []
  const dur = durs.find(d => d !== lay) ?? durs[0] ?? ''
  return { stops, dur: prettyDur(dur), lay: prettyDur(lay) }
}
function parseFlightNote(note: string) {
  const s = stripInternal(note)
  const hasLegs = /Out:/i.test(s) && /Ret:/i.test(s)
  let out: Leg | null = null, ret: Leg | null = null
  if (hasLegs) {
    const core = s
      .replace(/~?\s*\d+\s*%\s*under\s*(?:typical|normal)\.?/i, '')
      .replace(/·?\s*[A-Z–-]*\s*\d+-night trip\s*\([^)]*\)\.?/i, '')
      .replace(/^(Economy|Premium Economy|Business|First Class)\s*·\s*/i, '')
    const oi = core.indexOf('Out:'), ri = core.indexOf('Ret:')
    out = parseLeg(core.slice(oi + 4, ri > -1 ? ri : undefined))
    if (ri > -1) ret = parseLeg(core.slice(ri + 4))
  }
  const clean = friendlyDates(stripInternal(note)).replace(/^(Economy|Premium Economy|Business|First Class)\s*·\s*/i, '')
  return { pct: pctUnder(s), out, ret, hasLegs, clean }
}
function FlightLeg({ dir, leg }: { dir: string; leg: Leg | null }) {
  if (!leg) return null
  const details = [leg.stops, leg.dur].filter(Boolean).join(' · ')
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-blue-500 text-sm leading-5" aria-hidden>✈</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-4">{dir}</p>
        <p className="text-[13px] text-slate-800 font-medium leading-5">
          {details}
          {leg.lay ? <span className="text-slate-400 font-normal"> · {leg.lay} layover</span> : null}
        </p>
      </div>
    </div>
  )
}

export default function FlightDetails({ note }: { note: string | null }) {
  if (!note) return <p className="mt-4 text-[11px] leading-4 text-slate-400">{FARE_DISCLAIMER}</p>
  const p = parseFlightNote(note)
  return (
    <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Flight details</p>
      {p.hasLegs ? (
        <>
          <FlightLeg dir="Outbound" leg={p.out} />
          <FlightLeg dir="Return" leg={p.ret} />
          {p.pct != null && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              🏷 {p.pct}% under the typical fare
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-slate-600 leading-5">{p.clean}</p>
      )}
      <p className="mt-3 text-[11px] leading-4 text-slate-400">{FARE_DISCLAIMER}</p>
    </div>
  )
}
