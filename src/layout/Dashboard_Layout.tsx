import type { ReactNode } from 'react';
import Dashboard_Navbar from '../features/dashboard/components/dashboard_navbar/Dashboard_Navbar';
import type {
     DashboardLayoutData,
     DashboardRole,
} from '../features/dashboard/types/dashboard.types';
import { Breadcrumbs } from '../components/common/breadcrumbs/Breadcrumbs';
import './Dashboard_Layout.scss';

interface DashboardLayoutProps {
     children: ReactNode;
     data: DashboardLayoutData;
     role: DashboardRole;
     /** @deprecated No longer used — new designs integrate content into the body */
     headerSlot?: ReactNode;
     /** Callback fired when a nav tab is clicked */
     onNavTabChange?: (tab: string) => void;
     /** Callback fired when search changes */
     onSearchChange?: (query: string, filterType: 'title' | 'category' | 'author') => void;
}

const Dashboard_Layout = ({
     children,
     data,
     role,
     headerSlot,
     onNavTabChange,
     onSearchChange,
}: DashboardLayoutProps) => {
     // Sidebar is removed

     const navbarData = role === 'user' ? data.user_navbar : data.superadmin_navbar;

     return (
          <div className={`dashboard_layout dashboard_layout--${role}`}>
               <div className="dashboard_layout__shell">
                    <div className="dashboard_layout__top">
                         <Dashboard_Navbar
                              data={navbarData}
                              logoutData={data.logout}
                              onTabChange={onNavTabChange}
                              onSearchChange={onSearchChange}
                         />
                         {headerSlot && (
                              <div className="dashboard_layout__header_slot">
                                   {headerSlot}
                              </div>
                         )}
                    </div>
                    <div className="dashboard_layout__body">
                         <Breadcrumbs />
                         <main className="dashboard_layout__content">
                              {children}
                         </main>
                    </div>
               </div>
          </div>
     );
};

export default Dashboard_Layout;
