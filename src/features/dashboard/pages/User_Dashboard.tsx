import Dashboard_Overview from '../components/dashboard_overview/Dashboard_Overview';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import Dashboard_Layout from '../../../layout/Dashboard_Layout';
import { dashboard_layout_data, user_dashboard_data } from '../../../data';
import type {
     DashboardLayoutData,
     DashboardOverviewData,
} from '../types/dashboard.types';
import { useDashboard } from '../hooks/use_dashboard';
import { useEffect, useState } from 'react';
import Search_Results from '../components/search_results/Search_Results';
import { useBooks } from '../../books/hooks/use_books';
import { useAuthStore } from '../../../store/auth.store';
import { useNavigate } from 'react-router-dom';

const User_Dashboard = () => {
     const layoutData = dashboard_layout_data as DashboardLayoutData;
     const { data, isLoading: dashboardLoading, fetchUserOverview } = useDashboard();
     
     const accessToken = useAuthStore((state) => state.accessToken);
     const user = useAuthStore((state) => state.user);
     const navigate = useNavigate();

     // Search State
     const [searchQuery, setSearchQuery] = useState('');
     const [searchFilterType, setSearchFilterType] = useState<'title' | 'category' | 'author'>('title');
     const { books: searchBooks, isLoading: isSearchLoading, fetchBooks } = useBooks();

     useEffect(() => {
          if (!accessToken) {
               navigate('/login', { replace: true });
          } else if (user?.role === 'INSTITUTION_ADMIN' && user?.institution?.tier === 'NONE') {
               navigate('/subscription', { replace: true });
          }
     }, [accessToken, user, navigate]);

     useEffect(() => {
          fetchUserOverview();
     }, [fetchUserOverview]);

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

     const displayData = data || (user_dashboard_data as DashboardOverviewData);

     return (
          <Dashboard_Layout data={layoutData} role="user" onSearchChange={handleSearchChange}>
               {searchQuery ? (
                    <Search_Results books={searchBooks} query={searchQuery} isLoading={isSearchLoading} />
               ) : dashboardLoading && !data ? (
                    <div className="ud_root" style={{ padding: '24px 0' }}>
                         {/* Top Row Grid skeleton */}
                         <div className="ud_top_row">
                              {/* Hero skeleton */}
                              <Skeleton height="350px" borderRadius="24px" />
                              
                              {/* Stats skeleton */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', justifyContent: 'space-between' }}>
                                   {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} height="106px" borderRadius="20px" style={{ flex: 1 }} />
                                   ))}
                              </div>
                              
                              {/* Activity skeleton */}
                              <Skeleton height="350px" borderRadius="24px" />
                         </div>

                         {/* Shelves skeleton */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              <Skeleton width="150px" height="28px" />
                              <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
                                   {[...Array(5)].map((_, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 160 }}>
                                             <Skeleton height="240px" borderRadius="12px" />
                                             <Skeleton width="80%" height="16px" />
                                             <Skeleton width="50%" height="12px" />
                                        </div>
                                   ))}
                              </div>
                         </div>
                    </div>
               ) : (
                    <Dashboard_Overview data={displayData} role="user" onRefresh={fetchUserOverview} />
               )}
          </Dashboard_Layout>
     );
};

export default User_Dashboard;
