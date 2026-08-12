import type { AppNotification } from '../../api/notifications.api';
import './Notifications_Dropdown.scss';

interface NotificationsDropdownProps {
     notifications: AppNotification[];
     onMarkRead: (id: string) => void;
     onMarkAllRead: () => void;
}

const formatRelativeTime = (dateStr: string) => {
     try {
          const now = new Date();
          const created = new Date(dateStr);
          const diffMs = now.getTime() - created.getTime();
          if (diffMs < 0) return 'Just now';
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins < 1) return 'Just now';
          if (diffMins < 60) return `${diffMins}m ago`;
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) return `${diffHours}h ago`;
          const diffDays = Math.floor(diffHours / 24);
          return `${diffDays}d ago`;
     } catch (e) {
          return 'Recent';
     }
};

export const Notifications_Dropdown = ({
     notifications,
     onMarkRead,
     onMarkAllRead,
}: NotificationsDropdownProps) => {
     const unreadCount = notifications.filter((n) => !n.isRead).length;

     return (
          <div className="notifications_dropdown" role="menu">
               <div className="notifications_dropdown__header">
                    <div className="notifications_dropdown__title_row">
                         <h3>Notifications</h3>
                         {unreadCount > 0 && (
                              <span className="notifications_dropdown__badge">
                                   {unreadCount} new
                              </span>
                         )}
                    </div>
                    {unreadCount > 0 && (
                         <button
                              type="button"
                              className="notifications_dropdown__mark_all"
                              onClick={onMarkAllRead}
                         >
                              Mark all as read
                         </button>
                    )}
               </div>

               <div className="notifications_dropdown__divider" />

               <div className="notifications_dropdown__list">
                    {notifications.length === 0 ? (
                         <div className="notifications_dropdown__empty">
                              <span className="notifications_dropdown__empty_icon">🔔</span>
                              <p>All caught up!</p>
                              <span>No new notifications at this time.</span>
                         </div>
                    ) : (
                         notifications.map((notification) => (
                              <div
                                   key={notification.id}
                                   className={`notifications_dropdown__item ${
                                        !notification.isRead ? 'notifications_dropdown__item--unread' : ''
                                   }`}
                                   onClick={() => {
                                        if (!notification.isRead) {
                                             onMarkRead(notification.id);
                                        }
                                   }}
                              >
                                   <div className="notifications_dropdown__item_header">
                                        <span className="notifications_dropdown__item_title">
                                             {notification.title}
                                        </span>
                                        {!notification.isRead && (
                                             <span className="notifications_dropdown__dot" />
                                        )}
                                   </div>
                                   <p className="notifications_dropdown__item_msg">
                                        {notification.message}
                                   </p>
                                   <span className="notifications_dropdown__item_time">
                                        {formatRelativeTime(notification.createdAt)}
                                   </span>
                              </div>
                         ))
                    )}
               </div>
          </div>
     );
};

export default Notifications_Dropdown;
