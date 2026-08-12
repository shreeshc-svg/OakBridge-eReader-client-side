import { NavLink } from 'react-router-dom';
import type {
     DashboardRole,
     DashboardSidebarData,
     DashboardSidebarIcon,
} from '../../types/dashboard.types';
import './Dashboard_Sidebar.scss';

interface DashboardSidebarProps {
     data: DashboardSidebarData;
     isOpen: boolean;
     onClose: () => void;
     role?: DashboardRole;
}

const iconPaths: Record<DashboardSidebarIcon, string[]> = {
     dashboard: [
          'M3 13h8V3H3v10Z',
          'M13 21h8V11h-8v10Z',
          'M13 3v6h8V3h-8Z',
          'M3 21h8v-6H3v6Z',
     ],
     books: [
          'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
          'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z',
     ],
     add: ['M12 5v14', 'M5 12h14'],
     drafts: [
          'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
          'M14 2v6h6',
          'M8 13h8',
          'M8 17h5',
     ],
     reviews: [
          'M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z',
          'M8 9h8',
          'M8 13h5',
     ],
     analytics: ['M4 19V5', 'M4 19h16', 'M8 16v-5', 'M12 16V8', 'M16 16v-9'],
     earnings: [
          'M12 2v20',
          'M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6',
     ],
     settings: [
          'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z',
          'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
     ],
     discover: [
          'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
          'm15 9-2 6-6 2 2-6 6-2Z',
     ],
     reading: [
          'M2 4h7a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2V4Z',
          'M22 4h-7a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h8V4Z',
     ],
     bookmark: ['M6 3h12a1 1 0 0 1 1 1v18l-7-4-7 4V4a1 1 0 0 1 1-1Z'],
     notes: ['M4 4h16v16H4V4Z', 'M8 8h8', 'M8 12h8', 'M8 16h5'],
     history: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6', 'M12 7v5l3 2'],
};

const SidebarIcon = ({ name }: { name: DashboardSidebarIcon }) => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          {iconPaths[name].map((path) => (
               <path key={path} d={path} />
          ))}
     </svg>
);

const Dashboard_Sidebar = ({
     data,
     isOpen,
     onClose,
     role = 'user',
}: DashboardSidebarProps) => {
     return (
          <>
               <button
                    type="button"
                    className={`dashboard_sidebar__backdrop ${isOpen ? 'is_open' : ''}`}
                    aria-label="Close sidebar"
                    onClick={onClose}
               />
               <aside
                    className={`dashboard_sidebar dashboard_sidebar--${role} ${isOpen ? 'is_open' : ''}`}
               >
                    <div className="dashboard_sidebar__header">
                         <span className="dashboard_sidebar__brand">
                              {data.label}
                         </span>
                    </div>

                    <nav
                         className="dashboard_sidebar__nav"
                         aria-label="Dashboard navigation"
                    >
                         {data.sections.map((section) => (
                              <section
                                   className="dashboard_sidebar__section"
                                   key={section.title}
                              >
                                   <h2 className="dashboard_sidebar__section_title">
                                        {section.title}
                                   </h2>
                                   <div className="dashboard_sidebar__links">
                                        {section.items.map((item) => (
                                             <NavLink
                                                  className={({ isActive }) =>
                                                       `dashboard_sidebar__link ${isActive ? 'active' : ''}`
                                                  }
                                                  key={item.path}
                                                  onClick={onClose}
                                                  to={item.path}
                                             >
                                                  <SidebarIcon
                                                       name={item.icon}
                                                  />
                                                  <span>{item.label}</span>
                                             </NavLink>
                                        ))}
                                   </div>
                              </section>
                         ))}
                    </nav>
               </aside>
          </>
     );
};

export default Dashboard_Sidebar;
