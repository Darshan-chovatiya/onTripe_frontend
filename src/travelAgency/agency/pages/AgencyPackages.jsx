import ParentPackages from '@/travelAgency/parentAgency/pages/Packages.jsx'
import ChildPackages from '@/travelAgency/childAgency/pages/Packages.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyPackages() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentPackages />
  if (role === ROLES.CHILD_AGENCY) return <ChildPackages />
  return null
}
