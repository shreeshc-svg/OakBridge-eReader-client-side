import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/common/button/Button';
import { useLogout } from '../../../auth/hooks/use_logout';
import { useAuthStore } from '../../../../store/auth.store';
import type { DashboardLogoutData } from '../../types/dashboard.types';
import './Dashboard_Logout.scss';

interface DashboardLogoutProps {
     data: DashboardLogoutData;
}

const Dashboard_Logout = ({ data }: DashboardLogoutProps) => {
     const [error, setError] = useState('');
     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const clearAuth = useAuthStore((state) => state.clearAuth);
     const { mutate: logoutUser, isPending } = useLogout();

     const redirectToLogin = () => {
          clearAuth();
          navigate('/login', { replace: true });
     };

     const handleLogout = () => {
          setError('');

          if (!user?.id) {
               redirectToLogin();
               return;
          }

          logoutUser(
               { userId: user.id },
               {
                    onSuccess: redirectToLogin,
                    onError: (err) => {
                         setError(
                              err.response?.data?.message || data.error_fallback
                         );
                    },
               }
          );
     };

     return (
          <div className="dashboard_logout">
               <Button
                    type="button"
                    variant="primary"
                    onClick={handleLogout}
                    disabled={isPending}
               >
                    {isPending ? data.pending_label : data.idle_label}
               </Button>
               {error && <p className="dashboard_logout__error">{error}</p>}
          </div>
     );
};

export default Dashboard_Logout;
