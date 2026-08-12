import { apiClient } from '../../../config/axios.config';

export const payments_api = {
     createOrder: async (book_id: string, shippingAddress?: string, billingAddress?: string, couponCode?: string) => {
          const response = await apiClient.post('/payments/create-order', {
               book_id,
               shippingAddress,
               billingAddress,
               couponCode,
          });
          return response.data;
     },

     verifyPayment: async (
          razorpay_order_id: string,
          razorpay_payment_id: string,
          razorpay_signature: string
     ) => {
          const response = await apiClient.post('/payments/verify', {
               razorpay_order_id,
               razorpay_payment_id,
               razorpay_signature,
          });
          return response.data;
     },

     createCartOrder: async (book_ids: string[], shippingAddress?: string, billingAddress?: string, couponCode?: string) => {
          const response = await apiClient.post('/payments/create-cart-order', {
               book_ids,
               shippingAddress,
               billingAddress,
               couponCode,
          });
          return response.data;
     },

     validateCoupon: async (code: string, amount: number) => {
          const response = await apiClient.get('/payments/coupon/validate', {
               params: { code, amount }
          });
          return response.data;
     },

     createSubscriptionOrder: async (tier: 'GOLD' | 'PLATINUM', shippingAddress?: string, billingAddress?: string) => {
          const response = await apiClient.post('/payments/subscribe', {
               tier,
               shippingAddress,
               billingAddress,
          });
          return response.data;
     },

     getPaymentHistory: async () => {
          const response = await apiClient.get('/payments/history');
          return response.data.history;
     },

     getInvoiceDownloadUrl: async (paymentId: string) => {
          const response = await apiClient.get(`/payments/invoice/${paymentId}`);
          return response.data.url;
     },
};
