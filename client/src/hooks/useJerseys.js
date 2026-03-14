import { useState, useCallback } from 'react';
import { jerseyService } from '@/services/api';

export function useJerseys(defaultParams = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ page: 1, limit: 50, ...defaultParams });

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const merged = { ...params, ...overrides };
      const res = await jerseyService.getAll(merged);
      setData(res.data.data);
      setTotal(res.data.total);
      setParams(merged);
    } finally {
      setLoading(false);
    }
  }, [params]);

  return { data, total, loading, params, fetch, setData };
}
