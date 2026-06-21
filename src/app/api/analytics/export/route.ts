import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all deals
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .order('deal_price', { ascending: true })

    if (dealsError) throw dealsError

    // Fetch price history
    const { data: priceHistory, error: priceError } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .order('observed_at', { ascending: false })

    if (priceError) throw priceError

    // Generate CSV for deals
    const dealsCSVHeaders = [
      'Deal ID',
      'Status',
      'Origin City',
      'Origin IATA',
      'Destination City',
      'Destination IATA',
      'Airline',
      'Deal Price (₹)',
      'Normal Price (₹)',
      'Discount %',
      'Currency',
      'Validity Start',
      'Validity End',
      'Curator Note',
      'Image URL',
      'Source URL',
      'Created At',
      'Published At',
    ]

    const dealsCSVRows = deals?.map((d: any) => [
      d.id,
      d.status,
      d.origin_city,
      d.origin_iata,
      d.dest_city,
      d.dest_iata,
      d.airline,
      d.deal_price,
      d.normal_price,
      d.discount_percentage,
      d.currency,
      d.validity_start,
      d.validity_end,
      `"${d.curator_note?.replace(/"/g, '""') || ''}"`,
      d.image_url,
      d.source_url,
      d.created_at,
      d.published_at,
    ]) || []

    // Generate CSV for price history
    const priceCSVHeaders = [
      'Origin IATA',
      'Destination IATA',
      'Airline',
      'Observed Price (₹)',
      'Observed At',
      'Data Source',
    ]

    const priceCSVRows = priceHistory?.map((p: any) => [
      p.origin_iata,
      p.dest_iata,
      p.airline,
      p.observed_price_inr,
      p.observed_at,
      p.data_source,
    ]) || []

    // Create CSV content
    const timestamp = new Date().toISOString().split('T')[0]
    const dealsCSV = [
      `FAREDROP DATA EXPORT - ${timestamp}`,
      '',
      'DEALS DATA',
      dealsCSVHeaders.join(','),
      ...dealsCSVRows.map(row =>
        row.map(val => {
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
      '',
      '',
      'PRICE HISTORY DATA',
      priceCSVHeaders.join(','),
      ...priceCSVRows.map(row => row.join(',')),
    ].join('\n')

    // Also create a summary CSV
    const dealPrices = deals?.map((d: any) => d.deal_price).filter(Boolean) || []
    const normalPrices = deals?.map((d: any) => d.normal_price).filter(Boolean) || []

    const summaryCSV = [
      'FAREDROP DATA SUMMARY',
      `Export Date,${new Date().toISOString()}`,
      '',
      'STATISTICS',
      'Metric,Value',
      `Total Deals,${deals?.length || 0}`,
      `Published Deals,${deals?.filter((d: any) => d.status === 'published').length || 0}`,
      `Draft Deals,${deals?.filter((d: any) => d.status === 'draft').length || 0}`,
      `Archived Deals,${deals?.filter((d: any) => d.status === 'archived').length || 0}`,
      '',
      'DEAL PRICES',
      'Metric,Value (₹)',
      `Minimum Deal Price,"₹${Math.min(...dealPrices).toLocaleString('en-IN')}"`,
      `Maximum Deal Price,"₹${Math.max(...dealPrices).toLocaleString('en-IN')}"`,
      `Average Deal Price,"₹${Math.round(dealPrices.reduce((a: number, b: number) => a + b) / dealPrices.length).toLocaleString('en-IN')}"`,
      '',
      'NORMAL PRICES',
      'Metric,Value (₹)',
      `Minimum Normal Price,"₹${Math.min(...normalPrices).toLocaleString('en-IN')}"`,
      `Maximum Normal Price,"₹${Math.max(...normalPrices).toLocaleString('en-IN')}"`,
      `Average Normal Price,"₹${Math.round(normalPrices.reduce((a: number, b: number) => a + b) / normalPrices.length).toLocaleString('en-IN')}"`,
      '',
      'DATA COMPLETENESS',
      'Metric,Count',
      `Deals with Images,${deals?.filter((d: any) => d.image_url).length || 0}`,
      `Deals with Notes,${deals?.filter((d: any) => d.curator_note).length || 0}`,
      `Deals with Airlines,${deals?.filter((d: any) => d.airline).length || 0}`,
      `Deals Missing Prices,${deals?.filter((d: any) => !d.deal_price || !d.normal_price).length || 0}`,
      '',
      'ROUTES',
      'Metric,Count',
      `Unique Routes,${deals?.length || 0}`,
      `Unique Origins,${[...new Set(deals?.map((d: any) => d.origin_iata))].length || 0}`,
      `Unique Destinations,${[...new Set(deals?.map((d: any) => d.dest_iata))].length || 0}`,
      '',
      'PRICE HISTORY',
      'Metric,Count',
      `Total Price Records,${priceHistory?.length || 0}`,
    ].join('\n')

    // Return both CSVs as a combined file
    const combinedCSV = `${summaryCSV}\n\n\n${dealsCSV}`

    return new NextResponse(combinedCSV, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="travelbaby-data-${timestamp}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
