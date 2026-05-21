/**
 * Match booking URL param against a populated booking object (mongo _id or human bookingId).
 */
export function bookingParamMatches(booking, bookingParam) {
  if (!booking || !bookingParam) return false
  const p = String(bookingParam)
  return String(booking._id) === p || String(booking.bookingId) === p
}

/**
 * Find vendor customer chat row for notification deep-link params.
 */
export function findVendorChatByParams(chats, bookingParam, customerParam) {
  if (!bookingParam || !customerParam || !Array.isArray(chats)) return null
  const cid = String(customerParam)
  return (
    chats.find(
      (c) =>
        String(c.customer?._id) === cid && bookingParamMatches(c.booking, bookingParam)
    ) || null
  )
}
