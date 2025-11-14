import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { fetchNotifications, markAllAsRead } from '../store/slices/notificationSlice';
import { disconnectSocket } from '../services/socketService';
import './Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);

  React.useEffect(() => {
    dispatch(fetchNotifications({ unreadOnly: false, limit: 10 }));
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/dashboard">CRM Platform</Link>
        </div>
        <div className="navbar-menu">
          <Link
            to="/dashboard"
            className={isActive('/dashboard') ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link to="/leads" className={isActive('/leads') ? 'active' : ''}>
            Leads
          </Link>
          <div className="navbar-notifications">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="btn-link">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${
                          !notification.read ? 'unread' : ''
                        }`}
                      >
                        <p>{notification.message}</p>
                        <small>
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="navbar-user">
            <Link to="/profile">{user?.name}</Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

