import { useState, useCallback } from 'react';
import { reviews_api } from '../api/reviews.api';
import type { BookReview } from '../api/reviews.api';

export const useReviews = () => {
     const [reviews, setReviews] = useState<BookReview[]>([]);
     const [averageRating, setAverageRating] = useState<number>(0);
     const [totalCount, setTotalCount] = useState<number>(0);
     const [pendingReviews, setPendingReviews] = useState<BookReview[]>([]);
     const [adminReviews, setAdminReviews] = useState<BookReview[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const fetchBookReviews = useCallback(async (bookId: string) => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await reviews_api.get_book_reviews(bookId);
               setReviews(response.reviews);
               setAverageRating(response.averageRating);
               setTotalCount(response.totalCount);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch reviews');
          } finally {
               setIsLoading(false);
          }
     }, []);

     const fetchPendingReviews = useCallback(async () => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await reviews_api.get_pending_reviews();
               setPendingReviews(response.reviews);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch pending reviews');
          } finally {
               setIsLoading(false);
          }
     }, []);

     const fetchAdminReviews = useCallback(async (status?: 'pending' | 'approved' | 'rejected', timeframe?: string) => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await reviews_api.get_all_reviews_for_admin(status, timeframe);
               setAdminReviews(response.reviews);
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch reviews');
          } finally {
               setIsLoading(false);
          }
     }, []);

     const submitReview = async (bookId: string, rating: number, reviewText: string) => {
          setIsLoading(true);
          setError(null);
          try {
               const response = await reviews_api.submit_review({ bookId, rating, reviewText });
               return response.review;
          } catch (err: any) {
               const msg = err.response?.data?.message || 'Failed to submit review';
               setError(msg);
               throw new Error(msg);
          } finally {
               setIsLoading(false);
          }
     };

     const moderateReview = async (id: string, status: 'approved' | 'rejected') => {
          setIsLoading(true);
          setError(null);
          try {
               await reviews_api.moderate_review(id, status);
               setPendingReviews((prev) => prev.filter((r) => r.id !== id));
               setAdminReviews((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, status } : r))
               );
          } catch (err: any) {
               const msg = err.response?.data?.message || 'Failed to moderate review';
               setError(msg);
               throw new Error(msg);
          } finally {
               setIsLoading(false);
          }
     };

     return {
          reviews,
          averageRating,
          totalCount,
          pendingReviews,
          adminReviews,
          isLoading,
          error,
          fetchBookReviews,
          fetchPendingReviews,
          fetchAdminReviews,
          submitReview,
          moderateReview,
     };
};
