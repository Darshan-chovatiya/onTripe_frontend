import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  if (!isOpen) return null

  const variants = {
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-sm',
    warning: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-sm',
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-6 animate-scale-in border border-gray-200">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
              variant === 'danger' ? 'bg-red-100' : variant === 'warning' ? 'bg-amber-100' : 'bg-primary-100'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                variant === 'danger' ? 'text-red-600' : variant === 'warning' ? 'text-amber-600' : 'text-primary-600'
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <div className="text-sm text-gray-600 mb-6">{message}</div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${variants[variant]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
