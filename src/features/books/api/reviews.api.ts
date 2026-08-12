import { apiClient } from '../../../config/axios.config';

export interface BookReview {
     id: string;
     rating: number;
     review_text: string;
     createdAt: string;
     username?: string;
     userEmail?: string;
     bookTitle?: string;
     status?: 'pending' | 'approved' | 'rejected';
}

export interface BookReviewsResponse {
     message: string;
     reviews: BookReview[];
     averageRating: number;
     totalCount: number;
}

export interface PendingReviewsResponse {
     message: string;
     reviews: BookReview[];
}

export const reviews_api = {
     submit_review: async (payload: { bookId: string; rating: number; reviewText: string }) => {
          const response = await apiClient.post<{ message: string; review: any }>('/reviews/submit', payload);
          return response.data;
     },

     get_book_reviews: async (bookId: string) => {
          const response = await apiClient.get<BookReviewsResponse>(`/reviews/book/${bookId}`);
          return response.data;
     },

     get_pending_reviews: async () => {
          const response = await apiClient.get<PendingReviewsResponse>('/reviews/pending');
          return response.data;
     },

     get_all_reviews_for_admin: async (status?: string, timeframe?: string) => {
          const response = await apiClient.get<PendingReviewsResponse>('/reviews/admin/all', {
               params: { status, timeframe }
          });
          return response.data;
     },

     moderate_review: async (id: string, status: 'approved' | 'rejected') => {
          const response = await apiClient.put<{ message: string; review: any }>(`/reviews/${id}/status`, { status });
          return response.data;
     },
};
