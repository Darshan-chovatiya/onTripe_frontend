import ParentManageChildren from '@/travelAgency/parentAgency/pages/ManageChildren.jsx'
import ChildManageSubChildren from '@/travelAgency/childAgency/pages/ManageSubChildren.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyManageDownstream() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentManageChildren />
  if (role === ROLES.CHILD_AGENCY) return <ChildManageSubChildren />
  return null
}
