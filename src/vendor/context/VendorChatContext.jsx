import { createContext, useCallback, useContext, useState } from 'react'
import CustomerChatModal from '@/vendor/components/CustomerChatModal.jsx'
import VendorAgentChatModal from '@/vendor/components/VendorAgentChatModal.jsx'

const VendorChatContext = createContext(null)

export function VendorChatProvider({ children }) {
  const [customerChat, setCustomerChat] = useState(null)
  const [agentChatOpen, setAgentChatOpen] = useState(false)

  const openCustomerChat = useCallback(({ bookingId, customer }) => {
    const id = customer?._id || customer?.id
    if (!bookingId || !id) return
    setCustomerChat({
      bookingId,
      customer: {
        id,
        _id: id,
        name: customer.name || 'Customer',
        phone: customer.phone,
        email: customer.email,
      },
    })
  }, [])

  const closeCustomerChat = useCallback(() => setCustomerChat(null), [])
  const openAgentChat = useCallback(() => setAgentChatOpen(true), [])
  const closeAgentChat = useCallback(() => setAgentChatOpen(false), [])

  /** @returns {boolean} true if handled (no route navigation needed) */
  const handleVendorNotification = useCallback(
    (notification) => {
      const d = notification?.data || {}
      const type = notification?.type

      if (type === 'vendor_dm' && d.customerId) {
        const bid = d.bookingMongoId || d.bookingId
        if (!bid) return false
        openCustomerChat({
          bookingId: bid,
          customer: {
            _id: d.customerId,
            id: d.customerId,
            name: notification.senderName || 'Customer',
          },
        })
        return true
      }

      if (type === 'agency_dm') {
        openAgentChat()
        return true
      }

      return false
    },
    [openCustomerChat, openAgentChat]
  )

  return (
    <VendorChatContext.Provider
      value={{
        openCustomerChat,
        closeCustomerChat,
        openAgentChat,
        closeAgentChat,
        handleVendorNotification,
      }}
    >
      {children}
      <CustomerChatModal
        key={customerChat ? `${customerChat.bookingId}-${customerChat.customer?.id}` : 'closed'}
        isOpen={!!customerChat}
        onClose={closeCustomerChat}
        bookingId={customerChat?.bookingId}
        customer={customerChat?.customer}
      />
      <VendorAgentChatModal isOpen={agentChatOpen} onClose={closeAgentChat} />
    </VendorChatContext.Provider>
  )
}

export function useVendorChat() {
  const ctx = useContext(VendorChatContext)
  if (!ctx) {
    throw new Error('useVendorChat must be used within VendorChatProvider')
  }
  return ctx
}
