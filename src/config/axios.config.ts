import axios, { AxiosError } from 'axios';
import { env } from './env';
import { useAuthStore } from '../store/auth.store';
import type { RefreshTokenResponse } from '../features/auth/types/auth.types';

export const apiClient = axios.create({
     baseURL: env.API_URL,
     withCredentials: true,
     timeout: 120000, // 2 mins api call rate limit
});

apiClient.interceptors.request.use((config) => {
     const { accessToken } = useAuthStore.getState();

     if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
     }

     return config;
});

let isRefreshing = false;
let failedQueue: Array<{
     resolve: (value?: unknown) => void;
     reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
     failedQueue.forEach((prom) => {
          if (error) {
               prom.reject(error);
          } else {
               prom.resolve(token);
          }
     });
     failedQueue = [];
};

apiClient.interceptors.response.use(
     (response) => response,
     async (error: AxiosError<{ message?: string }>) => {
          const originalRequest = error.config as AxiosError['config'] & {
               _retry?: boolean;
          };
          const { accessToken, refreshToken, setTokens, clearAuth } =
               useAuthStore.getState();

          if (
               error.response?.status !== 401 ||
               !originalRequest ||
               originalRequest.url?.includes('/auth/refresh-token') ||
               originalRequest._retry ||
               !accessToken ||
               !refreshToken
          ) {
               return Promise.reject(error);
          }

          if (isRefreshing) {
               return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
               })
                    .then((token) => {
                         originalRequest.headers.Authorization = `Bearer ${token}`;
                         return apiClient(originalRequest);
                    })
                    .catch((err) => {
                         return Promise.reject(err);
                    });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
               const refreshResponse = await axios.post<RefreshTokenResponse>(
                    `${env.API_URL}/auth/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                         withCredentials: true,
                         headers: {
                              Authorization: `Bearer ${accessToken}`,
                         },
                    }
               );

               const {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
               } = refreshResponse.data;

               setTokens({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
               });

               processQueue(null, newAccessToken);

               originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
               return apiClient(originalRequest);
          } catch (refreshError) {
               processQueue(refreshError, null);
               clearAuth();
               return Promise.reject(refreshError);
          } finally {
               isRefreshing = false;
          }
     }
);
