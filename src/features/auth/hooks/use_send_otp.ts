import { useMutation } from '@tanstack/react-query';
import { auth_api } from '../api/auth.api';
import type { SendOtpPayload, SendOtpResponse } from '../types/auth.types';
import type { AxiosError } from 'axios';

export const useSendOtp = () => {
     return useMutation<
          SendOtpResponse,
          AxiosError<{ message?: string }>,
          SendOtpPayload
     >({
          mutationFn: (data: SendOtpPayload) => auth_api.send_otp(data),
     });
};
