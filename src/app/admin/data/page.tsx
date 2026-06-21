'use client'

import { useEffect, useState } from 'react'

export default function DataAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics')
        const json = await res.json()
        if (res.ok) {
          setData(json)
        } else {
          setError(json.error || 'Failed to fetch data')
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!data) return <div className="p-8">No data</div>

  const handleDownloadCSV = async () => {
    const response = await fetch('/api/analytics/export')
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
