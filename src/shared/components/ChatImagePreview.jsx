import { X } from 'lucide-react'

/**
 * Full-screen image/video preview (same pattern as community chat).
 * @param {{ src: string | null, type?: 'image' | 'video', onClose: () => void }} props
 */
export default function ChatImagePreview({ src, type = 'image', onClose }) {
  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-10 rounded-full p-2 text-white hover:bg-white/10 sm:-top-12"
          aria-label="Close"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
        {type === 'video' ? (
          <video src={src} controls autoPlay className="max-h-[85vh] w-full rounded-lg" />
        ) : (
          <img src={src} alt="" className="max-h-[85vh] w-full rounded-lg object-contain" />
        )}
      </div>
    </div>
  )
}
