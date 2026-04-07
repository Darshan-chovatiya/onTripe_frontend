import ParentBookings from '@/travelAgency/parentAgency/pages/Bookings.jsx'
import ChildBookings from '@/travelAgency/childAgency/pages/Bookings.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'

export default function AgencyBookings() {
  const { role } = useAgencyPermissions()

  if (role === ROLES.PARENT_AGENCY) return <ParentBookings />
  if (role === ROLES.CHILD_AGENCY) return <ChildBookings />
  return null
}
