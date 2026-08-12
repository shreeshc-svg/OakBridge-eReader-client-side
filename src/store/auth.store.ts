import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthRole, User } from '../features/auth/types/auth.types';
import posthog from 'posthog-js';

interface AuthState {
     accessToken: string | null;
     refreshToken: string | null;
     user: User | null;
     setAuth: (payload: {
          accessToken: string;
          refreshToken: string;
          user: User;
     }) => void;
     setTokens: (payload: {
          accessToken: string;
          refreshToken: string;
     }) => void;
     clearAuth: () => void;
     updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
     persist(
          (set) => ({
               accessToken: null,
               refreshToken: null,
               user: null,
               setAuth: ({ accessToken, refreshToken, user }) => {
                    if (user) {
                         posthog.identify(user.id, {
                              email: user.email,
                              username: user.username,
                              role: user.role
                         });
                    }
                    set({ accessToken, refreshToken, user });
               },
               setTokens: ({ accessToken, refreshToken }) =>
                    set({ accessToken, refreshToken }),
               clearAuth: () => {
                    posthog.reset();
                    set({ accessToken: null, refreshToken: null, user: null });
               },
               updateUser: (user) => {
                    if (user) {
                         posthog.identify(user.id, {
                              email: user.email,
                              username: user.username,
                              role: user.role
                         });
                    }
                    set({ user });
               },
          }),
          {
               name: 'auth-storage',
          }
     )
);

interface AccessTokenPayload {
     id?: string;
     role?: AuthRole;
     email?: string;
}

export const getRoleFromAccessToken = (
     accessToken: string
): AuthRole | null => {
     try {
          const payload = accessToken.split('.')[1];

          if (!payload) {
               return null;
          }

          const normalizedPayload = payload
               .replace(/-/g, '+')
               .replace(/_/g, '/');
          const paddedPayload = normalizedPayload.padEnd(
               Math.ceil(normalizedPayload.length / 4) * 4,
               '='
          );
          const decodedPayload = JSON.parse(atob(paddedPayload)) as
               | AccessTokenPayload
               | undefined;

          return decodedPayload?.role ?? null;
     } catch {
          return null;
     }
};

export const getDashboardPathForRole = (role?: AuthRole | null) => {
     if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER') {
          return '/superadmin/dashboard';
     }

     if (role === 'INSTITUTION_ADMIN') {
          return '/institution/dashboard';
     }

     if (
          role === 'USER' ||
          role === 'INSTITUTION_MEMBER'
     ) {
          return '/user/dashboard';
     }

     return '/login';
};
