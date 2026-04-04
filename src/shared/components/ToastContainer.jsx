import { create } from 'zustand'
import Toast from '@/shared/components/Toast.jsx'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    return id
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const addToast = useToastStore((s) => s.addToast)
  return {
    toast: {
      success: (message, title = 'Success') => addToast({ type: 'success', message, title, autoClose: true }),
      error: (message, title = 'Error') => addToast({ type: 'error', message, title, autoClose: true }),
      warning: (message, title = 'Warning') => addToast({ type: 'warning', message, title, autoClose: true }),
      info: (message, title = 'Info') => addToast({ type: 'info', message, title, autoClose: true }),
    },
  }
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}
