import { apiClient } from '../../../config/axios.config';
import type { DashboardOverviewData } from '../types/dashboard.types';

export interface SuperadminDashboardStats {
     total_books: number;
     total_pages: number;
     total_chapters: number;
     total_readers: number;
     avg_completion: number;
     total_shelved: number;
     total_revenue: number;
     weeklyGrowthPercent: number;
     monthlyGrowthPercent: number;
}

export interface SuperadminLatestBook {
     id: string;
     title: string;
     description: string;
     author: string;
     publisher: string;
     language: string;
     isbn: string;
     total_pages: number;
     total_chapters: number;
     cover_url: string;
     created_at: string;
}

export interface SuperadminManuscript {
     id: string;
     title: string;
     description: string;
     author: string;
     publisher: string;
     language: string;
     isbn: string;
     total_pages: number;
     total_chapters: number;
     cover_url: string;
     created_at: string;
}

export interface SuperadminOverviewResponse {
     message: string;
     data: {
          stats: SuperadminDashboardStats;
          latest_book: SuperadminLatestBook | null;
          manuscripts: SuperadminManuscript[];
     };
}

export const dashboard_api = {
     get_user_overview: async () => {
          const response = await apiClient.get<{
               message: string;
               data: DashboardOverviewData;
          }>('/dashboard/user-overview');
          return response.data;
     },

     get_superadmin_overview: async () => {
          const response =
               await apiClient.get<SuperadminOverviewResponse>(
                    '/dashboard/superadmin-overview'
               );
          return response.data;
     },

     get_revenue_analytics: async () => {
          const response = await apiClient.get<{
               success: boolean;
               data: {
                    totalRevenue: number;
                    averageSpending: number;
                    bestPerformingProduct: { name: string; count: number } | null;
                    leastPerformingProduct: { name: string; count: number } | null;
                    weeklyGrowthPercent: number;
                    monthlyGrowthPercent: number;
                    reviews: {
                         total: number;
                         approved: number;
                         pending: number;
                         rejected: number;
                    };
               };
          }>('/superadmin/analytics/revenue');
          return response.data;
     },

     get_activity_logs: async (page: number, limit: number, timeframe: string = 'all') => {
          const response = await apiClient.get<{
               success: boolean;
               data: {
                    logs: Array<{
                         id: string;
                         userId: string;
                         email: string | null;
                         action: string;
                         details: any;
                         createdAt: string;
                    }>;
                    pagination: {
                         page: number;
                         limit: number;
                         totalLogs: number;
                         totalPages: number;
                    };
               };
          }>(`/superadmin/analytics/logs?page=${page}&limit=${limit}&timeframe=${timeframe}`);
          return response.data;
     },

     get_readers_list: async () => {
          const response = await apiClient.get<{
               message: string;
               data: {
                    readers: Array<{
                         id: string;
                         username: string;
                         email: string;
                         joined: string;
                         right_click_allowed: boolean;
                    }>;
               };
          }>('/dashboard/readers-list');
          return response.data;
     },

     toggle_right_click: async (userId: string, allowed: boolean) => {
          const response = await apiClient.patch<{
               message: string;
          }>('/dashboard/toggle-right-click', { userId, allowed });
          return response.data;
     },

     get_report_data: async (params: {
          type: string;
          startDate?: string;
          endDate?: string;
          groupBy?: string;
          category?: string;
          sort?: string;
     }) => {
          const query = new URLSearchParams();
          if (params.type) query.append('type', params.type);
          if (params.startDate) query.append('startDate', params.startDate);
          if (params.endDate) query.append('endDate', params.endDate);
          if (params.groupBy) query.append('groupBy', params.groupBy);
          if (params.category) query.append('category', params.category);
          if (params.sort) query.append('sort', params.sort);

          const response = await apiClient.get<{
               success: boolean;
               data: {
                    kpis: Record<string, any>;
                    rows: Array<Record<string, any>>;
               };
          }>(`/superadmin/analytics/reports?${query.toString()}`);
          return response.data;
     },
};
