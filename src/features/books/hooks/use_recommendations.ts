import { useState, useCallback } from 'react';
import { books_api } from '../api/books.api';
import type { Book } from '../types/books.api.types';
import { useAuthStore } from '../../../store/auth.store';

export const useRecommendations = () => {
     const [recommendations, setRecommendations] = useState<Book[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const accessToken = useAuthStore((state) => state.accessToken);

     const fetchRecommendations = useCallback(async () => {
          if (!accessToken) {
               setIsLoading(false);
               return;
          }
          setIsLoading(true);
          setError(null);
          try {
               const response = await books_api.get_recommendations(accessToken);
               setRecommendations(response.books);
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               setError(
                    errorObj.response?.data?.message || 'Failed to fetch recommendations'
               );
          } finally {
               setIsLoading(false);
          }
     }, [accessToken]);

     return {
          recommendations,
          isLoading,
          error,
          fetchRecommendations,
     };
};
