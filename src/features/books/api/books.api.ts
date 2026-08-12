import { apiClient } from '../../../config/axios.config';
import type {
     BookResponse,
     BooksResponse,
     CreateBookPayload,
     UpdateBookPayload,
} from '../types/books.api.types';

export const books_api = {
     get_all_books: async (
          accessToken: string | null,
          filters?: { search?: string; category?: string; author?: string }
     ): Promise<BooksResponse> => {
          const params = new URLSearchParams();
          if (filters?.search) params.append('search', filters.search);
          if (filters?.category) params.append('category', filters.category);
          if (filters?.author) params.append('author', filters.author);

          const queryString = params.toString() ? `?${params.toString()}` : '';
          
          const headers: Record<string, string> = {};
          if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

          const response = await apiClient.get<BooksResponse>(
               `/books/get-all-books${queryString}`,
               { headers }
          );
          return response.data;
     },
     get_book: async (
          id: string,
          accessToken: string | null
     ): Promise<BookResponse> => {
          const headers: Record<string, string> = {};
          if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

          const response = await apiClient.get<BookResponse>(
               `/books/get-book?id=${id}`,
               { headers }
          );
          return response.data;
     },
     create_book: async (
          data: CreateBookPayload,
          accessToken: string
     ): Promise<BookResponse> => {
          const formData = new FormData();
          formData.append('title', data.title);
          formData.append('description', data.description);
          formData.append('author', data.author);
          formData.append('publisher', data.author); // legacy support
          formData.append('language', data.language);
          formData.append('isbn', data.isbn);
          formData.append('total_pages', data.total_pages.toString());
          formData.append('total_chapters', data.total_chapters.toString());
          if (data.price !== undefined) {
               formData.append('price', data.price.toString());
          }

          if (data.category_ids && data.category_ids.length > 0) {
               formData.append(
                    'category_ids',
                    JSON.stringify(data.category_ids)
               );
          }

          if (data.category_names && data.category_names.length > 0) {
               formData.append(
                    'category_names',
                    JSON.stringify(data.category_names)
               );
          }

          if (data.access_period_days !== undefined && data.access_period_days !== null) {
               formData.append('access_period_days', data.access_period_days.toString());
          }
          if (data.isTrending !== undefined) {
               formData.append('isTrending', data.isTrending.toString());
          }
          if (data.isNewRelease !== undefined) {
               formData.append('isNewRelease', data.isNewRelease.toString());
          }
          formData.append('cover_image', data.cover_image);
          formData.append('book_file', data.book_file);

          if (data.cover_image_alt !== undefined) {
               formData.append('cover_image_alt', data.cover_image_alt);
          }

          if (data.preview_pages && data.preview_pages.length > 0) {
               data.preview_pages.forEach((file) => {
                    formData.append('preview_pages', file);
               });
          }

          if (data.preview_pages_alt && data.preview_pages_alt.length > 0) {
               formData.append('preview_pages_alt', JSON.stringify(data.preview_pages_alt));
          }

          const response = await apiClient.post<BookResponse>(
               '/books/create-book',
               formData,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                         'Content-Type': 'multipart/form-data',
                    },
               }
          );
          return response.data;
     },
     update_book: async (
          id: string,
          data: UpdateBookPayload,
          accessToken: string
     ): Promise<BookResponse> => {
          const formData = new FormData();
          if (data.title) formData.append('title', data.title);
          if (data.description)
               formData.append('description', data.description);
          if (data.author) {
               formData.append('author', data.author);
               formData.append('publisher', data.author); // legacy support
          }
          if (data.language) formData.append('language', data.language);
          if (data.isbn) formData.append('isbn', data.isbn);
          if (data.total_pages !== undefined)
               formData.append('total_pages', data.total_pages.toString());
          if (data.total_chapters !== undefined)
               formData.append(
                    'total_chapters',
                    data.total_chapters.toString()
               );
          if (data.price !== undefined)
               formData.append('price', data.price.toString());

          if (data.category_ids) {
               formData.append(
                    'category_ids',
                    JSON.stringify(data.category_ids)
               );
          }
          if (data.access_period_days !== undefined) {
               formData.append('access_period_days', data.access_period_days !== null ? data.access_period_days.toString() : '');
          }
          if (data.isTrending !== undefined) {
               formData.append('isTrending', data.isTrending.toString());
          }
          if (data.isNewRelease !== undefined) {
               formData.append('isNewRelease', data.isNewRelease.toString());
          }
          if (data.cover_image)
               formData.append('cover_image', data.cover_image);
          if (data.cover_image_alt !== undefined)
               formData.append('cover_image_alt', data.cover_image_alt);
          if (data.book_file) formData.append('book_file', data.book_file);

          if (data.preview_pages && data.preview_pages.length > 0) {
               data.preview_pages.forEach((file) => {
                    formData.append('preview_pages', file);
               });
          }

          if (data.preview_pages_alt && data.preview_pages_alt.length > 0) {
               formData.append('preview_pages_alt', JSON.stringify(data.preview_pages_alt));
          }

          const response = await apiClient.put<BookResponse>(
               `/books/update-book?id=${id}`,
               formData,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                         'Content-Type': 'multipart/form-data',
                    },
               }
          );
          return response.data;
     },
     delete_book: async (
          id: string,
          accessToken: string
     ): Promise<BookResponse> => {
          const response = await apiClient.delete<BookResponse>(
               `/books/delete-book?id=${id}`,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     get_recommendations: async (
          accessToken: string
     ): Promise<BooksResponse> => {
          const response = await apiClient.get<BooksResponse>(
               '/books/get-recommendations',
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
};
