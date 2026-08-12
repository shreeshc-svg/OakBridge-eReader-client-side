import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Auth_Layout from '../../layout/Auth_Layout';
import { login_page_data } from '../../data';
import type { AuthPageData } from '../../features/auth/types/login.types';
import { Loading_Screen } from '../../components/common/loading_screen/Loading_Screen';
import {
     SuperadminDashboard,
     Login,
     Signup,
     UserDashboard,
     Reader,
     StorePage,
     SubscriptionPage,
     InstitutionDashboard,
     BookDetailsPage,
     CartPage,
     ContactPage,
     ResetPassword,
     PurchasesPage,
     ProfilePage,
     WishlistPage,
} from './routes';
import { useAuthStore, getDashboardPathForRole } from '../../store/auth.store';

const DashboardRedirect = () => {
     const user = useAuthStore((state) => state.user);
     const targetPath = getDashboardPathForRole(user?.role);
     return <Navigate to={targetPath} replace />;
};

export const router = createBrowserRouter([
     {
          path: '/dashboard',
          element: <DashboardRedirect />,
     },
     {
          path: '/',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <StorePage />
               </Suspense>
          ),
     },
     {
          path: '/subscription',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <SubscriptionPage />
               </Suspense>
          ),
     },
     {
          element: <Auth_Layout />,
          children: [
               {
                    path: '/login',
                    element: (
                         <Suspense fallback={<Loading_Screen />}>
                              <Login data={login_page_data as AuthPageData} />
                         </Suspense>
                    ),
               },
               {
                    path: '/signup',
                    element: (
                         <Suspense fallback={<Loading_Screen />}>
                              <Signup data={login_page_data as AuthPageData} />
                         </Suspense>
                    ),
               },
               {
                    path: '/reset-password',
                    element: (
                         <Suspense fallback={<Loading_Screen />}>
                              <ResetPassword />
                         </Suspense>
                    ),
               },
          ],
     },
     {
          path: '/superadmin/dashboard',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <SuperadminDashboard />
               </Suspense>
          ),
     },
     {
          path: '/user/dashboard',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <UserDashboard />
               </Suspense>
          ),
     },
     {
          path: '/user/purchases',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <PurchasesPage />
               </Suspense>
          ),
     },
     {
          path: '/user/dashaboard',
          element: <Navigate to="/user/dashboard" replace />,
     },
     {
          path: '/institution/dashboard',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <InstitutionDashboard />
               </Suspense>
          ),
     },
     {
          path: '/book/:bookId',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <BookDetailsPage />
               </Suspense>
          ),
     },
     {
          path: '/reader/:bookId',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <Reader />
               </Suspense>
          ),
     },
     {
          path: '/cart',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <CartPage />
               </Suspense>
          ),
     },
     {
          path: '/wishlist',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <WishlistPage />
               </Suspense>
          ),
     },
     {
          path: '/contact',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <ContactPage />
               </Suspense>
          ),
     },
     {
          path: '/settings/profile',
          element: (
               <Suspense fallback={<Loading_Screen />}>
                    <ProfilePage />
               </Suspense>
          ),
     },
]);
