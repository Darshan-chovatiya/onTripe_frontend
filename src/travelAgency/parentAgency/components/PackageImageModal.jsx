import { useState } from 'react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

export default function PackageImageModal({ isOpen, onClose, onSubmit, mode, loading }) {
  const [files, setFiles] = useState([])

  const handleClose = () => { setFiles([]); onClose() }

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title={mode === 'cover' ? 'Update Cover Image' : 'Update Gallery'}
      size="sm"
      footer={
        <div className="flex justify-end gap-3 p-4">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !files.length}>
            {loading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          {mode === 'cover'
            ? 'Select a new cover image. This will replace the existing one.'
            : 'Select up to 10 images. This will replace the existing gallery.'}
        </p>
        <input
          type="file"
          accept="image/*"
          multiple={mode === 'gallery'}
          className="input-field"
          onChange={e => setFiles(Array.from(e.target.files))}
        />
        {files.length > 0 && (
          <p className="text-xs text-gray-400">{files.length} file(s) selected</p>
        )}
      </div>
    </Modal>
  )
}
