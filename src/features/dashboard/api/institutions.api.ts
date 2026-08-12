import { apiClient } from '../../../config/axios.config';

export interface RegisteredInstitution {
     id: string;
     name: string;
     location: string;
     tier: 'GOLD' | 'PLATINUM' | 'NONE' | string;
     subscription_expires_at: string | null;
     createdAt: string;
     adminUsername: string | null;
     adminEmail: string | null;
}

export interface InstitutionsResponse {
     success: boolean;
     data: RegisteredInstitution[];
}

export interface AllowedCategoryRestriction {
     categoryId: string;
     allowAllBooks: boolean;
}

export const institutions_api = {
     get_institutions: async () => {
          const response = await apiClient.get<InstitutionsResponse>('/superadmin/institutions');
          return response.data;
     },
     get_allowed_categories: async (id: string) => {
          const response = await apiClient.get<{ success: boolean; data: AllowedCategoryRestriction[] }>(`/superadmin/institutions/${id}/allowed-categories`);
          return response.data;
     },
     update_allowed_categories: async (id: string, categoriesList: AllowedCategoryRestriction[]) => {
          const response = await apiClient.post<{ success: boolean; message: string }>(`/superadmin/institutions/${id}/allowed-categories`, { categoriesList });
          return response.data;
     },
     get_allowed_books: async (id: string) => {
          const response = await apiClient.get<{ success: boolean; data: string[] }>(`/superadmin/institutions/${id}/allowed-books`);
          return response.data;
     },
     update_allowed_books: async (id: string, bookIds: string[]) => {
          const response = await apiClient.post<{ success: boolean; message: string }>(`/superadmin/institutions/${id}/allowed-books`, { bookIds });
          return response.data;
     },
     delete_institution: async (id: string) => {
          const response = await apiClient.delete<{ success: boolean; message: string }>(`/superadmin/institutions/${id}`);
          return response.data;
     },
     update_institution: async (id: string, data: { adminEmail?: string | null; subscription_expires_at?: string | null }) => {
          const response = await apiClient.put<{ success: boolean; data: RegisteredInstitution }>(`/superadmin/institutions/${id}`, data);
          return response.data;
     },
};
