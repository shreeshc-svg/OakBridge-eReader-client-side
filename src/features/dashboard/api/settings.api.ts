import { apiClient } from '../../../config/axios.config';

export interface SettingResponse {
     key: string;
     value: string;
     updatedAt: string;
}

export const settings_api = {
     get_setting: async (key: string): Promise<SettingResponse> => {
          const response = await apiClient.get<SettingResponse>(`/settings/${key}`);
          return response.data;
     },

     update_setting: async (
          key: string,
          value: string,
          accessToken: string
     ): Promise<any> => {
          const response = await apiClient.put(
               '/settings/update',
               { key, value },
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
};
