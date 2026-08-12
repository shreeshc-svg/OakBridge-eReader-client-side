import { useState, useCallback } from 'react';
import { dashboard_api } from '../api/dashboard_api';
import type { DashboardOverviewData } from '../types/dashboard.types';
import type { SuperadminOverviewResponse } from '../api/dashboard_api';

export const useDashboard = () => {
     const [data, setData] = useState<DashboardOverviewData | null>(null);
     const [superadminData, setSuperadminData] = useState<
          SuperadminOverviewResponse['data'] | null
     >(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const fetchUserOverview = useCallback(async () => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await dashboard_api.get_user_overview();
               setData(response.data);
          } catch (err: unknown) {
               const error = err as {
                    response?: { data?: { message?: string } };
               };
               setError(
                    error.response?.data?.message ||
                         'Failed to fetch dashboard data'
               );
          } finally {
               setIsLoading(false);
          }
     }, []);

     const fetchSuperadminOverview = useCallback(async () => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await dashboard_api.get_superadmin_overview();
               setSuperadminData(response.data);
          } catch (err: unknown) {
               const error = err as {
                    response?: { data?: { message?: string } };
               };
               setError(
                    error.response?.data?.message ||
                         'Failed to fetch superadmin dashboard data'
               );
          } finally {
               setIsLoading(false);
          }
     }, []);

     return {
          data,
          superadminData,
          isLoading,
          error,
          fetchUserOverview,
          fetchSuperadminOverview,
     };
};
