import { apiClient } from '../../../config/axios.config';

export interface SubscriptionPlan {
     id: string;
     tier: string;
     name: string;
     price: number; // in paise
     memberLimit: number;
     durationMonths: number;
     features: string[];
     isBestValue: boolean;
     isActive: boolean;
     createdAt: string;
     updatedAt: string;
}

export const subscriptionPlansApi = {
     // Fetch all plans for superadmin management
     fetchPlans: async (): Promise<SubscriptionPlan[]> => {
          const response = await apiClient.get('/superadmin/subscription-plans');
          return response.data.data;
     },

     // Create a new subscription plan
     createPlan: async (plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> => {
          const response = await apiClient.post('/superadmin/subscription-plans', plan);
          return response.data.data;
     },

     // Update an existing plan
     updatePlan: async (id: string, plan: Partial<Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SubscriptionPlan> => {
          const response = await apiClient.put(`/superadmin/subscription-plans/${id}`, plan);
          return response.data.data;
     },

     // Delete a plan
     deletePlan: async (id: string): Promise<SubscriptionPlan> => {
          const response = await apiClient.delete(`/superadmin/subscription-plans/${id}`);
          return response.data.data;
     },

     // Fetch active subscription plans for institution check-out page
     fetchActivePlans: async (): Promise<SubscriptionPlan[]> => {
          const response = await apiClient.get('/payments/subscription-plans/active');
          return response.data.data;
     },
};
