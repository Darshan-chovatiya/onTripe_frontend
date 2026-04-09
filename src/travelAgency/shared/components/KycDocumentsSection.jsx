import { useState } from 'react'
import { FileText, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const DOC_LABELS = {
  aadharFront: 'Aadhar Front',
  aadharBack:  'Aadhar Back',
  panCard:     'PAN Card',
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

export default function KycDocumentsSection({ kyc }) {
  const [lightbox, setLightbox] = useState(null) // { index, docs }

  if (!kyc) return null

  const namedDocs = ['aadharFront', 'aadharBack', 'panCard']
    .filter(k => kyc[k])
    .map(k => ({ label: DOC_LABELS[k], path: kyc[k] }))

  const otherDocs = (kyc.otherDocs || [])
    .filter(Boolean)
    .map((path, i) => ({ label: `Other Doc ${i + 1}`, path }))

  const allDocs = [...namedDocs, ...otherDocs]

  if (!kyc.aadharNumber && allDocs.length === 0) return null

  const openLightbox = (index) => setLightbox({ index, docs: allDocs })

  const prev = () => setLightbox(l => ({ ...l, index: (l.index - 1 + l.docs.length) % l.docs.length }))
  const next = () => setLightbox(l => ({ ...l, index: (l.index + 1) % l.docs.length }))

  return (
    <>
      <div className="space-y-3">
        {kyc.aadharNumber && (
          <p className="text-sm text-gray-600">
            Aadhar Number: <span className="font-medium text-gray-900">{kyc.aadharNumber}</span>
          </p>
        )}

        {allDocs.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allDocs.map((d, i) => {
              const href = filePublicUrl(d.path)
              const img = href && isImage(href)
              return (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => href && openLightbox(i)}
                  disabled={!href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100 hover:bg-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-3 w-3" />
                  {d.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (() => {
        const doc = lightbox.docs[lightbox.index]
        const href = filePublicUrl(doc.path)
        const img = href && isImage(href)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">{doc.label}</span>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-center justify-center bg-gray-50 min-h-[300px] max-h-[70vh] overflow-auto p-4">
                {img ? (
                  <img src={href} alt={doc.label} className="max-w-full max-h-[60vh] rounded-lg object-contain" />
                ) : href ? (
                  <div className="text-center space-y-3">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-500">Preview not available for this file type.</p>
                    <a
                      href={href}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                    >
                      Download {doc.label}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">File not available.</p>
                )}
              </div>

              {/* Navigation */}
              {lightbox.docs.length > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={prev}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs text-gray-400">{lightbox.index + 1} / {lightbox.docs.length}</span>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
