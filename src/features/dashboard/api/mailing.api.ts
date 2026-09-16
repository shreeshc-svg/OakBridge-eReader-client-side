import { apiClient } from '../../../config/axios.config';

export type AudienceType =
     | 'all_readers'
     | 'individual_readers'
     | 'institution_users'
     | 'institution'
     | 'selected';

export interface Audience {
     type: AudienceType;
     institution_id?: string;
     user_ids?: string[];
}

export interface MailingBook {
     id: string;
     title: string;
     author: string;
     isbn: string;
     price: number;
     cover_image_url: string;
     created_at: string;
     announced_at: string | null;
}

export interface MailingUser {
     id: string;
     username: string;
     email: string;
     role: string;
     marketing_emails: boolean;
}

export interface AutomaticEmails {
     inactivity_reminders: boolean;
     cart_reminders: boolean;
     /** "New book added" alerts fired by a book upload (in-app + email). */
     new_book_notifications: boolean;
}

export interface MailingOverview {
     books: MailingBook[];
     audience_counts: {
          all_readers: number;
          individual_readers: number;
          institution_users: number;
          unsubscribed: number;
     };
     institutions: { id: string; name: string; members: number }[];
     automatic: AutomaticEmails;
     max_books_per_email: number;
}

interface ApiResponse<T> {
     success: boolean;
     data: T;
     message?: string;
}

export const mailing_api = {
     get_overview: async () => {
          const response = await apiClient.get<ApiResponse<MailingOverview>>('/mailing/overview');
          return response.data.data;
     },

     search_users: async (search: string) => {
          const response = await apiClient.get<ApiResponse<MailingUser[]>>('/mailing/users', {
               params: { search, limit: 50 },
          });
          return response.data.data;
     },

     match_emails: async (emails: string[]) => {
          const response = await apiClient.post<
               ApiResponse<{ matched: MailingUser[]; not_found: string[] }>
          >('/mailing/users/match', { emails });
          return response.data.data;
     },

     preview_audience: async (audience: Audience) => {
          const response = await apiClient.post<
               ApiResponse<{ recipients: number; unsubscribed_skipped: number; sample: string[] }>
          >('/mailing/audience/preview', { audience });
          return response.data.data;
     },

     announce: async (payload: {
          book_ids: string[];
          audience: Audience;
          subject?: string;
          message?: string;
     }) => {
          const response = await apiClient.post<
               ApiResponse<{ recipients: number; unsubscribed_skipped: number; books: number }>
          >('/mailing/announce', payload);
          return response.data.data;
     },

     update_automatic: async (settings: Partial<AutomaticEmails>) => {
          const response = await apiClient.put<ApiResponse<AutomaticEmails>>(
               '/mailing/automatic',
               settings
          );
          return response.data.data;
     },
};
