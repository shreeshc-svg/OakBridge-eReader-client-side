import { apiClient } from '../../../config/axios.config';

export interface AppNotification {
     id: string;
     userId: string;
     title: string;
     message: string;
     isRead: boolean;
     createdAt: string;
}

export interface GetNotificationsResponse {
     message: string;
     notifications: AppNotification[];
}

export const notifications_api = {
     get_notifications: async (): Promise<GetNotificationsResponse> => {
          const response = await apiClient.get<GetNotificationsResponse>('/notifications');
          return response.data;
     },

     mark_read: async (id: string): Promise<any> => {
          const response = await apiClient.patch(`/notifications/${id}/read`);
          return response.data;
     },

     mark_all_read: async (): Promise<any> => {
          const response = await apiClient.patch('/notifications/read');
          return response.data;
     },
};
