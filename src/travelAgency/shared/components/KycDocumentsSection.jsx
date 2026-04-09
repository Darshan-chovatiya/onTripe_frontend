import { FileText } from 'lucide-react'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const DOC_LABELS = {
  aadharFront: 'Aadhar Front',
  aadharBack:  'Aadhar Back',
  panCard:     'PAN Card',
}

/**
 * @param {{ kyc: object | null | undefined }} props
 */
export default function KycDocumentsSection({ kyc }) {
  if (!kyc) return null

  const namedDocs = ['aadharFront', 'aadharBack', 'panCard']
    .filter(k => kyc[k])
    .map(k => ({ label: DOC_LABELS[k], path: kyc[k] }))

  const otherDocs = (kyc.otherDocs || [])
    .filter(Boolean)
    .map((path, i) => ({ label: `Other Doc ${i + 1}`, path }))

  const allDocs = [...namedDocs, ...otherDocs]

  const aadharNumber = kyc.aadharNumber

  if (!aadharNumber && allDocs.length === 0) return null

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">KYC Documents</h2>
          <p className="text-xs text-gray-500">Documents submitted for identity verification.</p>
        </div>
      </div>

      {aadharNumber && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">Aadhar Number: </span>
          <span className="text-gray-900">{aadharNumber}</span>
        </div>
      )}

      {allDocs.length === 0 ? (
        <p className="text-sm text-gray-400">No documents uploaded.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allDocs.map((d) => {
            const href = filePublicUrl(d.path)
            return href ? (
              <a
                key={d.label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100 hover:bg-violet-100 transition-colors"
              >
                <FileText className="h-3 w-3" />
                {d.label}
              </a>
            ) : (
              <span
                key={d.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500"
              >
                <FileText className="h-3 w-3" />
                {d.label}
              </span>
            )
          })}
        </div>
      )}
    </section>
  )
}
