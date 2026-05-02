import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-7xl',
  // lg: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  /** True edge-to-edge map / canvas */
  full: 'max-w-none w-full h-full min-h-0 max-h-[100dvh] rounded-none border-0 shadow-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const isFull = size === 'full'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex animate-fade-in bg-black/40 backdrop-blur-sm ${isFull ? 'items-stretch justify-stretch p-0' : 'items-center justify-center p-4'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-sm w-full flex flex-col animate-scale-in ${sizeClasses[size] || sizeClasses.md} ${isFull ? 'h-full max-h-[100dvh]' : 'max-h-[90vh] rounded-xl border border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex-shrink-0 flex items-center justify-between border-b border-gray-200 bg-white ${isFull ? 'px-4 py-3 sm:px-5' : 'p-6 rounded-t-xl'}`}>
          <h2 className={`font-semibold text-gray-900 ${isFull ? 'text-base sm:text-lg pr-2' : 'text-xl'}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`min-h-0 flex-1 ${isFull ? 'overflow-hidden p-0' : 'overflow-y-auto p-6'}`}>{children}</div>
        {footer ? (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white rounded-b-xl">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
