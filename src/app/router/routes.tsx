import { lazy } from 'react';

export const Login = lazy(() =>
     import('../../features/auth/pages/login/Login_Page').catch(() => {
          return { default: () => <div>Login Page (Placeholder)</div> };
     })
);

export const Signup = lazy(() =>
     import('../../features/auth/pages/signup/Signup_Page').catch(() => {
          return { default: () => <div>Signup Page (Placeholder)</div> };
     })
);

export const SuperadminDashboard = lazy(() =>
     import('../../features/dashboard/pages/Superadmin_Dashboard').catch(() => {
          return { default: () => <div>Superadmin Dashboard</div> };
     })
);

export const UserDashboard = lazy(() =>
     import('../../features/dashboard/pages/User_Dashboard').catch(() => {
          return { default: () => <div>User Dashboard</div> };
     })
);

export const Reader = lazy(() =>
     import('../../features/reader/pages/Reader_Page').catch(() => {
          return { default: () => <div>Reader Page</div> };
     })
);

export const StorePage = lazy(() =>
     import('../../features/public_store/pages/Store_Page')
);

export const SubscriptionPage = lazy(() =>
     import('../../features/auth/pages/subscription/Subscription_Page').catch(() => {
          return { default: () => <div>Subscription Page</div> };
     })
);

export const InstitutionDashboard = lazy(() =>
     import('../../features/institution/pages/Institution_Dashboard').catch(() => {
          return { default: () => <div>Institution Dashboard</div> };
     })
);

export const BookDetailsPage = lazy(() =>
     import('../../features/books/pages/Book_Details_Page').catch(() => {
          return { default: () => <div>Book Details Page</div> };
     })
);

export const CartPage = lazy(() =>
     import('../../features/cart/pages/Cart_Page').catch(() => {
          return { default: () => <div>Cart Page</div> };
     })
);

export const ContactPage = lazy(() =>
     import('../../features/public_store/pages/Contact_Page').catch(() => {
          return { default: () => <div>Contact Page</div> };
     })
);

export const ResetPassword = lazy(() =>
     import('../../features/auth/pages/reset_password/Reset_Password_Page').catch(() => {
          return { default: () => <div>Reset Password Page</div> };
     })
);

export const PurchasesPage = lazy(() =>
     import('../../features/payments/pages/Purchases_Page').catch(() => {
          return { default: () => <div>Purchases Page</div> };
     })
);

export const ProfilePage = lazy(() =>
     import('../../features/auth/pages/profile/Profile_Page').catch(() => {
          return { default: () => <div>Profile Page</div> };
     })
);

export const WishlistPage = lazy(() =>
     import('../../features/cart/pages/Wishlist_Page').catch(() => {
          return { default: () => <div>Wishlist Page</div> };
     })
);
