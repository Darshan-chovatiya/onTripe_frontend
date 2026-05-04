import { useState, useEffect } from 'react'
import { X, ImageIcon, ImagePlus } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const fullUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http') || p.startsWith('blob:')) return p
  return `${BASE_URL}/${String(p).replace(/^\//, '')}`
}

export default function PackageImageModal({ isOpen, onClose, onSubmit, mode, pkg, loading }) {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  // Reset when modal opens/closes or pkg changes
  useEffect(() => {
    if (!isOpen) {
      previews.forEach(p => URL.revokeObjectURL(p))
      setFiles([])
      setPreviews([])
    }
  }, [isOpen])

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    previews.forEach(p => URL.revokeObjectURL(p))
    setFiles(selected)
    setPreviews(selected.map(f => URL.createObjectURL(f)))
  }

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  const handleClose = () => {
    previews.forEach(p => URL.revokeObjectURL(p))
    setFiles([]); setPreviews([])
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!files.length) return
    const fd = new FormData()
    if (mode === 'cover') {
      fd.append('coverImage', files[0])
    } else {
      files.forEach(f => fd.append('images', f))
    }
    onSubmit(fd)
  }

  const existingCover = pkg?.coverImage ? fullUrl(pkg.coverImage) : null
  const existingGallery = (pkg?.images || []).map(fullUrl).filter(Boolean)
  const isCover = mode === 'cover'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isCover ? 'Cover Image' : 'Gallery'}
      size="md"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !files.length}>
            {loading ? 'Uploading…' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1">

        {/* Existing image(s) */}
        {isCover ? (
          existingCover ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Current cover</p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <img src={existingCover} alt="Current cover" className="h-40 w-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400">No cover image yet</p>
            </div>
          )
        ) : (
          existingGallery.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current gallery ({existingGallery.length} photo{existingGallery.length > 1 ? 's' : ''})
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {existingGallery.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
                    <img src={src} alt="" className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Upload new */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isCover ? 'Replace cover' : 'Replace gallery'}
          </p>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
            files.length > 0
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-white'
          }`}>
            <input type="file" accept="image/*" multiple={!isCover} className="hidden" onChange={handleFileChange} />
            {isCover ? <ImageIcon className="h-4 w-4 shrink-0" /> : <ImagePlus className="h-4 w-4 shrink-0" />}
            {files.length > 0
              ? isCover ? `✓ ${files[0].name}` : `✓ ${files.length} photo${files.length > 1 ? 's' : ''} selected`
              : isCover ? 'Click to select new cover image' : 'Click to select new gallery photos (replaces all)'}
          </label>
        </div>

        {/* New previews */}
        {previews.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">New (pending save)</p>
            {isCover ? (
              <div className="relative overflow-hidden rounded-xl border border-amber-200">
                <img src={previews[0]} alt="New cover" className="h-40 w-full object-cover" />
                <button type="button" onClick={() => removeFile(0)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-lg border border-amber-200">
                    <img src={src} alt="" className="h-20 w-full object-cover" />
                    <button type="button" onClick={() => removeFile(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
