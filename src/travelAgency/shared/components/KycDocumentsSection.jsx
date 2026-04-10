import { useState } from 'react'
import { FileText, X, ChevronLeft, ChevronRight, Upload, XCircle, CheckCircle, Clock } from 'lucide-react'
import { filePublicUrl } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

const DOC_LABELS = {
  aadharFront: 'Aadhar Front',
  aadharBack:  'Aadhar Back',
  panCard:     'PAN Card',
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

export default function KycDocumentsSection({ kyc, onUpdateKyc, loadingUpdate, onEditOpen }) {
  const [lightbox, setLightbox] = useState(null) // { index, docs }
  const [isEditing, setIsEditing] = useState(false)
  const [files, setFiles] = useState({ aadharFront: null, aadharBack: null, panCard: null })

  if (!kyc && !isEditing) return null

  const namedDocs = ['aadharFront', 'aadharBack', 'panCard']
    .filter(k => kyc && kyc[k])
    .map(k => ({ label: DOC_LABELS[k], path: kyc[k] }))

  const otherDocs = (kyc?.otherDocs || [])
    .filter(Boolean)
    .map((path, i) => ({ label: `Other Doc ${i + 1}`, path }))

  const allDocs = [...namedDocs, ...otherDocs]

  const openLightbox = (index) => setLightbox({ index, docs: allDocs })

  const prev = () => setLightbox(l => ({ ...l, index: (l.index - 1 + l.docs.length) % l.docs.length }))
  const next = () => setLightbox(l => ({ ...l, index: (l.index + 1) % l.docs.length }))

  const handleFileChange = (e, key) => {
    if (e.target.files?.length) {
      setFiles(prev => ({ ...prev, [key]: e.target.files[0] }))
    }
  }

  const handleUpdate = async () => {
    const formData = new FormData()
    if (files.aadharFront) formData.append('aadharFront', files.aadharFront)
    if (files.aadharBack) formData.append('aadharBack', files.aadharBack)
    if (files.panCard) formData.append('panCard', files.panCard)
    
    if (!formData.has('aadharFront') && !formData.has('aadharBack') && !formData.has('panCard')) {
      setIsEditing(false)
      return
    }

    if (onUpdateKyc) {
      const result = await onUpdateKyc(formData)
      if (result === false) return
    }
    setIsEditing(false)
    setFiles({ aadharFront: null, aadharBack: null, panCard: null })
  }

  return (
    <>
      <div className="space-y-3">
        {kyc?.aadharNumber && !isEditing && (
          <p className="text-sm text-gray-600">
            Aadhar Number: <span className="font-medium text-gray-900">{kyc.aadharNumber}</span>
          </p>
        )}

        {isEditing ? (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <h4 className="text-sm font-semibold text-gray-800">Upload New Documents</h4>
            <div className="space-y-3">
              {Object.keys(DOC_LABELS).map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">{DOC_LABELS[key]}</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, key)}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button disabled={loadingUpdate} type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button disabled={loadingUpdate} type="button" onClick={handleUpdate} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-50">
                {loadingUpdate ? 'Saving...' : 'Submit Documents'}
              </button>
            </div>
          </div>
        ) : (
          <div>
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
            
            {(kyc?.status === 'pending' || kyc?.status === 'rejected' || !kyc) && onUpdateKyc && (
               <div className="mt-3">
                 <button
                   type="button"
                   onClick={() => {
                     onEditOpen?.()
                     setIsEditing(true)
                   }}
                   className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                 >
                   <Upload size={14} className="text-gray-500" /> Replace Documents
                 </button>
               </div>
            )}
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
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

