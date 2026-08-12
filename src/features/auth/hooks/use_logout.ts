import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { auth_api } from '../api/auth.api';
import type { LogoutPayload, LogoutResponse } from '../types/auth.types';

export const useLogout = () => {
     return useMutation<
          LogoutResponse,
          AxiosError<{ message?: string }>,
          LogoutPayload
     >({
          mutationFn: (data: LogoutPayload) => auth_api.logout_user(data),
     });
};
