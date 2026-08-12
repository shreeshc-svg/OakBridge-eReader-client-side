import { useMutation } from '@tanstack/react-query';
import { auth_api } from '../api/auth.api';
import type { SignupPayload, SignupResponse } from '../types/auth.types';
import type { AxiosError } from 'axios';

export const useSignup = () => {
     return useMutation<
          SignupResponse,
          AxiosError<{ message?: string }>,
          SignupPayload
     >({
          mutationFn: (data: SignupPayload) => auth_api.register_user(data),
     });
};
