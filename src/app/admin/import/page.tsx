'use client'

import { useState } from 'react'

export default function DataImportPage() {
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!data.trim()) {
      setError('Please paste your flight data')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Try to parse as JSON
      let flightsData = []
      try {
        const parsed = JSON.parse(data)
        flightsData = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        // If not JSON, try CSV parsing
        setError('Data must be valid JSON array of flights')
        setLoading(false)
        return
      }

      const res = await fetch('/api/analytics/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: flightsData,
          source: 'flightapi-io-import',
        }),
      })

      const json = await res.json()

      if (res.ok) {
        setResult(json)
        setData('')
      } else {
        setError(json.error || 'Import failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-black mb-2 text-gray-900">Import Flight Data</h1>
      <p className="text-gray-600 mb-8">Paste your FlightAPI.io response data (JSON) to import all flight records</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-black mb-4">1️⃣ Paste Your Flight Data</h2>
          <p className="text-sm text-gray-600 mb-4">Expected format: JSON array of flight objects</p>

          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder={`[
  {
    "origin_iata": "DEL",
    "dest_iata": "BKK",
    "airline": "IndiGo",
    "price": 25000,
    "observed_at": "2026-06-13T00:00:00Z"
  },
  ...
]`}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleImport}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? '⏳ Importing...' : '📥 Import Data'}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-xl font-black mb-4">2️⃣ Import Results</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-bold mb-2">❌ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-bold text-green-700 mb-3">✅ Success!</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Imported:</strong>{' '}
                      <span className="text-2xl font-black text-green-600">
                        {result.importedCount}
                      </span>{' '}
                      records
                    </p>
                    <p>
                      <strong>Attempted:</strong> {result.totalAttempted}
                    </p>
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-bold text-amber-600">⚠️ Some errors occurred:</p>
                        <ul className="mt-2 list-disc list-inside text-red-600">
                          {result.errors.slice(0, 5).map((err: string, i: number) => (
                            <li key={i} className="text-xs">
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href="/admin/data"
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  📊 View Updated Analytics
                </a>
              </div>
            )}

            {!error && !result && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
                <p className="font-bold mb-2">📝 Data Format Required</p>
                <p className="mb-3">Your FlightAPI response must be a JSON array:</p>
                <code className="block bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {`[
  {
    "origin_iata": "DEL",
    "dest_iata": "BKK",
    "airline": "IndiGo",
    "price": 25000,
    "observed_at": "2026-06-13"
  }
]`}
                </code>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-bold text-amber-900 mb-3">📖 How to get FlightAPI data</p>
            <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
              <li>Run your FlightAPI.io scraper</li>
              <li>Export results as JSON array</li>
              <li>Paste into the textarea above</li>
              <li>Click "Import Data"</li>
              <li>View results in Analytics dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
