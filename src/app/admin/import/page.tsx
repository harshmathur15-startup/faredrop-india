'use client'

import { useState } from 'react'

export default function DataImportPage() {
  const [importType, setImportType] = useState<'csv' | 'json'>('csv')
  const [data, setData] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Parse CSV to JSON
  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have header row + data')

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const flights = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      if (values.length < 3) continue

      const flight: any = {}

      // Map common column names
      headers.forEach((header, idx) => {
        const value = values[idx]
        if (header.includes('origin') || header === 'from') flight.origin_iata = value
        if (header.includes('dest') || header === 'to') flight.dest_iata = value
        if (header.includes('airline')) flight.airline = value
        if (header.includes('price') || header.includes('cost')) flight.price = parseInt(value) || 0
        if (header.includes('date') || header.includes('time')) flight.observed_at = value
      })

      if (flight.origin_iata && flight.dest_iata && flight.price) {
        flights.push(flight)
      }
    }

    return flights
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const text = await selectedFile.text()
      let flightsData = []

      if (selectedFile.name.endsWith('.csv')) {
        flightsData = parseCSV(text)
      } else if (selectedFile.name.endsWith('.json')) {
        flightsData = JSON.parse(text)
        if (!Array.isArray(flightsData)) flightsData = [flightsData]
      } else {
        setError('Please upload CSV or JSON file')
        setLoading(false)
        return
      }

      const res = await fetch('/api/analytics/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: flightsData,
          source: 'flightapi-io-csv-import',
        }),
      })

      const json = await res.json()

      if (res.ok) {
        setResult(json)
        setFile(null)
        e.target.value = ''
      } else {
        setError(json.error || 'Import failed')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePasteImport = async () => {
    if (!data.trim()) {
      setError('Please paste your flight data')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let flightsData = []

      if (importType === 'csv') {
        flightsData = parseCSV(data)
      } else {
        const parsed = JSON.parse(data)
        flightsData = Array.isArray(parsed) ? parsed : [parsed]
      }

      if (flightsData.length === 0) {
        setError('No valid flight records found. Check your data format.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/analytics/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: flightsData,
          source: 'flightapi-io-paste-import',
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
      <p className="text-gray-600 mb-8">Choose how to import your FlightAPI.io data - CSV, JSON, or paste</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg p-6 shadow">
          {/* Tab Selector */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setImportType('csv')}
              className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
                importType === 'csv'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 CSV File
            </button>
            <button
              onClick={() => setImportType('json')}
              className={`pb-3 px-4 font-bold border-b-2 transition-colors ${
                importType === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {} JSON
            </button>
          </div>

          {/* CSV Upload Option */}
          {importType === 'csv' && (
            <>
              <h2 className="text-xl font-black mb-4">📊 CSV Import (Easiest!)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Export your data from FlightAPI as CSV and upload it here
              </p>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block">
                  <span className="sr-only">Choose file</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-bold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700"
                  />
                </label>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-4 font-semibold">Or paste CSV data:</p>
                <textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder={`origin,destination,airline,price,date
DEL,BKK,IndiGo,25000,2026-06-13
DEL,SIN,Air India,35000,2026-06-13
BOM,DXB,Emirates,22000,2026-06-13`}
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handlePasteImport}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? '⏳ Importing...' : '📥 Import CSV Data'}
              </button>
            </>
          )}

          {/* JSON Upload Option */}
          {importType === 'json' && (
            <>
              <h2 className="text-xl font-black mb-4">📋 JSON Import</h2>
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
  }
]`}
                className="w-full h-40 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handlePasteImport}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? '⏳ Importing...' : '📥 Import JSON Data'}
              </button>
            </>
          )}
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

          {/* Instructions - CSV */}
          {importType === 'csv' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-bold text-green-900 mb-3">✅ Simplest Way (Recommended)</p>
              <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Export from FlightAPI:</strong> Get your flight data as CSV file
                </li>
                <li>
                  <strong>Upload here:</strong> Click "Choose file" above and select your CSV
                </li>
                <li>
                  <strong>Auto-format:</strong> We automatically read the columns
                </li>
                <li>
                  <strong>Import:</strong> Click "Import CSV Data"
                </li>
                <li>
                  <strong>Done!</strong> All 1000+ records imported ✨
                </li>
              </ol>
              <p className="text-xs text-green-700 mt-4">
                📋 Your CSV should have columns: origin, destination, airline, price, date
              </p>
            </div>
          )}

          {/* Instructions - JSON */}
          {importType === 'json' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-bold text-blue-900 mb-3">📖 JSON Format</p>
              <p className="text-sm text-blue-800 mb-3">
                If you have JSON data, paste it above. We'll automatically detect all your flight records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
