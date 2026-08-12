import { apiClient } from '../../../config/axios.config';
import type {
     LogoutPayload,
     LogoutResponse,
     LoginPayload,
     LoginResponse,
     MeResponse,
     RefreshTokenPayload,
     RefreshTokenResponse,
     SignupPayload,
     SignupResponse,
     SendOtpPayload,
     SendOtpResponse,
     SendInstitutionOtpResponse,
} from '../types/auth.types';
import { getDeviceId, getDeviceName } from '../../../utils/device';

export const auth_api = {
     login_user: async (data: LoginPayload): Promise<LoginResponse> => {
          const response = await apiClient.post<LoginResponse>(
               '/auth/login-user',
               {
                    ...data,
                    deviceId: data.deviceId || getDeviceId(),
                    deviceName: data.deviceName || getDeviceName(),
               }
          );
          return response.data;
     },
     register_user: async (data: SignupPayload): Promise<SignupResponse> => {
          const response = await apiClient.post<SignupResponse>(
               '/auth/create-user',
               data
          );
          return response.data;
     },
     send_otp: async (data: SendOtpPayload): Promise<SendOtpResponse> => {
          const response = await apiClient.post<SendOtpResponse>(
               '/auth/send-otp',
               data
          );
          return response.data;
     },
     get_me: async (accessToken: string): Promise<MeResponse> => {
          const response = await apiClient.get<MeResponse>('/auth/me', {
               headers: {
                    Authorization: `Bearer ${accessToken}`,
               },
          });
          return response.data;
     },
     logout_user: async (data: LogoutPayload): Promise<LogoutResponse> => {
          const response = await apiClient.post<LogoutResponse>(
               '/auth/logout-user',
               data,
               {
                    headers: {
                         'User-Agent': navigator.userAgent,
                    },
               }
          );
          return response.data;
     },
     refresh_token: async (
          data: RefreshTokenPayload,
          accessToken: string
     ): Promise<RefreshTokenResponse> => {
          const response = await apiClient.post<RefreshTokenResponse>(
               '/auth/refresh-token',
               data,
               {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
               }
          );
          return response.data;
     },
     send_institution_otp: async (email: string): Promise<SendInstitutionOtpResponse> => {
          const response = await apiClient.post<SendInstitutionOtpResponse>(
               '/auth/institution/send-otp',
               { email }
          );
          return response.data;
     },
     login_institution: async (data: {
          email: string;
          otp: string;
          institution_name?: string;
          location?: string;
          deviceId?: string;
          deviceName?: string;
     }): Promise<any> => {
          const response = await apiClient.post<any>(
               '/auth/institution/login',
               {
                    ...data,
                    deviceId: data.deviceId || getDeviceId(),
                    deviceName: data.deviceName || getDeviceName(),
               }
          );
          return response.data;
     },
     get_admins: async (): Promise<{ admins: any[] }> => {
          const response = await apiClient.get<{ admins: any[] }>('/auth/admins');
          return response.data;
     },
     add_admin: async (data: { username: string; email: string; password?: string }): Promise<any> => {
          const response = await apiClient.post<any>('/auth/admins', data);
          return response.data;
     },
     remove_admin: async (adminId: string): Promise<any> => {
          const response = await apiClient.delete<any>(`/auth/admins/${adminId}`);
          return response.data;
     },
     get_managers: async (): Promise<{ managers: any[] }> => {
          const response = await apiClient.get<{ managers: any[] }>('/auth/managers');
          return response.data;
     },
     add_manager: async (data: { username: string; email: string; password?: string }): Promise<any> => {
          const response = await apiClient.post<any>('/auth/managers', data);
          return response.data;
     },
     remove_manager: async (managerId: string): Promise<any> => {
          const response = await apiClient.delete<any>(`/auth/managers/${managerId}`);
          return response.data;
     },
     forgot_password: async (email: string): Promise<{ message: string }> => {
          const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
          return response.data;
     },
     reset_password: async (data: { token: string; new_password: string }): Promise<{ message: string }> => {
          const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
          return response.data;
     },
     update_profile: async (data: {
          username?: string;
          email?: string;
          password?: string;
          billing_address_line1?: string;
          billing_address_line2?: string;
          billing_city?: string;
          billing_state?: string;
          billing_postal_code?: string;
          billing_country?: string;
     }): Promise<{ success: boolean; message: string; user: any }> => {
          const response = await apiClient.put<{ success: boolean; message: string; user: any }>('/auth/update-profile', data);
          return response.data;
     },
};
