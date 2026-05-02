import ParentCreateBooking from '@/travelAgency/parentAgency/pages/CreateBooking.jsx'
import ChildCreateBooking from '@/travelAgency/childAgency/pages/CreateBooking.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyCreateBooking() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentCreateBooking />
  if (role === ROLES.CHILD_AGENCY) return <ChildCreateBooking />
  return null
}
