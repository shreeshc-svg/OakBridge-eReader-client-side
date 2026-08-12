import { useMutation } from '@tanstack/react-query';
import { auth_api } from '../api/auth.api';
import type { LoginPayload, LoginResponse } from '../types/auth.types';
import type { AxiosError } from 'axios';

export const useLogin = () => {
     return useMutation<
          LoginResponse,
          AxiosError<{ message?: string }>,
          LoginPayload
     >({
          mutationFn: (data: LoginPayload) => auth_api.login_user(data),
     });
};
