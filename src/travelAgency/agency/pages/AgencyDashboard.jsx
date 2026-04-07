import ParentDashboard from '@/travelAgency/parentAgency/pages/Dashboard.jsx'
import ChildDashboard from '@/travelAgency/childAgency/pages/Dashboard.jsx'
import SubDashboard from '@/travelAgency/subChild/pages/Dashboard.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyDashboard() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentDashboard />
  if (role === ROLES.CHILD_AGENCY) return <ChildDashboard />
  if (role === ROLES.SUB_CHILD) return <SubDashboard />
  return null
}
