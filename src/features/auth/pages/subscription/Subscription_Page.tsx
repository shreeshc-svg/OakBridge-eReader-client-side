import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/auth.store';
import Button from '../../../../components/common/button/Button';
import { apiClient } from '../../../../config/axios.config';
import { usePayments } from '../../../payments/hooks/use_payments';
import { subscriptionPlansApi, type SubscriptionPlan } from '../../../dashboard/api/subscription_plans.api';
import Public_Navbar from '../../../public_store/components/public_navbar/Public_Navbar';
import './Subscription_Page.scss';

const CheckIcon = () => (
     <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: '#ff7a36' }}
     >
          <polyline points="20 6 9 17 4 12" />
     </svg>
);

export const Subscription_Page = () => {
     const navigate = useNavigate();
     const { user, accessToken, refreshToken, setAuth } = useAuthStore();
     const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
     const [loadingPlans, setLoadingPlans] = useState(true);
     const [loadingTier, setLoadingTier] = useState<string | null>(null);
     const [error, setError] = useState('');
     const { initiateSubscription } = usePayments();

     // Direct normal users away from this page
     if (user && user.role !== 'INSTITUTION_ADMIN') {
          navigate('/');
          return null;
     }

     useEffect(() => {
          const loadPlans = async () => {
               try {
                    setLoadingPlans(true);
                    const data = await subscriptionPlansApi.fetchActivePlans();
                    setPlans(data);
               } catch (err: any) {
                    console.error('Failed to load active subscription plans', err);
                    setError('Failed to load active subscription plans. Please refresh.');
               } finally {
                    setLoadingPlans(false);
               }
          };
          loadPlans();
     }, []);

     const handleSubscribe = async (tier: string) => {
          if (!accessToken) {
               localStorage.setItem('selected_plan_tier', tier);
               navigate('/signup?mode=institution');
               return;
          }
          setError('');
          setLoadingTier(tier);
          try {
               await initiateSubscription(tier as any, async () => {
                    // Update user's authentication details post successful transaction
                    try {
                         const response = await apiClient.get('/auth/me', {
                              headers: {
                                   Authorization: `Bearer ${accessToken}`,
                              },
                         });
                         const updatedUser = response.data.user;

                         if (updatedUser) {
                              setAuth({
                                   accessToken: accessToken || '',
                                   refreshToken: refreshToken || '',
                                   user: updatedUser,
                              });
                         }
                         navigate('/institution/dashboard');
                    } catch (fetchErr) {
                         console.error('Failed to refresh user profile post-payment', fetchErr);
                         navigate('/institution/dashboard');
                    }
               });
          } catch (err: any) {
               setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Failed to initiate payment. Please try again.'
               );
          } finally {
               setLoadingTier(null);
          }
     };

     // Auto-checkout on mount/login if there's a cached plan selection
     useEffect(() => {
          if (accessToken && user?.role === 'INSTITUTION_ADMIN') {
               const storedTier = localStorage.getItem('selected_plan_tier');
               if (storedTier) {
                    localStorage.removeItem('selected_plan_tier');
                    handleSubscribe(storedTier);
               }
          }
     }, [accessToken, user]);

     return (
          <div className="sub_page">
               <Public_Navbar />
               <div className="sub_page__container">
                    <header className="sub_page__header">
                         <h1 className="sub_page__title">Choose Your Packages</h1>
                         <p className="sub_page__subtitle">Elevate your school, company, or library with structured, shared access and reading insights.</p>
                    </header>

                    {error && <div className="sub_page__error">{error}</div>}

                    <div className="sub_page__grid">
                         {loadingPlans ? (
                              <div className="sub_page__loading_text" style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#78716c', fontWeight: 500, padding: '40px 0' }}>
                                   Loading subscription plans...
                              </div>
                         ) : plans.length === 0 ? (
                              <div className="sub_page__loading_text" style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#78716c', fontWeight: 500, padding: '40px 0' }}>
                                   No active subscription plans available at this moment.
                              </div>
                         ) : (
                              plans.map((plan) => (
                                   <div
                                        key={plan.id}
                                        className={`sub_page__card ${plan.isBestValue ? 'sub_page__card--premium' : ''}`}
                                   >
                                        {plan.isBestValue && <span className="sub_page__badge">Best Value</span>}
                                        <div className="sub_page__card_header">
                                             <h2>{plan.name}</h2>
                                             <p className="sub_page__price">
                                                  ₹{(plan.price / 100).toLocaleString('en-IN')}
                                                  <span>/{plan.durationMonths || 12} months</span>
                                             </p>
                                        </div>
                                        <div className="sub_page__divider" />
                                        <ul className="sub_page__features">
                                             {plan.features.map((feature, idx) => (
                                                  <li key={idx}>
                                                       <CheckIcon />
                                                       <span>{feature}</span>
                                                  </li>
                                             ))}
                                        </ul>
                                        <Button
                                             variant={plan.isBestValue ? 'primary' : 'outline'}
                                             fullWidth
                                             disabled={loadingTier !== null}
                                             onClick={() => handleSubscribe(plan.tier)}
                                        >
                                             {loadingTier === plan.tier
                                                  ? 'Processing...'
                                                  : `Subscribe ${plan.name}`}
                                        </Button>
                                   </div>
                              ))
                         )}
                    </div>
               </div>
          </div>
     );
};

export default Subscription_Page;
