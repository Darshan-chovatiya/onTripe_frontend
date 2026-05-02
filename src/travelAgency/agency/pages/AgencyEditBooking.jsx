import ParentEditBooking from '@/travelAgency/parentAgency/pages/EditBooking.jsx'
import ChildEditBooking from '@/travelAgency/childAgency/pages/EditBooking.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyEditBooking() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentEditBooking />
  if (role === ROLES.CHILD_AGENCY) return <ChildEditBooking />
  return null
}
