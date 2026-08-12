import { apiClient } from '../../../config/axios.config';

export interface Coupon {
     id: string;
     code: string;
     discount_type: 'percentage' | 'flat';
     discount_value: number;
     min_order_amount: number | null;
     max_discount_amount: number | null;
     expires_at: string | null;
     usage_limit: number | null;
     used_count: number;
     is_active: boolean;
     createdAt: string;
}

export const couponsApi = {
     // Fetch all coupons for superadmin management
     fetchCoupons: async (): Promise<Coupon[]> => {
          const response = await apiClient.get('/superadmin/coupons');
          return response.data.data;
     },

     // Create a new coupon
     createCoupon: async (coupon: Omit<Coupon, 'id' | 'used_count' | 'createdAt'>): Promise<Coupon> => {
          const response = await apiClient.post('/superadmin/coupons', coupon);
          return response.data.data;
     },

     // Update an existing coupon
     updateCoupon: async (id: string, coupon: Partial<Omit<Coupon, 'id' | 'used_count' | 'createdAt'>>): Promise<Coupon> => {
          const response = await apiClient.put(`/superadmin/coupons/${id}`, coupon);
          return response.data.data;
     },

     // Delete a coupon
     deleteCoupon: async (id: string): Promise<Coupon> => {
          const response = await apiClient.delete(`/superadmin/coupons/${id}`);
          return response.data.data;
     },
};
