import { ROLES } from '@/shared/utils/constants.js'
import { DEV_AGENCY_ROLE_STORAGE_KEY } from '@/travelAgency/agency/constants.js'
import { useAgencyPermissions, getEffectiveAgencyRole } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { AGENCY_ROLE_LABELS } from '@/travelAgency/agency/rbac/agencyPermissions.js'

const OPTIONS = [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD]

/**
 * Dev-only: override effective agency role to preview RBAC without re-login.
 */
export default function AgencyDevRoleSwitcher() {
  if (!import.meta.env.DEV) return null

  const { authRole } = useAgencyPermissions()
  const effective = getEffectiveAgencyRole(authRole)

  const setOverride = (/** @type {string | null} */ value) => {
    try {
      if (value == null) localStorage.removeItem(DEV_AGENCY_ROLE_STORAGE_KEY)
      else localStorage.setItem(DEV_AGENCY_ROLE_STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('ontrip-dev-agency-role'))
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-xs rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-amber-900">Dev: agency role preview</p>
      <p className="mb-2 text-amber-800">
        Auth role: <span className="font-mono">{authRole || '—'}</span>
        <br />
        Effective: <span className="font-mono">{effective || '—'}</span>
      </p>
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setOverride(r)}
            className={`rounded-lg px-2 py-1 font-mono text-[10px] ${
              effective === r ? 'bg-amber-600 text-white' : 'bg-white text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100'
            }`}
          >
            {AGENCY_ROLE_LABELS[r]}
          </button>
        ))}
        <button type="button" onClick={() => setOverride(null)} className="rounded-lg bg-white px-2 py-1 font-mono text-[10px] text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
          Clear
        </button>
      </div>
    </div>
  )
}
