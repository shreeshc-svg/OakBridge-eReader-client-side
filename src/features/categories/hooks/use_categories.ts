import { useState, useCallback } from 'react';
import { categories_api } from '../api/categories.api';
import type {
     Category,
     CreateCategoryPayload,
     UpdateCategoryPayload,
} from '../types/categories.api.types';
import { useAuthStore } from '../../../store/auth.store';

let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 60 seconds

export const useCategories = () => {
     const [categories, setCategories] = useState<Category[]>(() => cachedCategories || []);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const accessToken = useAuthStore((state) => state.accessToken);

     const fetchCategories = useCallback(async (forceRefresh?: boolean) => {
          const now = Date.now();
          if (!forceRefresh && cachedCategories && now - cacheTimestamp < CACHE_TTL_MS) {
               setCategories(cachedCategories);
               return;
          }

          setIsLoading(true);
          setError(null);
          try {
               const response =
                    await categories_api.get_all_categories(accessToken || null);
               setCategories(response.categories);
               cachedCategories = response.categories;
               cacheTimestamp = now;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               setError(
                    errorObj.response?.data?.message ||
                    'Failed to fetch categories'
               );
          } finally {
               setIsLoading(false);
          }
     }, [accessToken]);

     const createCategory = async (payload: CreateCategoryPayload) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               const response = await categories_api.create_category(
                    payload,
                    accessToken
               );
               setCategories((prev) => [...prev, response.category]);
               cachedCategories = null;
               cacheTimestamp = 0;
               return response.category;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message ||
                    'Failed to create category';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const updateCategory = async (
          id: string,
          payload: UpdateCategoryPayload
     ) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               const response = await categories_api.update_category(
                    id,
                    payload,
                    accessToken
               );
               setCategories((prev) =>
                    prev.map((cat) => (cat.id === id ? response.category : cat))
               );
               cachedCategories = null;
               cacheTimestamp = 0;
               return response.category;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message ||
                    'Failed to update category';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const deleteCategory = async (id: string) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               await categories_api.delete_category(id, accessToken);
               setCategories((prev) => prev.filter((cat) => cat.id !== id));
               cachedCategories = null;
               cacheTimestamp = 0;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message ||
                    'Failed to delete category';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const assignBooksToCategory = async (categoryId: string, bookIds: string[]) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               const response = await categories_api.assign_books_to_category(
                    categoryId,
                    bookIds,
                    accessToken
               );
               cachedCategories = null;
               cacheTimestamp = 0;
               await fetchCategories(true);
               return response;
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message ||
                    'Failed to assign books to category';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     return {
          categories,
          isLoading,
          error,
          fetchCategories,
          createCategory,
          updateCategory,
          deleteCategory,
          assignBooksToCategory,
     };
};
