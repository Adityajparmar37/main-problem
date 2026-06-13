import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../api/analyticsApi';

export function useAnalytics() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes, reportRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getTrends(),
        analyticsApi.getReport(),
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setReport(reportRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { overview, trends, report, isLoading, error, refetch: fetchAll };
}
