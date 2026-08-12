import { apiClient } from '../../../config/axios.config';
import type {
     CategoryResponse,
     CategoriesResponse,
     CreateCategoryPayload,
     UpdateCategoryPayload,
} from '../types/categories.api.types';

export const categories_api = {
     get_all_categories: async (
          accessToken: string | null
     ): Promise<CategoriesResponse> => {
          const config = accessToken
               ? { headers: { Authorization: `Bearer ${accessToken}` } }
               : {};

          const response = await apiClient.get<CategoriesResponse>(
               '/category/get-all-categories',
               config
          );
          return response.data;
     },
     create_category: async (
          data: CreateCategoryPayload,
          accessToken: string
     ): Promise<CategoryResponse> => {
          const response = await apiClient.post<CategoryResponse>(
               '/category/create-category',
               data,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     update_category: async (
          id: string,
          data: UpdateCategoryPayload,
          accessToken: string
     ): Promise<CategoryResponse> => {
          const response = await apiClient.put<CategoryResponse>(
               `/category/update-category?id=${id}`,
               data,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     delete_category: async (
          id: string,
          accessToken: string
     ): Promise<CategoryResponse> => {
          const response = await apiClient.delete<CategoryResponse>(
               `/category/delete-category?id=${id}`,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     assign_books_to_category: async (
          categoryId: string,
          bookIds: string[],
          accessToken: string
     ): Promise<{ message: string }> => {
          const response = await apiClient.post<{ message: string }>(
               '/category/assign-books',
               { category_id: categoryId, book_ids: bookIds },
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
};
