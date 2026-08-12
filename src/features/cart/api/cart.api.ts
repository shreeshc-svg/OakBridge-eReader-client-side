import { apiClient } from '../../../config/axios.config';

export interface CartItem {
     id: string;
     book_id: string;
     status: 'active' | 'saved_for_later';
     createdAt: string;
     book_title: string;
     book_author: string;
     book_cover: string;
     book_price: number;
     book_slug: string;
}

export interface CartResponse {
     active: CartItem[];
     saved: CartItem[];
}

export const cart_api = {
     getCart: async (): Promise<CartResponse> => {
          const response = await apiClient.get('/cart');
          return response.data.data;
     },

     addToCart: async (book_id: string) => {
          const response = await apiClient.post('/cart/add', { book_id });
          return response.data;
     },

     removeFromCart: async (book_id: string) => {
          const response = await apiClient.delete(`/cart/remove/${book_id}`);
          return response.data;
     },

     clearCart: async () => {
          const response = await apiClient.delete('/cart/clear');
          return response.data;
     },

     moveToSaved: async (book_id: string) => {
          const response = await apiClient.patch(`/cart/save/${book_id}`);
          return response.data;
     },

     moveToCart: async (book_id: string) => {
          const response = await apiClient.patch(`/cart/activate/${book_id}`);
          return response.data;
     },

     getCartCount: async (): Promise<number> => {
          const response = await apiClient.get('/cart/count');
          return response.data.count;
     },
};
