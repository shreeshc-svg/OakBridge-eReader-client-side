import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import Dashboard_Overview from '../components/dashboard_overview/Dashboard_Overview';
import Dashboard_Layout from '../../../layout/Dashboard_Layout';
import Categories_Page from '../../categories/pages/Categories_Page';
import {
     superadmin_dashboard_data,
     categories_data,
     dashboard_layout_data,
} from '../../../data';
import type {
     DashboardLayoutData,
     DashboardOverviewData,
} from '../types/dashboard.types';
import type { CategoriesPageData } from '../../categories/types/categories.types';
import { useAuthStore } from '../../../store/auth.store';
import type { AuthRole } from '../../auth/types/auth.types';
import { useDashboard } from '../hooks/use_dashboard';
import Search_Results from '../components/search_results/Search_Results';
import { useBooks } from '../../books/hooks/use_books';
import Banners_Page from '../pages/Banners_Page';
import Reviews_Moderation_Page from './Reviews_Moderation_Page';
import Admins_Page from './Admins_Page';
import Managers_Page from './Managers_Page';
import Analytics_Page from './Analytics_Page';
import Settings_Page from './Settings_Page';
import Institutions_Page from './Institutions_Page';
import Subscription_Plans_Manager from './Subscription_Plans_Manager';
import Free_Candidates_Page from './Free_Candidates_Page';
import Reports_Page from './Reports_Page';
import Contact_Messages_Page from './Contact_Messages_Page';
import Ebooks_Page from './Ebooks_Page';
import Coupons_Page from './Coupons_Page';
import './Superadmin_Dashboard.scss';

const getIcon = (item: string) => {
     switch (item) {
          case 'Dashboard':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
               );
          case 'Ebooks':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /><line x1="12" y1="6" x2="16" y2="6" /><line x1="12" y1="10" x2="16" y2="10" /></svg>
               );
          case 'Categories':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></svg>
               );
          case 'Banners':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
               );
          case 'Reviews':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg>
               );
          case 'Admins':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
               );
          case 'Managers':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
               );
          case 'Analytics':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
               );
          case 'Subscriptions':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
               );
          case 'Settings':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
               );
          case 'Institutions':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="16" /><line x1="15" y1="22" x2="15" y2="16" /><line x1="9" y1="16" x2="15" y2="16" /><path d="M8 6h2v2H8V6zm4 0h2v2h-2V6zm4 0h2v2h-2V6zM8 10h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" /></svg>
               );
          case 'Free Candidates':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>
               );
          case 'Reports':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
               );
          case 'Contact Messages':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><circle cx="12" cy="12" r="1" /><circle cx="17" cy="12" r="1" /><circle cx="7" cy="12" r="1" /></svg>
               );
          case 'Coupons':
               return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
               );
          default:
               return null;
     }
};

const Superadmin_Dashboard = () => {
     const layoutData = dashboard_layout_data as DashboardLayoutData;
     const fallbackData = superadmin_dashboard_data as DashboardOverviewData;
     const categoriesPageData = categories_data as CategoriesPageData;

     const user = useAuthStore((state) => state.user);
     const accessToken = useAuthStore((state) => state.accessToken);
     const role = (user?.role ?? 'SUPERADMIN') as AuthRole;
     const navigate = useNavigate();

     const { superadminData, isLoading, fetchSuperadminOverview } = useDashboard();

     // Search State
     const [searchQuery, setSearchQuery] = useState('');
     const [searchFilterType, setSearchFilterType] = useState<'title' | 'category' | 'author'>('title');
     const { books: searchBooks, isLoading: isSearchLoading, fetchBooks } = useBooks();

     useEffect(() => {
          if (!accessToken) {
               navigate('/login', { replace: true });
          }
     }, [accessToken, navigate]);

     useEffect(() => {
          fetchSuperadminOverview();
     }, [fetchSuperadminOverview]);

     useEffect(() => {
          if (searchQuery) {
               const filterKey = searchFilterType === 'title' ? 'search' : searchFilterType;
               fetchBooks({ [filterKey]: searchQuery });
          }
     }, [searchQuery, searchFilterType, fetchBooks]);

     const handleSearchChange = (query: string, filterType: 'title' | 'category' | 'author') => {
          setSearchQuery(query);
          setSearchFilterType(filterType);
     };

     const queryParams = new URLSearchParams(window.location.search);
     const tabParam = queryParams.get('tab');

     // Track which nav tab is active
     const [activeTab, setActiveTab] = useState<string>(
          tabParam || layoutData.superadmin_navbar.active_item
     );

     useEffect(() => {
          if (tabParam) {
               setActiveTab(tabParam);
          }
     }, [tabParam]);

     useEffect(() => {
          const currentTab = new URLSearchParams(window.location.search).get('tab');
          if (activeTab === 'Dashboard') {
               if (currentTab) {
                    navigate('/superadmin/dashboard', { replace: true });
               }
          } else if (activeTab !== currentTab) {
               navigate(`/superadmin/dashboard?tab=${activeTab}`, { replace: true });
          }
     }, [activeTab, navigate]);

     const liveLayoutData: DashboardLayoutData = {
          ...layoutData,
          superadmin_navbar: {
               ...layoutData.superadmin_navbar,
               nav_items: [], // Set to empty so no nav tabs render in top header navbar
               active_item: activeTab,
          },
     };

     const sidebarItems = (role === 'MANAGER'
          ? ['Dashboard', 'Analytics', 'Reports']
          : role === 'ADMIN'
               ? ['Dashboard', 'Categories', 'Banners', 'Reviews', 'Managers', 'Analytics', 'Reports']
               : [...layoutData.superadmin_navbar.nav_items]
     ).filter(item => item !== 'Admins' && item !== 'Managers');

     if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER') {
          if (!sidebarItems.includes('Ebooks')) {
               sidebarItems.splice(1, 0, 'Ebooks');
          }
     }

     if (role === 'SUPERADMIN') {
          if (!sidebarItems.includes('Reports')) {
               sidebarItems.push('Reports');
          }
          if (!sidebarItems.includes('Institutions')) {
               sidebarItems.push('Institutions');
          }
          if (!sidebarItems.includes('Subscriptions')) {
               sidebarItems.push('Subscriptions');
          }
          if (!sidebarItems.includes('Free Candidates')) {
               sidebarItems.push('Free Candidates');
          }
          if (!sidebarItems.includes('Contact Messages')) {
               sidebarItems.push('Contact Messages');
          }
          if (!sidebarItems.includes('Coupons')) {
               sidebarItems.push('Coupons');
          }
          if (!sidebarItems.includes('Settings')) {
               sidebarItems.push('Settings');
          }
     }

     // Render the correct page based on active tab
     const renderContent = () => {
          if (searchQuery) {
               return (
                    <Search_Results
                         books={searchBooks}
                         query={searchQuery}
                         isLoading={isSearchLoading}
                         onClearSearch={() => handleSearchChange('', 'title')}
                    />
               );
          }

          if (activeTab === 'Ebooks') {
               return <Ebooks_Page role={role} />;
          }

          if (activeTab === 'Categories') {
               return <Categories_Page data={categoriesPageData} role={role} />;
          }

          if (activeTab === 'Banners') {
               return <Banners_Page role={role} />;
          }

          if (activeTab === 'Reviews') {
               return <Reviews_Moderation_Page />;
          }

          if (activeTab === 'Admins') {
               return <Admins_Page />;
          }

          if (activeTab === 'Managers') {
               return <Managers_Page />;
          }

          if (activeTab === 'Analytics') {
               return <Analytics_Page />;
          }

          if (activeTab === 'Reports') {
               return <Reports_Page />;
          }

          if (activeTab === 'Subscriptions' && role === 'SUPERADMIN') {
               return <Subscription_Plans_Manager />;
          }

          if (activeTab === 'Settings' && role === 'SUPERADMIN') {
               return <Settings_Page />;
          }

          if (activeTab === 'Institutions' && role === 'SUPERADMIN') {
               return <Institutions_Page />;
          }

          if (activeTab === 'Free Candidates' && role === 'SUPERADMIN') {
               return <Free_Candidates_Page />;
          }

          if (activeTab === 'Contact Messages' && role === 'SUPERADMIN') {
               return <Contact_Messages_Page />;
          }

          if (activeTab === 'Coupons' && role === 'SUPERADMIN') {
               return <Coupons_Page />;
          }


          // Default: superadmin overview
          if (isLoading && !superadminData) {
               return (
                    <div className="author_overview" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                         {/* Stats Grid Skeleton */}
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                              {[...Array(3)].map((_, i) => (
                                   <Skeleton key={i} height="92px" borderRadius="14px" />
                              ))}
                         </div>

                         {/* Latest Book Skeleton */}
                         <Skeleton height="226px" borderRadius="16px" />

                         {/* Active Manuscripts Skeleton */}
                         <div>
                              <Skeleton width="180px" height="24px" style={{ marginBottom: 16 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                   {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} height="140px" borderRadius="12px" />
                                   ))}
                              </div>
                         </div>
                    </div>
               );
          }
          return (
               <Dashboard_Overview
                    data={fallbackData}
                    role="superadmin"
                    superadminStats={superadminData ?? undefined}
                    userRole={role}
               />
          );
     };

     return (
          <Dashboard_Layout
               data={liveLayoutData}
               role="superadmin"
               onNavTabChange={setActiveTab}
               onSearchChange={handleSearchChange}
          >
               <div className="superadmin_layout">
                    <aside className="superadmin_sidebar">
                         <div className="superadmin_sidebar__title">Studio Menu</div>
                         <nav className="superadmin_sidebar__nav">
                              {sidebarItems.map((item) => (
                                   <button
                                        key={item}
                                        type="button"
                                        className={`superadmin_sidebar__item ${activeTab === item ? 'superadmin_sidebar__item--active' : ''} ${item === 'Dashboard' ? 'superadmin_sidebar__item--dashboard' : ''}`}
                                        onClick={() => setActiveTab(item)}
                                   >
                                        {getIcon(item)}
                                        <span>{item}</span>
                                   </button>
                              ))}
                         </nav>
                    </aside>
                    <div className="superadmin_layout__content">
                         {renderContent()}
                    </div>
               </div>
          </Dashboard_Layout>
     );
};

export default Superadmin_Dashboard;
