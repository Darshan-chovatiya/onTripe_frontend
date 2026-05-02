import { useState, useCallback, useEffect } from 'react';
import { listBookings, createBooking, getBooking, updateBooking } from '../services/parentAgencyApi';

export function useParentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 0, totalCount: 0 });

  const fetchBookings = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await listBookings({ 
        page: pagination.page, 
        limit: pagination.limit, 
        ...params 
      });
      setBookings(res.data?.data?.bookings || []);
      setPagination(res.data?.data?.pagination || pagination);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const create = useCallback(async (data) => {
    const res = await createBooking(data);
    return res.data;
  }, []);

  const getDetail = useCallback(async (id) => {
    const res = await getBooking(id);
    return res.data?.data?.booking;
  }, []);

  const update = useCallback(async (id, data) => {
    const res = await updateBooking(id, data);
    return res.data;
  }, []);

  return {
    bookings,
    loading,
    error,
    pagination,
    fetchBookings,
    create,
    getDetail,
    update,
    setPagination
  };
}
