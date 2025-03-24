import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Space, message } from 'antd';
import { 
  HomeOutlined, 
  BookOutlined, 
  TeamOutlined, 
  MessageOutlined, 
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';
import api from '../utils/axios';
import ThemeToggle from './ThemeToggle';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();
  
  // Add notification content
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Determine which menu item should be selected based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    
    // Check exact match first
    if (menuItems.some(item => item.key === path)) {
      return path;
    }
    
    // Handle nested routes
    if (path === '/home' || path === '/') return '1';
    if (path.startsWith('/chat')) return '5';
    if (path.startsWith('/courses')) return '2';
    if (path.startsWith('/my-courses')) return '2';
    if (path.startsWith('/profile')) return '6';
    if (path.startsWith('/social-media')) return '3';
    
    // Default to home
    return '1';
  };

  // Define handleLogout before it's used
  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logged out successfully');
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error('Failed to log out');
    }
  };

  // Add profile menu items
  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate(`/profile/${user?.id}`)}>
        View Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications();
    
    // Set up polling for notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      console.log('Fetched notifications:', response.data);
      
      // Use the data from the response
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // For demo, show some sample notifications
      const sampleNotifications = [
        { id: 1, type: 'FRIEND_REQUEST', content: 'John sent you a friend request', read: false, createdAt: new Date() },
        { id: 2, type: 'POST_LIKE', content: 'Sarah liked your post', read: false, createdAt: new Date(Date.now() - 3600000) },
        { id: 3, type: 'MESSAGE', content: 'New message from Alex', read: true, createdAt: new Date(Date.now() - 7200000) }
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.read).length);
    }
  };

  // Add a function to mark notifications as read
  const markAsRead = async (notificationId) => {
    try {
      // Update the notification status in the backend
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Update the UI optimistically
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update the unread count
      setUnreadCount(prev => {
        // Only decrease count if the notification was not read before
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const notificationMenu = (
    <Menu style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <Menu.Item key="title" disabled style={{ fontWeight: 'bold', cursor: 'default' }}>
        Notifications
      </Menu.Item>
      <Menu.Divider />
      
      {notifications.length === 0 ? (
        <Menu.Item disabled>No notifications</Menu.Item>
      ) : (
        notifications.map(notification => (
          <Menu.Item 
            key={notification.id}
            style={{ 
              backgroundColor: notification.read ? 'transparent' : '#f0f8ff',
              padding: '8px 12px' 
            }}
            onClick={() => {
              // Mark as read
              if (!notification.read) {
                markAsRead(notification.id);
              }
              
              // Navigate based on type
              if (notification.type === 'FRIEND_REQUEST') {
                navigate('/friends');
              } else if (notification.type === 'MESSAGE') {
                navigate('/chat');
              } else if (notification.type === 'POST_LIKE') {
                navigate('/social-media');
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ marginRight: 12 }}>
                {notification.type === 'FRIEND_REQUEST' ? (
                  <TeamOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                ) : notification.type === 'MESSAGE' ? (
                  <MessageOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                ) : (
                  <BellOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div>{notification.content}</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {new Date(notification.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      )}
      
      <Menu.Divider />
      <Menu.Item key="view-all" onClick={() => navigate('/notifications')}>
        View all notifications
      </Menu.Item>
    </Menu>
  );

  // Add teacher-specific menu items if the user is a teacher
  const teacherMenuItems = [];

  // Include the teacher menu items in the menu
  const menuItems = [
    ...teacherMenuItems,
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link to="/home">Home</Link>,
    },
    // Only show My Courses for students (not for teachers)
    ...(isTeacher() ? [] : [
      {
        key: '2',
        icon: <BookOutlined />,
        label: <Link to="/my-courses">My Courses</Link>,
      }
    ]),
    {
      key: '3',
      icon: <GlobalOutlined />,
      label: <Link to="/social-media">Social Media</Link>,
    },
    {
      key: '4',
      icon: <TeamOutlined />,
      label: <Link to="/friends">Friends</Link>,
    },
    {
      key: '5',
      icon: <MessageOutlined />,
      label: <Link to="/chat">Chat</Link>,
    },
    {
      key: '6',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
  ];

  // Get the current page title based on pathname
  const getTitle = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/home') return 'Home';
    if (location.pathname.includes('/profile')) return 'Profile';
    if (location.pathname.includes('/settings')) return 'Settings';
    if (location.pathname.includes('/social-media')) return 'Social Media';
    if (location.pathname.includes('/friends')) return 'Friends';
    if (location.pathname.includes('/chat')) return 'Messages';
    if (location.pathname.includes('/courses') && !location.pathname.includes('/my-courses')) return 'Courses';
    // Only show "My Courses" title for non-teacher users
    if (location.pathname.includes('/my-courses')) {
      return isTeacher() ? 'Home' : 'My Courses';
    }
    return 'Campus Hub';
  };

  return (
    <Layout className="site-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="site-sidebar"
        width={200}
        collapsedWidth={80}
        style={{ 
          overflow: 'auto', 
          height: '100vh', 
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <div className="logo" style={{ 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Link to="/home" style={{ color: '#fff' }}>
            {collapsed ? 'CH' : 'Campus Hub'}
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          className="sidebar-menu"
          theme="light"
          style={{ borderRight: 'none' }}
        >
          {menuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
        <div className="sidebar-toggle">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggleSidebar,
          })}
        </div>
      </Sider>
      <Layout className="site-layout-content" style={{
        marginLeft: collapsed ? '80px' : '200px',
        transition: 'margin-left 0.2s',
        minHeight: '100vh'
      }}>
        <Header className="site-header" style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          zIndex: 999,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="header-left">
            <span className="page-title">
              {getTitle()}
            </span>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle style={{ marginRight: '8px' }} />
            <Dropdown 
              overlay={notificationMenu} 
              trigger={['click']} 
              placement="bottomRight"
            >
              <Badge count={unreadCount} size="small">
                <BellOutlined className="header-icon" style={{ fontSize: '20px', cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            
            <Dropdown 
              overlay={profileMenu} 
              trigger={['click']} 
              placement="bottomRight"
            >
              <Avatar 
                src={user?.avatar} 
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }} 
              />
            </Dropdown>
          </div>
        </Header>
        <Content className="site-content" style={{ 
          padding: '16px',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 