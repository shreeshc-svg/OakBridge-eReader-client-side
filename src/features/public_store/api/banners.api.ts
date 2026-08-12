import { apiClient } from '../../../config/axios.config';
import type { Banner, BannersResponse } from '../types/banners.types';

export const banners_api = {
     get_banners: async (): Promise<BannersResponse> => {
          const response = await apiClient.get('/banners');
          return response.data;
     },
     get_all_banners: async (token: string | null): Promise<BannersResponse> => {
          const response = await apiClient.get('/banners/all', {
               headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          return response.data;
     },
     create_banner: async (token: string, data: FormData): Promise<{ message: string, banner: Banner }> => {
          const response = await apiClient.post('/banners', data, {
               headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
     },
     update_banner: async (token: string, id: string, data: FormData): Promise<{ message: string, banner: Banner }> => {
          const response = await apiClient.put(`/banners/${id}`, data, {
               headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
     },
     delete_banner: async (token: string, id: string): Promise<{ message: string }> => {
          const response = await apiClient.delete(`/banners/${id}`, {
               headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
     },
     reorder_banners: async (token: string, ids: string[]): Promise<{ message: string }> => {
          const response = await apiClient.put('/banners/reorder', { ids }, {
               headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
     }
};
