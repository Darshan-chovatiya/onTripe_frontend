import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, ArrowRight } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (toast.autoClose) {
      const t = setTimeout(onClose, toast.duration || 4000)
      return () => clearTimeout(t)
    }
  }, [toast, onClose])

  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info }
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }
  const Icon = icons[toast.type] || Info
  const colorClass = colors[toast.type] || colors.info
  const isClickable = Boolean(toast.href)

  const handleClick = () => {
    if (!toast.href) return
    onClose()
    navigate(toast.href)
  }

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`flex min-w-[280px] max-w-md items-center gap-3 rounded-xl border p-4 shadow-lg ${colorClass} animate-fade-in ${isClickable ? 'cursor-pointer hover:brightness-95 transition-all' : ''}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1 text-sm">
        {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
        <p>{toast.message}</p>
      </div>
      {isClickable && (
        <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-60" />
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="rounded p-1 hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
