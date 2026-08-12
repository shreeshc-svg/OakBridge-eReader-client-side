import { apiClient } from '../../../config/axios.config';

export interface FreeCandidate {
     id: string;
     username: string;
     email: string;
     createdAt: string;
}

export interface FreeCandidatesResponse {
     success: boolean;
     data: FreeCandidate[];
}

export const free_candidates_api = {
     get_candidates: async () => {
          const response = await apiClient.get<FreeCandidatesResponse>('/superadmin/free-candidates');
          return response.data;
     },
     create_candidate: async (payload: { username: string; email: string; password?: string }) => {
          const response = await apiClient.post<{ success: boolean; message: string; data?: FreeCandidate }>('/superadmin/free-candidates', payload);
          return response.data;
     },
     get_allowed_books: async (id: string) => {
          const response = await apiClient.get<{ success: boolean; data: string[] }>(`/superadmin/free-candidates/${id}/allowed-books`);
          return response.data;
     },
     update_allowed_books: async (id: string, bookIds: string[]) => {
          const response = await apiClient.post<{ success: boolean; message: string }>(`/superadmin/free-candidates/${id}/allowed-books`, { bookIds });
          return response.data;
     },
};
