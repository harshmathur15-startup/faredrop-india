'use client'

import { useState } from 'react'

export default function DataAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [engagement, setEngagement] = useState<any>(null)
  const [engagementErr, setEngagementErr] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  // Engagement = the analytics_events reporting functions. Kept separate from
  // the deals/freshness payload so a not-yet-applied migration never blocks the
  // main dashboard — it just shows a hint.
  const loadEngagement = async (lookback: number, token: string) => {
    setEngagementErr(null)
    try {
      const res = await fetch(`/api/analytics/events?days=${lookback}`, { headers: { 'x-admin-token': token } })
      const json = await res.json()
      if (res.ok) setEngagement(json)
      else setEngagementErr(json.error || 'Failed to load engagement analytics')
    } catch (err) {
      setEngagementErr(String(err))
    }
  }

  const changeDays = (lookback: number) => {
    setDays(lookback)
    loadEngagement(lookback, secret)
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analytics?pageSize=500', { headers: { 'x-admin-token': secret } })
      const json = await res.json()
      if (res.ok) {
        setData(json)
        loadEngagement(days, secret)
      } else {
        setError(json.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="p-8 max-w-md">
        <h1 className="text-2xl font-black text-gray-900 mb-4">Data Analytics</h1>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Admin password</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') loadData() }}
          placeholder="Enter admin password"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={loadData} disabled={loading || !secret}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg">
          {loading ? 'Loading…' : 'Load analytics'}
        </button>
        {error && <p className="text-red-600 mt-4">Error: {error}</p>}
      </div>
    )
  }

  const handleDownloadCSV = async () => {
    const response = await fetch('/api/analytics/export', { headers: { 'x-admin-token': secret } })
    const csv = await response.text()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travelbaby-data-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-gray-900">Data Analytics Dashboard</h1>
        <button
          onClick={handleDownloadCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          📥 Download CSV
        </button>
      </div>

      {/* ── Engagement Analytics (impressions / clicks / dwell / checkout) ── */}
      <div className="bg-white rounded-lg p-6 shadow mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-black">📊 Engagement Analytics</h2>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => changeDays(d)}
                className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                  days === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {engagementErr && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            ⚠️ {engagementErr}
            <span className="block text-amber-600 mt-1">
              If this says a function/table is missing, apply the <code>analytics_events</code> migration to this database first.
            </span>
          </div>
        )}

        {engagement && !engagementErr && (
          <>
            {/* Checkout funnel — answers "reached payment but didn't pay" */}
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Checkout Funnel</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                <p className="text-blue-700 text-xs font-semibold">Reached Payment</p>
                <p className="text-3xl font-black text-blue-700">{engagement.checkoutFunnel?.reached_payment ?? 0}</p>
              </div>
              <div className="rounded-lg p-4 bg-green-50 border border-green-200">
                <p className="text-green-700 text-xs font-semibold">Paid</p>
                <p className="text-3xl font-black text-green-700">{engagement.checkoutFunnel?.paid ?? 0}</p>
              </div>
              <div className="rounded-lg p-4 bg-red-50 border border-red-200">
                <p className="text-red-700 text-xs font-semibold">Reached, Not Paid</p>
                <p className="text-3xl font-black text-red-700">{engagement.checkoutFunnel?.reached_but_not_paid ?? 0}</p>
              </div>
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                <p className="text-gray-600 text-xs font-semibold">Abandoned / Failed</p>
                <p className="text-3xl font-black text-gray-900">
                  {(engagement.checkoutFunnel?.abandoned ?? 0)} / {(engagement.checkoutFunnel?.failed ?? 0)}
                </p>
              </div>
              <div className="rounded-lg p-4 bg-emerald-50 border border-emerald-200">
                <p className="text-emerald-700 text-xs font-semibold">Conversion</p>
                <p className="text-3xl font-black text-emerald-700">{engagement.checkoutFunnel?.conversion_pct ?? 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Deal performance — impression share + CTR (ad/affiliate data) */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Deal Performance (impression share &amp; CTR)</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-2 font-bold">Route</th>
                        <th className="text-right p-2 font-bold">Impr.</th>
                        <th className="text-right p-2 font-bold">Clicks</th>
                        <th className="text-right p-2 font-bold">CTR</th>
                        <th className="text-right p-2 font-bold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagement.dealPerformance?.length ? engagement.dealPerformance.map((d: any) => (
                        <tr key={d.deal_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 font-semibold">{d.route ?? d.deal_id?.slice(0, 8)}</td>
                          <td className="p-2 text-right">{d.impressions}</td>
                          <td className="p-2 text-right">{d.clicks}</td>
                          <td className="p-2 text-right text-blue-600 font-semibold">{d.ctr_pct ?? 0}%</td>
                          <td className="p-2 text-right font-bold text-amber-600">{d.impression_share_pct ?? 0}%</td>
                        </tr>
                      )) : <tr><td colSpan={5} className="p-4 text-center text-gray-400">No deal impressions yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page dwell — which page holds attention */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Time Spent per Page</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-2 font-bold">Page</th>
                        <th className="text-right p-2 font-bold">Views</th>
                        <th className="text-right p-2 font-bold">Avg (s)</th>
                        <th className="text-right p-2 font-bold">Total (min)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagement.pageDwell?.length ? engagement.pageDwell.map((p: any) => (
                        <tr key={p.page} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{p.page}</td>
                          <td className="p-2 text-right">{p.views}</td>
                          <td className="p-2 text-right">{p.avg_seconds}</td>
                          <td className="p-2 text-right font-semibold">{p.total_minutes}</td>
                        </tr>
                      )) : <tr><td colSpan={4} className="p-4 text-center text-gray-400">No page views yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* First deal/carousel each user clicked */}
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-8 mb-3">First Deal Clicked (per user)</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-2 font-bold">User</th>
                    <th className="text-left p-2 font-bold">First Deal</th>
                    <th className="text-left p-2 font-bold">Surface</th>
                    <th className="text-right p-2 font-bold">Position</th>
                    <th className="text-left p-2 font-bold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {engagement.firstClicks?.length ? engagement.firstClicks.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{c.actor}</td>
                      <td className="p-2 font-semibold">{c.route ?? c.deal_id?.slice(0, 8)}</td>
                      <td className="p-2">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{c.surface ?? '—'}</span>
                      </td>
                      <td className="p-2 text-right text-gray-500">{c.position ?? '—'}</td>
                      <td className="p-2 text-gray-500 text-xs">{c.clicked_at ? new Date(c.clicked_at).toLocaleString() : '—'}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="p-4 text-center text-gray-400">No deal clicks yet</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-500 text-sm">Total Deals</p>
          <p className="text-3xl font-black text-gray-900">{data.stats.deals.total}</p>
          <p className="text-xs text-gray-400 mt-2">
            {data.stats.deals.published} published, {data.stats.deals.draft} draft
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-500 text-sm">Lowest Deal Price</p>
          <p className="text-3xl font-black text-green-600">₹{data.stats.dealPrices.min?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">Average: ₹{data.stats.dealPrices.avg?.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-500 text-sm">Highest Deal Price</p>
          <p className="text-3xl font-black text-amber-600">₹{data.stats.dealPrices.max?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">{data.stats.dealPrices.count} deals tracked</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-500 text-sm">Routes</p>
          <p className="text-3xl font-black text-blue-600">{data.stats.routes.unique_routes}</p>
          <p className="text-xs text-gray-400 mt-2">
            {data.stats.routes.origins} origins, {data.stats.routes.destinations} destinations
          </p>
        </div>
      </div>

      {/* Price Freshness — Dashboard 1 (Data Health) */}
      {data.freshness && (
        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">🕐 Price Freshness (Data Health)</h2>
            <p className="text-xs text-gray-400">
              Fresh &lt; {data.freshness.thresholds.freshHours}h · Aging &lt; {data.freshness.thresholds.agingHours}h · Stale older
            </p>
          </div>

          {/* Freshness summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg p-4 bg-green-50 border border-green-200">
              <p className="text-green-700 text-sm font-semibold">🟢 Fresh</p>
              <p className="text-3xl font-black text-green-700">{data.freshness.summary.fresh}</p>
              <p className="text-xs text-green-600 mt-1">routes &lt; {data.freshness.thresholds.freshHours}h old</p>
            </div>
            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-200">
              <p className="text-yellow-700 text-sm font-semibold">🟡 Aging</p>
              <p className="text-3xl font-black text-yellow-700">{data.freshness.summary.aging}</p>
              <p className="text-xs text-yellow-600 mt-1">show with "last checked"</p>
            </div>
            <div className="rounded-lg p-4 bg-red-50 border border-red-200">
              <p className="text-red-700 text-sm font-semibold">🔴 Stale</p>
              <p className="text-3xl font-black text-red-700">{data.freshness.summary.stale}</p>
              <p className="text-xs text-red-600 mt-1">hide / re-verify</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
              <p className="text-gray-600 text-sm font-semibold">Total Routes</p>
              <p className="text-3xl font-black text-gray-900">{data.freshness.summary.totalRoutes}</p>
              <p className="text-xs text-gray-500 mt-1">tracked in price history</p>
            </div>
          </div>

          {/* Per-route freshness table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-3 font-bold">Route</th>
                  <th className="text-left p-3 font-bold">Status</th>
                  <th className="text-right p-3 font-bold">Last Price</th>
                  <th className="text-left p-3 font-bold">Airline</th>
                  <th className="text-right p-3 font-bold">Age</th>
                  <th className="text-left p-3 font-bold">Last Checked</th>
                  <th className="text-right p-3 font-bold">Obs.</th>
                  <th className="text-left p-3 font-bold">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.freshness.routes.map((r: any) => (
                  <tr key={r.route} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold">{r.route}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        r.freshness === 'fresh' ? 'bg-green-100 text-green-700' :
                        r.freshness === 'aging' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.freshness === 'fresh' ? '🟢 Fresh' : r.freshness === 'aging' ? '🟡 Aging' : '🔴 Stale'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">₹{r.price?.toLocaleString()}</td>
                    <td className="p-3 text-gray-600">{r.airline}</td>
                    <td className="p-3 text-right text-gray-500">
                      {r.ageHours == null ? '—' :
                        r.ageHours < 24 ? `${r.ageHours}h` : `${Math.round(r.ageHours / 24)}d`}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {r.lastChecked ? new Date(r.lastChecked).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-right text-gray-500">{r.observations}</td>
                    <td className="p-3 text-gray-400 text-xs">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Completeness */}
      <div className="bg-white rounded-lg p-6 shadow mb-8">
        <h2 className="text-xl font-black mb-4">Data Completeness</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600">With Images</p>
            <p className="text-2xl font-black text-gray-900">{data.stats.dataCompleteness.deals_with_images}</p>
          </div>
          <div>
            <p className="text-gray-600">With Notes</p>
            <p className="text-2xl font-black text-gray-900">{data.stats.dataCompleteness.deals_with_notes}</p>
          </div>
          <div>
            <p className="text-gray-600">With Airlines</p>
            <p className="text-2xl font-black text-gray-900">{data.stats.dataCompleteness.deals_with_airlines}</p>
          </div>
          <div>
            <p className="text-gray-600 text-red-600">Missing Prices</p>
            <p className="text-2xl font-black text-red-600">{data.stats.dataCompleteness.deals_missing_prices}</p>
          </div>
        </div>
      </div>

      {/* Lowest & Highest Deals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-green-500">
          <h3 className="text-lg font-black mb-4 text-green-700">💰 Lowest Deal</h3>
          {data.lowestDeal ? (
            <div className="space-y-2">
              <p><strong>Route:</strong> {data.lowestDeal.route}</p>
              <p><strong>Airline:</strong> {data.lowestDeal.airline}</p>
              <p className="text-2xl font-black text-green-600">₹{data.lowestDeal.dealPrice?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Normal: ₹{data.lowestDeal.normalPrice?.toLocaleString()}</p>
              <p><strong>Discount:</strong> {data.lowestDeal.discount}%</p>
              <p className="text-xs text-gray-400">Valid: {data.lowestDeal.dates}</p>
            </div>
          ) : (
            <p className="text-gray-500">No deals yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-amber-500">
          <h3 className="text-lg font-black mb-4 text-amber-700">💸 Highest Deal</h3>
          {data.highestDeal ? (
            <div className="space-y-2">
              <p><strong>Route:</strong> {data.highestDeal.route}</p>
              <p><strong>Airline:</strong> {data.highestDeal.airline}</p>
              <p className="text-2xl font-black text-amber-600">₹{data.highestDeal.dealPrice?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Normal: ₹{data.highestDeal.normalPrice?.toLocaleString()}</p>
              <p><strong>Discount:</strong> {data.highestDeal.discount}%</p>
              <p className="text-xs text-gray-400">Valid: {data.highestDeal.dates}</p>
            </div>
          ) : (
            <p className="text-gray-500">No deals yet</p>
          )}
        </div>
      </div>

      {/* All Deals Table */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-black mb-4">All Deals ({data.allDeals?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-bold">Route</th>
                <th className="text-left p-3 font-bold">Airline</th>
                <th className="text-right p-3 font-bold">Deal Price</th>
                <th className="text-right p-3 font-bold">Normal Price</th>
                <th className="text-right p-3 font-bold">Discount</th>
                <th className="text-left p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.allDeals?.map((deal: any) => (
                <tr key={deal.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{deal.route}</td>
                  <td className="p-3">{deal.airline}</td>
                  <td className="p-3 text-right font-semibold text-green-600">₹{deal.dealPrice?.toLocaleString()}</td>
                  <td className="p-3 text-right text-gray-500">₹{deal.normalPrice?.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-amber-600">{deal.discount}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      deal.status === 'published' ? 'bg-green-100 text-green-700' :
                      deal.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {deal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-8 text-center">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
