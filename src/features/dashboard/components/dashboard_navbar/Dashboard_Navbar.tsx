import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, getDashboardPathForRole } from '../../../../store/auth.store';
import { useCartStore } from '../../../../store/cart.store';
import { useLogout } from '../../../auth/hooks/use_logout';
import { useDebounce } from '../../../../hooks/use_debounce';
import type {
     DashboardNavbarData,
     DashboardLogoutData,
} from '../../types/dashboard.types';
import { notifications_api, type AppNotification } from '../../api/notifications.api';
import { Notifications_Dropdown } from '../notifications/Notifications_Dropdown';
import './Dashboard_Navbar.scss';

interface DashboardNavbarProps {
     data: DashboardNavbarData;
     logoutData: DashboardLogoutData;
     onTabChange?: (tab: string) => void;
     onSearchChange?: (query: string, filterType: 'title' | 'category' | 'author') => void;
}

const SearchIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
     </svg>
);

const LogoutIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
     </svg>
);

const SettingsIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
     </svg>
);

const BellIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
     </svg>
);

const CartNavIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          aria-hidden="true"
     >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
     </svg>
);

const HeartIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          aria-hidden="true"
     >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
     </svg>
);

const LibraryIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
     >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
     </svg>
);

const HistoryIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
     >
          <path d="M12 8v4l3 3" />
          <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
     </svg>
);

const ProfileIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
     >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
     </svg>
);

const AdminsIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
     >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
     </svg>
);

const ManagersIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
          aria-hidden="true"
     >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
     </svg>
);

const getDashboardLabelForRole = (role?: string | null) => {
     if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'MANAGER') {
          return 'Admin Studio';
     }
     if (role === 'INSTITUTION_ADMIN') {
          return 'Institution Dashboard';
     }
     return 'My Library';
};

const Dashboard_Navbar = ({
     data,
     logoutData,
     onTabChange,
     onSearchChange,
}: DashboardNavbarProps) => {
     const user = useAuthStore((state) => state.user);
     const clearAuth = useAuthStore((state) => state.clearAuth);
     const { mutate: logoutUser, isPending } = useLogout();
     const { cartCount, fetchCartCount } = useCartStore();
     const navigate = useNavigate();

     const isSystemAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

     const [dropdownOpen, setDropdownOpen] = useState(false);
     const [logoutError, setLogoutError] = useState('');
     const dropdownRef = useRef<HTMLDivElement>(null);

     // Notifications State & Handlers
     const [notifications, setNotifications] = useState<AppNotification[]>([]);
     const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
     const notifDropdownRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          if (user && !isSystemAdmin) {
               fetchCartCount();
          }
     }, [user, isSystemAdmin, fetchCartCount]);

     const fetchNotifications = async () => {
          try {
               const res = await notifications_api.get_notifications();
               setNotifications(res.notifications);
          } catch (error) {
               console.error('Failed to fetch notifications:', error);
          }
     };

     useEffect(() => {
          if (!user) return;
          fetchNotifications();

          // Poll every 60 seconds
          const interval = setInterval(fetchNotifications, 60000);
          return () => clearInterval(interval);
     }, [user]);

     const handleMarkRead = async (id: string) => {
          try {
               // Optimistic UI update
               setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
               );
               await notifications_api.mark_read(id);
          } catch (error) {
               console.error('Failed to mark notification as read:', error);
               fetchNotifications(); // revert
          }
     };

     const handleMarkAllRead = async () => {
          try {
               // Optimistic UI update
               setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
               await notifications_api.mark_all_read();
          } catch (error) {
               console.error('Failed to mark all notifications as read:', error);
               fetchNotifications(); // revert
          }
     };

     // Search & Filter State
     const [searchValue, setSearchValue] = useState('');
     const [filterType, _setFilterType] = useState<'title' | 'category' | 'author'>('title');
     const debouncedSearch = useDebounce(searchValue, 500);

     useEffect(() => {
          if (onSearchChange) {
               onSearchChange(debouncedSearch, filterType);
          }
     }, [debouncedSearch, filterType, onSearchChange]);

     // Close dropdowns when clicking outside
     useEffect(() => {
          const handleClickOutside = (e: MouseEvent) => {
               if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.target as Node)
               ) {
                    setDropdownOpen(false);
               }
               if (
                    notifDropdownRef.current &&
                    !notifDropdownRef.current.contains(e.target as Node)
               ) {
                    setNotifDropdownOpen(false);
               }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () =>
               document.removeEventListener('mousedown', handleClickOutside);
     }, []);

     const avatarLabel = useMemo(() => {
          const source = user?.username || user?.email || 'User';
          const initials = source
               .split(/[\s@._-]+/)
               .filter(Boolean)
               .slice(0, 2)
               .map((part) => part[0]?.toUpperCase())
               .join('');
          return initials || 'U';
     }, [user]);

     const redirectToLogin = () => {
          clearAuth();
          navigate('/login', { replace: true });
     };

     const handleLogout = () => {
          setLogoutError('');

          if (!user?.id) {
               redirectToLogin();
               return;
          }

          logoutUser(
               { userId: user.id },
               {
                    onSuccess: () => {
                         setDropdownOpen(false);
                         redirectToLogin();
                    },
                    onError: (err) => {
                         setLogoutError(
                              err.response?.data?.message ||
                                   logoutData.error_fallback
                         );
                    },
               }
          );
     };

     const handleBrandClick = () => {
          navigate('/');
     };

     const activeTab = useMemo(() => {
          const path = window.location.pathname;
          if (path === '/') return 'Bookstore';
          if (path === '/contact') return 'Contact Us';
          
          if (data.active_item === 'Dashboard' || data.active_item === 'My Library') {
               if (path.startsWith('/superadmin/dashboard')) return 'Dashboard';
               if (path.startsWith('/institution/dashboard')) return 'Dashboard';
               if (path.startsWith('/user/dashboard')) {
                    return (user && user.role === 'INSTITUTION_ADMIN') ? 'Dashboard' : 'My Library';
               }
          }
          
          return (user && user.role === 'INSTITUTION_ADMIN' && data.active_item === 'My Library') ? 'Dashboard' : data.active_item;
     }, [data.active_item, user]);

     const navbarTabs = useMemo(() => {
          let items = data.nav_items;
          if (user && user.role === 'INSTITUTION_ADMIN') {
               items = items.map((t) => (t === 'My Library' ? 'Dashboard' : t));
          }
          return items.filter((item) => {
               if (item === 'Packages') {
                    if (user && (user.role === 'INSTITUTION_ADMIN' || user.role === 'USER' || user.role === 'INSTITUTION_MEMBER')) return false;
               }
               return true;
          });
     }, [data.nav_items, user]);

     const handleTabClick = (item: string) => {
          if (item === 'Bookstore') {
               navigate('/');
          } else if (item === 'Contact Us') {
               navigate('/contact');
          } else if (item === 'My Library' || item === 'Dashboard') {
               const path = getDashboardPathForRole(user?.role);
               navigate(path);
          } else if (
               [
                    'Manuscripts',
                    'Categories',
                    'Banners',
                    'Reviews',
                    'Admins',
                    'Analytics',
                    'Settings',
               ].includes(item)
          ) {
               // Implemented tabs: do not toast
          } else {
               import('react-hot-toast').then(({ toast }) => {
                    toast.dismiss();
                    toast(`${item} page is coming soon!`, {
                         icon: '✨',
                         style: {
                              background: '#0d2342',
                              color: '#fff',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: '14px',
                              borderRadius: '8px',
                              padding: '12px 16px',
                         }
                    });
               });
          }
          onTabChange?.(item);
     };

     return (
          <header className={`dashboard_navbar ${!isSystemAdmin ? 'dashboard_navbar--reader' : ''}`}>
               <div className="dashboard_navbar__container">
                    <div className="dashboard_navbar__brand">
                         <span 
                              className="dashboard_navbar__brand_name"
                              onClick={handleBrandClick}
                              style={{ cursor: 'pointer' }}
                         >
                              Oakbridge
                         </span>
                         <span className={`dashboard_navbar__brand_badge ${isSystemAdmin ? 'dashboard_navbar__brand_badge--studio' : ''}`}>
                              {isSystemAdmin ? 'STUDIO' : 'READER'}
                         </span>
                    </div>

                    <nav className="dashboard_navbar__tabs" aria-label="Primary">
                         {navbarTabs.map((item) => (
                              <button
                                   type="button"
                                   className={
                                        item === activeTab ? 'active' : ''
                                   }
                                   key={item}
                                   onClick={() => handleTabClick(item)}
                              >
                                   {item}
                              </button>
                         ))}
                    </nav>

                    <div className="dashboard_navbar__actions">
                         <div className="dashboard_navbar__search_wrapper">
                              <div className="dashboard_navbar__search_input_wrap">
                                   <SearchIcon />
                                   <input 
                                        type="text" 
                                        className="dashboard_navbar__search_input"
                                        placeholder={data.search_placeholder || "Search your library"}
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                   />
                              </div>
                         </div>

                         {/* Wishlist Icon */}
                         {user && !isSystemAdmin && (
                              <button
                                   type="button"
                                   className="dashboard_navbar__cart_btn dashboard_navbar__wishlist_btn"
                                   aria-label="Wishlist"
                                   onClick={() => navigate('/wishlist')}
                              >
                                   <HeartIcon />
                              </button>
                         )}

                         {/* Cart Icon */}
                         {user && !isSystemAdmin && (
                              <button
                                   type="button"
                                   className="dashboard_navbar__cart_btn"
                                   aria-label="Shopping cart"
                                   onClick={() => navigate('/cart')}
                              >
                                   <CartNavIcon />
                                   {cartCount > 0 && (
                                        <span className="dashboard_navbar__cart_badge">
                                             {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                   )}
                              </button>
                         )}

                         {/* Notifications Bell */}
                         <div
                              className="dashboard_navbar__notif_wrap"
                              ref={notifDropdownRef}
                         >
                              <button
                                   type="button"
                                   className="dashboard_navbar__notif_btn"
                                   aria-label="Notifications"
                                   aria-expanded={notifDropdownOpen}
                                   onClick={() => setNotifDropdownOpen((prev) => !prev)}
                              >
                                   <BellIcon />
                                   {notifications.filter((n) => !n.isRead).length > 0 && (
                                        <span className="dashboard_navbar__notif_badge" />
                                   )}
                              </button>

                              {notifDropdownOpen && (
                                   <Notifications_Dropdown
                                        notifications={notifications}
                                        onMarkRead={handleMarkRead}
                                        onMarkAllRead={handleMarkAllRead}
                                   />
                              )}
                         </div>

                         {/* Avatar + Dropdown */}
                         <div
                              className="dashboard_navbar__avatar_wrap"
                              ref={dropdownRef}
                         >
                              <button
                                   type="button"
                                   className="dashboard_navbar__avatar"
                                   aria-label="User menu"
                                   aria-expanded={dropdownOpen}
                                   aria-haspopup="menu"
                                   onClick={() => setDropdownOpen((prev) => !prev)}
                              >
                                   {avatarLabel}
                              </button>

                              {dropdownOpen && (
                                   <div
                                        className="dashboard_navbar__dropdown"
                                        role="menu"
                                   >
                                        <div className="dashboard_navbar__dropdown_user">
                                             <strong>
                                                  {user?.username ||
                                                       user?.email ||
                                                       'User'}
                                             </strong>
                                             <span>{user?.email}</span>
                                        </div>

                                        <div className="dashboard_navbar__dropdown_divider" />

                                        <button
                                             type="button"
                                             role="menuitem"
                                             className="dashboard_navbar__dropdown_item"
                                             onClick={() => {
                                                  setDropdownOpen(false);
                                                  navigate(getDashboardPathForRole(user?.role));
                                             }}
                                        >
                                             <LibraryIcon />
                                             <span>{getDashboardLabelForRole(user?.role)}</span>
                                        </button>

                                        <div className="dashboard_navbar__dropdown_divider" />

                                        <button
                                             type="button"
                                             role="menuitem"
                                             className="dashboard_navbar__dropdown_item"
                                             onClick={() => {
                                                  setDropdownOpen(false);
                                                  navigate('/settings/profile');
                                             }}
                                        >
                                             <ProfileIcon />
                                             <span>Profile Settings</span>
                                        </button>

                                        <div className="dashboard_navbar__dropdown_divider" />

                                        {(user?.role === 'USER' || user?.role === 'INSTITUTION_ADMIN') && (
                                             <>
                                                  <button
                                                       type="button"
                                                       role="menuitem"
                                                       className="dashboard_navbar__dropdown_item"
                                                       onClick={() => {
                                                            setDropdownOpen(false);
                                                            navigate('/user/purchases');
                                                       }}
                                                  >
                                                       <HistoryIcon />
                                                       <span>My Purchases</span>
                                                  </button>
                                                  <div className="dashboard_navbar__dropdown_divider" />
                                             </>
                                        )}

                                        {user?.role === 'SUPERADMIN' && (
                                              <>
                                                   <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="dashboard_navbar__dropdown_item"
                                                        onClick={() => {
                                                             setDropdownOpen(false);
                                                             navigate('/superadmin/dashboard?tab=Admins');
                                                             onTabChange?.('Admins');
                                                        }}
                                                   >
                                                        <AdminsIcon />
                                                        <span>Manage Admins</span>
                                                   </button>
                                                   <div className="dashboard_navbar__dropdown_divider" />
                                              </>
                                         )}

                                         {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                                              <>
                                                   <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="dashboard_navbar__dropdown_item"
                                                        onClick={() => {
                                                             setDropdownOpen(false);
                                                             navigate('/superadmin/dashboard?tab=Managers');
                                                             onTabChange?.('Managers');
                                                        }}
                                                   >
                                                        <ManagersIcon />
                                                        <span>Manage Managers</span>
                                                   </button>
                                                   <div className="dashboard_navbar__dropdown_divider" />
                                              </>
                                         )}

                                         {user?.role === 'SUPERADMIN' && (
                                              <>
                                                   <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="dashboard_navbar__dropdown_item"
                                                        onClick={() => {
                                                             setDropdownOpen(false);
                                                             navigate('/superadmin/dashboard?tab=Settings');
                                                             onTabChange?.('Settings');
                                                        }}
                                                   >
                                                        <SettingsIcon />
                                                        <span>Settings</span>
                                                   </button>
                                                   <div className="dashboard_navbar__dropdown_divider" />
                                              </>
                                         )}

                                        <button
                                             type="button"
                                             role="menuitem"
                                             className="dashboard_navbar__dropdown_item dashboard_navbar__dropdown_item--logout"
                                             onClick={handleLogout}
                                             disabled={isPending}
                                        >
                                             <LogoutIcon />
                                             <span>
                                                  {isPending
                                                       ? logoutData.pending_label
                                                       : logoutData.idle_label}
                                             </span>
                                        </button>

                                        {logoutError && (
                                             <p className="dashboard_navbar__dropdown_error">
                                                  {logoutError}
                                             </p>
                                        )}
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
          </header>
     );
};

export default Dashboard_Navbar;
