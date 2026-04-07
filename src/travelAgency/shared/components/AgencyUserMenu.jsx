import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { getLoginPathForCurrentPath } from '@/shared/utils/roleHelpers.js'

function agencySettingsPath(pathname) {
  if (pathname.startsWith('/agency/parent')) return '/agency/parent/settings'
  if (pathname.startsWith('/agency/child')) return '/agency/child/settings'
  if (pathname.startsWith('/agency/sub')) return '/agency/sub/settings'
  return '/agency/child/settings'
}

function initials(name) {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function AgencyUserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  if (!user) return null

  const settingsHref = agencySettingsPath(location.pathname)

  const openLogoutConfirm = () => {
    setOpen(false)
    setLogoutConfirmOpen(true)
  }

  const performLogout = () => {
    setLogoutConfirmOpen(false)
    logout()
    navigate(getLoginPathForCurrentPath(location.pathname), { replace: true })
  }

  return (
    <>
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[min(100vw-8rem,18rem)] items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-primary-200 hover:bg-gray-50 sm:px-3"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">{user.name || 'Account'}</span>
          {user.email ? (
            <span className="block truncate text-xs text-gray-500">{user.email}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-scale-in"
          role="menu"
        >
          <Link
            to={settingsHref}
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-gray-500" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={openLogoutConfirm}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
    <ConfirmDialog
      isOpen={logoutConfirmOpen}
      onClose={() => setLogoutConfirmOpen(false)}
      onConfirm={performLogout}
      title="Confirm Logout"
      message="You will need to sign in again."
      confirmText="Logout"
      cancelText="Cancel"
      variant="danger"
    />
    </>
  )
}
