// Builds Google Flights deep links with cabin + dates pre-selected, cheapest-sort.
// Shared by the discovery agent (mirrors the inline builder in deal/[id]/page.tsx).
// tfsCabin: economy=1, premium economy=2, business=3, first=4.

function varint(n: number): number[] { const o: number[] = []; while (n > 0x7f) { o.push((n & 0x7f) | 0x80); n >>>= 7 } o.push(n & 0x7f); return o }
function vfield(f: number, v: number): number[] { return [...varint(f << 3), ...varint(v)] }
function lfield(f: number, b: number[]): number[] { return [...varint((f << 3) | 2), ...varint(b.length), ...b] }
function bytesOf(s: string): number[] { return Array.from(Buffer.from(s, 'utf8')) }
function b64url(b: number[]): string { return Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') }

export function googleFlightsCabinUrl(orig: string, dest: string, dept: string, ret: string, tfsCabin = 1): string {
  const airport = (iata: string) => [...vfield(1, 1), ...lfield(2, bytesOf(iata))]
  const leg = (date: string, from: string, to: string) => [...lfield(2, bytesOf(date)), ...lfield(13, airport(from)), ...lfield(14, airport(to))]
  const tfs = b64url([
    ...vfield(1, 28), ...vfield(2, 2),
    ...lfield(3, leg(dept, orig, dest)),
    ...lfield(3, leg(ret, dest, orig)),
    ...vfield(8, 1), ...vfield(9, tfsCabin), ...vfield(14, 1),
    ...vfield(19, 1),
  ])
  const tfu = b64url(lfield(2, [...vfield(4, 2), ...vfield(5, 5)]))
  return `https://www.google.com/travel/flights/search?tfs=${tfs}&tfu=${tfu}&curr=INR`
}
