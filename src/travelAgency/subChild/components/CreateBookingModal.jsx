import AgencyCreateBookingModal from '@/travelAgency/shared/components/AgencyCreateBookingModal.jsx'
import { listCustomers, getCustomerByPhone } from '@/travelAgency/subChild/services/subChildApi.js'

export default function CreateBookingModal(props) {
  return (
    <AgencyCreateBookingModal
      {...props}
      listCustomers={listCustomers}
      getCustomerByPhone={getCustomerByPhone}
    />
  )
}
