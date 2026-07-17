'use client'
import dynamic from 'next/dynamic'
import { InvoicePdf } from './invoice-pdf'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-xs text-gray-400 px-3 py-1.5">Loading...</span> }
)

export function InvoiceDownloadButton({ invoice }: { invoice: any }) {
  return (
    <PDFDownloadLink
      document={<InvoicePdf invoice={invoice} />}
      fileName={`${invoice.invoice_number}.pdf`}
      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full font-medium transition-colors"
    >
      {({ loading }: { loading: boolean }) => (loading ? 'Preparing...' : 'Download PDF')}
    </PDFDownloadLink>
  )
}
