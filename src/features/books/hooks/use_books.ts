import { useState, useCallback } from 'react';
import { books_api } from '../api/books.api';
import type {
     Book,
     CreateBookPayload,
     UpdateBookPayload,
} from '../types/books.api.types';
import { useAuthStore } from '../../../store/auth.store';

let cachedBooksMap: Map<string, Book[]> = new Map();
let cacheTimeMap: Map<string, number> = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds cache TTL

export const useBooks = () => {
     const [books, setBooks] = useState<Book[]>(() => cachedBooksMap.get('all') || []);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const accessToken = useAuthStore((state) => state.accessToken);

     const fetchBooks = useCallback(
          async (
               filters?: { search?: string; category?: string; author?: string },
               forceRefresh?: boolean
          ) => {
               const cacheKey = JSON.stringify(filters || {});
               const now = Date.now();
               const cached = cachedBooksMap.get(cacheKey);
               const cacheTime = cacheTimeMap.get(cacheKey) || 0;

               if (!forceRefresh && cached && now - cacheTime < CACHE_TTL_MS) {
                    setBooks(cached);
                    return;
               }

               setIsLoading(true);
               setError(null);
               try {
                    const response = await books_api.get_all_books(
                         accessToken || null,
                         filters
                    );
                    setBooks(response.books);
                    cachedBooksMap.set(cacheKey, response.books);
                    cacheTimeMap.set(cacheKey, now);
               } catch (err: unknown) {
                    const errorObj = err as {
                         response?: { data?: { message?: string } };
                    };
                    setError(
                         errorObj.response?.data?.message || 'Failed to fetch books'
                    );
               } finally {
                    setIsLoading(false);
               }
          },
          [accessToken]
     );

     const createBook = async (payload: CreateBookPayload) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               const response = await books_api.create_book(
                    payload,
                    accessToken
               );
               setBooks((prev) => [...prev, response.book]);
               cachedBooksMap.clear();
               cacheTimeMap.clear();
               return response.book;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message || 'Failed to create book';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const updateBook = async (id: string, payload: UpdateBookPayload) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               const response = await books_api.update_book(
                    id,
                    payload,
                    accessToken
               );
               setBooks((prev) =>
                    prev.map((book) => (book.id === id ? response.book : book))
               );
               cachedBooksMap.clear();
               cacheTimeMap.clear();
               return response.book;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message || 'Failed to update book';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const deleteBook = async (id: string) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               await books_api.delete_book(id, accessToken);
               setBooks((prev) => prev.filter((book) => book.id !== id));
               cachedBooksMap.clear();
               cacheTimeMap.clear();
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message || 'Failed to delete book';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     return {
          books,
          isLoading,
          error,
          fetchBooks,
          createBook,
          updateBook,
          deleteBook,
     };
};
