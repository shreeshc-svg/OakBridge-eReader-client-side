import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.scss';

export interface BreadcrumbItem {
     label: string;
     path?: string;
}

interface BreadcrumbsProps {
     customItems?: BreadcrumbItem[];
     customTitle?: string;
}

const routeNameMap: Record<string, string> = {
     '': 'Home',
     'user': 'User',
     'dashboard': 'Dashboard',
     'superadmin': 'Superadmin',
     'institution': 'Institution',
     'subscription': 'Packages',
     'cart': 'Shopping Cart',
     'contact': 'Contact Us',
     'login': 'Login',
     'signup': 'Sign Up',
     'reset-password': 'Reset Password',
     'book': 'Bookstore',
     'my-library': 'My Library',
};

const generateBreadcrumbs = (pathname: string, customTitle?: string): BreadcrumbItem[] => {
     const items: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

     if (pathname === '/' || pathname === '') {
          return items;
     }

     if (pathname === '/cart') {
          items.push({ label: 'Shopping Cart' });
          return items;
     }

     if (pathname === '/contact') {
          items.push({ label: 'Contact Us' });
          return items;
     }

     if (pathname === '/subscription') {
          items.push({ label: 'Packages' });
          return items;
     }

     if (pathname === '/login') {
          items.push({ label: 'Login' });
          return items;
     }

     if (pathname === '/signup') {
          items.push({ label: 'Sign Up' });
          return items;
     }

     if (pathname === '/reset-password') {
          items.push({ label: 'Reset Password' });
          return items;
     }

     if (pathname.startsWith('/user/dashboard')) {
          items.push({ label: 'User Dashboard' });
          return items;
     }

     if (pathname.startsWith('/superadmin/dashboard')) {
          items.push({ label: 'Superadmin Dashboard' });
          return items;
     }

     if (pathname.startsWith('/institution/dashboard')) {
          items.push({ label: 'Institution Dashboard' });
          return items;
     }

     if (pathname.startsWith('/book/')) {
          items.push({ label: 'Bookstore', path: '/' });
          items.push({ label: customTitle || 'Book Details' });
          return items;
     }

     // Fallback for any other custom nested paths
     const pathSegments = pathname.split('/').filter(Boolean);
     let currentPath = '';
     pathSegments.forEach((segment, idx) => {
          currentPath += `/${segment}`;
          const isId = /^[0-9a-fA-F-]{8,36}$/.test(segment) || /^\d+$/.test(segment);
          let label = routeNameMap[segment] || segment.replace(/-/g, ' ');
          label = label.charAt(0).toUpperCase() + label.slice(1);

          if (isId && customTitle && idx === pathSegments.length - 1) {
               label = customTitle;
          } else if (isId) {
               label = 'Details';
          }

          const isLast = idx === pathSegments.length - 1;
          
          // Non-navigable segment check (e.g. /user, /book, /superadmin, /institution)
          const isInvalidStandaloneRoute = ['user', 'book', 'superadmin', 'institution'].includes(segment.toLowerCase());

          items.push({
               label,
               path: isLast || isInvalidStandaloneRoute ? undefined : currentPath,
          });
     });

     return items;
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customItems, customTitle }) => {
     const location = useLocation();
     const pathname = location.pathname;

     // Don't display breadcrumbs on bookstore home page (/) or reader page
     if (pathname === '/' || pathname === '' || pathname.startsWith('/reader')) {
          return null;
     }

     const items = customItems && customItems.length > 0 
          ? customItems 
          : generateBreadcrumbs(pathname, customTitle);

     // If only Home exists and we are on home page, render home indicator
     if (items.length <= 1) {
          return (
               <nav className="app_breadcrumbs app_breadcrumbs--home" aria-label="Breadcrumb">
                    <div className="app_breadcrumbs__container">
                         <span className="app_breadcrumbs__current">
                              <svg className="app_breadcrumbs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              Home
                         </span>
                    </div>
               </nav>
          );
     }

     return (
          <nav className="app_breadcrumbs" aria-label="Breadcrumb">
               <div className="app_breadcrumbs__container">
                    <ol className="app_breadcrumbs__list">
                         {items.map((item, index) => {
                              const isLast = index === items.length - 1;
                              return (
                                   <li key={index} className="app_breadcrumbs__item">
                                        {index > 0 && (
                                             <svg className="app_breadcrumbs__separator" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                             </svg>
                                        )}
                                        {isLast || !item.path ? (
                                             <span className="app_breadcrumbs__current" aria-current="page">
                                                  {index === 0 && (
                                                       <svg className="app_breadcrumbs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                       </svg>
                                                  )}
                                                  {item.label}
                                             </span>
                                        ) : (
                                             <Link to={item.path} className="app_breadcrumbs__link">
                                                  {index === 0 && (
                                                       <svg className="app_breadcrumbs__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                       </svg>
                                                  )}
                                                  {item.label}
                                             </Link>
                                        )}
                                   </li>
                              );
                         })}
                    </ol>
               </div>
          </nav>
     );
};

export default Breadcrumbs;
