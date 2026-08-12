import { useState, useEffect, useCallback } from 'react';
import { banners_api } from '../api/banners.api';
import type { Banner } from '../types/banners.types';
import { useAuthStore } from '../../../store/auth.store';

export const useBanners = () => {
     const [banners, setBanners] = useState<Banner[]>([]);
     const [allBanners, setAllBanners] = useState<Banner[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const accessToken = useAuthStore((state) => state.accessToken);

     const fetchBanners = useCallback(async () => {
          setIsLoading(true);
          try {
               const response = await banners_api.get_banners();
               setBanners(response.banners);
          } catch (err: unknown) {
               setError('Failed to fetch banners');
          } finally {
               setIsLoading(false);
          }
     }, []);

     const fetchAllBanners = useCallback(async () => {
          setIsLoading(true);
          try {
               const response = await banners_api.get_all_banners(accessToken);
               setAllBanners(response.banners);
          } catch (err: unknown) {
               setError('Failed to fetch all banners');
          } finally {
               setIsLoading(false);
          }
     }, [accessToken]);

     useEffect(() => {
          fetchBanners();
     }, [fetchBanners]);

     const createBanner = async (data: FormData) => {
          if (!accessToken) throw new Error('Not authenticated');
          const res = await banners_api.create_banner(accessToken, data);
          await fetchAllBanners();
          return res;
     };

     const updateBanner = async (id: string, data: FormData) => {
          if (!accessToken) throw new Error('Not authenticated');
          const res = await banners_api.update_banner(accessToken, id, data);
          await fetchAllBanners();
          return res;
     };

     const deleteBanner = async (id: string) => {
          if (!accessToken) throw new Error('Not authenticated');
          const res = await banners_api.delete_banner(accessToken, id);
          await fetchAllBanners();
          return res;
     };

     const reorderBanners = async (ids: string[]) => {
          if (!accessToken) throw new Error('Not authenticated');
          const res = await banners_api.reorder_banners(accessToken, ids);
          await fetchAllBanners();
          return res;
     };

     return { 
          banners, 
          allBanners,
          isLoading, 
          error, 
          fetchBanners, 
          fetchAllBanners, 
          createBanner, 
          updateBanner, 
          deleteBanner,
          reorderBanners
     };
};
