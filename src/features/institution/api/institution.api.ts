import { apiClient } from '../../../config/axios.config';
import type {
     GetMembersResponse,
     AddMemberPayload,
     AddMemberResponse,
     RemoveMemberResponse,
} from '../types/institution.types';

export const institution_api = {
     get_members: async (): Promise<GetMembersResponse> => {
          const response = await apiClient.get<GetMembersResponse>('/institution/members');
          return response.data;
     },

     add_member: async (data: AddMemberPayload): Promise<AddMemberResponse> => {
          const response = await apiClient.post<AddMemberResponse>(
               '/institution/members',
               data
          );
          return response.data;
     },

     remove_member: async (memberId: string): Promise<RemoveMemberResponse> => {
          const response = await apiClient.delete<RemoveMemberResponse>(
               `/institution/members/${memberId}`
          );
          return response.data;
     },
};
