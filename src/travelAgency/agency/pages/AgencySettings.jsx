import ParentSettings from '@/travelAgency/parentAgency/pages/Settings.jsx'
import ChildSettings from '@/travelAgency/childAgency/pages/Settings.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencySettings() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentSettings />
  if (role === ROLES.CHILD_AGENCY) return <ChildSettings />
  return null
}
