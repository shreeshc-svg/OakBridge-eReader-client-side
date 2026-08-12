import { apiClient } from '../../../config/axios.config';

export interface LibraryResponse {
    success: boolean;
    data: any;
}

export interface LibraryBooksResponse {
    success: boolean;
    data: any[];
}

export const library_api = {
     add_to_library: async (
          book_id: string,
          accessToken: string
     ): Promise<LibraryResponse> => {
          const response = await apiClient.post<LibraryResponse>(
               '/library/add',
               { book_id },
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     get_my_library: async (
          accessToken: string
     ): Promise<LibraryBooksResponse> => {
          const response = await apiClient.get<LibraryBooksResponse>(
               '/library/my-books',
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     remove_from_library: async (
          book_id: string,
          accessToken: string
     ): Promise<LibraryResponse> => {
          const response = await apiClient.delete<LibraryResponse>(
               `/library/remove/${book_id}`,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
};
