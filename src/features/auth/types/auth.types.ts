export interface LoginPayload {
     email: string;
     password: string;
     deviceId?: string;
     deviceName?: string;
}

export interface SignupPayload {
     username: string;
     email: string;
     password: string;
     role: string;
     otp: string;
}

export interface SendOtpPayload {
     email: string;
}

export interface LogoutPayload {
     userId: string;
}

export interface Institution {
     id: string;
     name: string;
     location: string;
     admin_id: string;
     tier: 'GOLD' | 'PLATINUM' | 'NONE';
     subscription_expires_at?: string | null;
     createdAt: string;
     updatedAt: string;
}

export interface User {
     id: string;
     username: string;
     email: string;
     role: AuthRole;
     institution_id?: string | null;
     institution?: Institution | null;
     right_click_allowed?: boolean;
     is_free_candidate?: boolean;
     billing_address_line1?: string;
     billing_address_line2?: string;
     billing_city?: string;
     billing_state?: string;
     billing_postal_code?: string;
     billing_country?: string;
}

export type AuthRole = 'SUPERADMIN' | 'ADMIN' | 'USER' | 'INSTITUTION_ADMIN' | 'INSTITUTION_MEMBER' | 'MANAGER';

export interface AuthResponse {
     message: string;
     user: User;
     access_token?: string;
     refresh_token?: string;
}

export type LoginResponse = AuthResponse;
export type SignupResponse = AuthResponse;

export interface MeResponse {
     message: string;
     user: User;
}

export interface SendOtpResponse {
     message: string;
}

export interface SendInstitutionOtpResponse {
     message: string;
     isRegistered: boolean;
}

export interface LogoutResponse {
     message: string;
}

export interface RefreshTokenPayload {
     refresh_token: string;
}

export interface RefreshTokenResponse {
     message: string;
     access_token: string;
     refresh_token: string;
}
