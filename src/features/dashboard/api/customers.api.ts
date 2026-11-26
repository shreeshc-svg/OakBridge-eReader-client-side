import { apiClient } from '../../../config/axios.config';

export interface CustomerRow {
     id: string;
     username: string;
     email: string;
     role: string;
     is_free_candidate: boolean;
     created_at: string;
     orders: number;
     spent_paise: number;
     books: number;
     last_order_at: string | null;
}

export interface CustomerOrder {
     id: string;
     razorpay_order_id: string;
     razorpay_payment_id: string | null;
     status: 'created' | 'completed' | 'failed';
     amount: number;
     original_amount: number | null;
     discount_amount: number;
     tier: string | null;
     shipping_address: string | null;
     billing_address: string | null;
     invoice_key: string | null;
     created_at: string;
     items: string | null;
}

export interface CustomerLibraryItem {
     book_id: string;
     title: string;
     shelf_name: string;
     added_at: string;
}

export interface CustomerDetail {
     customer: Record<string, any>;
     orders: CustomerOrder[];
     library: CustomerLibraryItem[];
}

export const customers_api = {
     list: async (params: { page?: number; limit?: number; search?: string }) => {
          const response = await apiClient.get<{
               success: boolean;
               data: {
                    customers: CustomerRow[];
                    total: number;
                    page: number;
                    limit: number;
               };
          }>('/superadmin/customers', { params });
          return response.data.data;
     },

     detail: async (id: string) => {
          const response = await apiClient.get<{ success: boolean; data: CustomerDetail }>(
               `/superadmin/customers/${id}`
          );
          return response.data.data;
     },

     update: async (id: string, payload: Record<string, any>) => {
          const response = await apiClient.patch<{ success: boolean; message: string }>(
               `/superadmin/customers/${id}`,
               payload
          );
          return response.data;
     },

     remove: async (id: string) => {
          const response = await apiClient.delete<{ success: boolean; message: string }>(
               `/superadmin/customers/${id}`
          );
          return response.data;
     },

     grant_book: async (id: string, bookId: string, note?: string) => {
          const response = await apiClient.post<{ success: boolean; message: string }>(
               `/superadmin/customers/${id}/grant-book`,
               { bookId, note }
          );
          return response.data;
     },

     fulfil_order: async (paymentId: string, razorpay_payment_id?: string) => {
          const response = await apiClient.post<{ success: boolean; message: string }>(
               `/superadmin/orders/${paymentId}/fulfil`,
               { razorpay_payment_id }
          );
          return response.data;
     },

     reconcile: async () => {
          const response = await apiClient.post<{
               success: boolean;
               message: string;
               data: { checked: number; repaired: number };
          }>('/superadmin/orders/reconcile', {});
          return response.data;
     },
};
