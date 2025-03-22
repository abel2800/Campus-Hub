import React, { useState, useEffect } from 'react';
import {
  HomeOutlined,
  BookOutlined,
  TeamOutlined,
  MessageOutlined,
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';

const { Header, Sider } = Layout;

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isTeacher } = useAuth();
  const [selectedKey, setSelectedKey] = useState('home');

  useEffect(() => {
    // Update selected key when location changes
    const path = location.pathname;
    if (path === '/' || path === '/home') {
      setSelectedKey('home');
    } else {
      const key = path.split('/')[1];
      setSelectedKey(key);
    }
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // Menu items for the sidebar
  const sideMenuItems = [
    { key: 'home', icon: <HomeOutlined />, label: 'Home', onClick: () => navigate('/home') },
    // Only show My Courses for non-teacher users
    ...(isTeacher && isTeacher() ? [] : [
      { key: 'my-courses', icon: <BookOutlined />, label: 'My Courses', onClick: () => navigate('/my-courses') }
    ]),
    { key: 'social-media', icon: <AppstoreOutlined />, label: 'Social Media', onClick: () => navigate('/social-media') },
    { key: 'friends', icon: <TeamOutlined />, label: 'Friends', onClick: () => navigate('/friends') },
    { key: 'chat', icon: <MessageOutlined />, label: 'Chat', onClick: () => navigate('/chat') },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  // Get the current page name from the pathname
  const getPageTitle = () => {
    const path = location.pathname.slice(1);
    if (path === '') return 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  const pageTitle = getPageTitle();

  return (
    <>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        theme="light"
        width={250}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 2
        }}
      >
        {/* Campus Hub Title */}
        <div 
          style={{ 
            padding: '16px', 
            textAlign: 'center', 
            backgroundColor: '#1890ff',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
            Campus Hub
          </Typography.Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={sideMenuItems}
        />
      </Sider>

      {/* Header */}
      <Header
        style={{
          padding: 0,
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          right: 0,
          width: `calc(100% - ${collapsed ? 80 : 250}px)`,
          zIndex: 1,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Page Title */}
        <Typography.Title level={4} style={{ margin: 16 }}>
          {pageTitle}
        </Typography.Title>

        {/* Right Side: Notifications and User Profile */}
        <Space size="middle" style={{ marginRight: 16 }}>
          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <ProfileDropdown />
        </Space>
      </Header>
    </>
  );
};

export default Navbar;