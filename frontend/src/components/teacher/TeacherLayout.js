import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Avatar, Badge, Dropdown, Button, Space, 
  Typography, message, Divider, Tooltip
} from 'antd';
import { 
  DashboardOutlined, 
  BookOutlined, 
  TeamOutlined, 
  VideoCameraOutlined,
  BarChartOutlined,
  PlusOutlined, 
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axios';
import styled from 'styled-components';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const LogoContainer = styled.div`
  padding: 24px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #001529;
  color: white;
  user-select: none;
`;

const PageHeader = styled(Header)`
  background: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const MainContent = styled(Content)`
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
`;

const NotificationBadge = styled(Badge)`
  margin-right: 24px;
  cursor: pointer;
`;

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notifications on load
    fetchNotifications();
    
    // Set up polling for notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to sample notifications
      const sampleNotifications = [
        { id: 1, type: 'STUDENT_SUBMISSION', content: 'Alex submitted an assignment', read: false, createdAt: new Date() },
        { id: 2, type: 'COURSE_ENROLLMENT', content: 'New student enrolled in Web Development', read: true, createdAt: new Date(Date.now() - 3600000) },
        { id: 3, type: 'MESSAGE', content: 'Maria sent you a message', read: true, createdAt: new Date(Date.now() - 7200000) }
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'STUDENT_SUBMISSION':
        return <BookOutlined style={{ color: '#52c41a' }} />;
      case 'COURSE_ENROLLMENT':
        return <TeamOutlined style={{ color: '#1890ff' }} />;
      case 'MESSAGE':
        return <MessageOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined style={{ color: '#fa8c16' }} />;
    }
  };

  const notificationMenu = (
    <Menu style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      <Menu.Item key="title" disabled style={{ fontWeight: 'bold' }}>
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
              backgroundColor: notification.read ? 'transparent' : '#e6f7ff',
              padding: '8px 12px'
            }}
            onClick={() => {
              if (!notification.read) {
                markAsRead(notification.id);
              }
              
              // Navigate based on notification type
              if (notification.type === 'STUDENT_SUBMISSION') {
                navigate('/teacher/students');
              } else if (notification.type === 'COURSE_ENROLLMENT') {
                navigate('/teacher/courses');
              } else if (notification.type === 'MESSAGE') {
                navigate('/chat');
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ marginRight: 12 }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div>{notification.content}</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      )}
    </Menu>
  );

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        My Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="student-view" icon={<HomeOutlined />} onClick={() => navigate('/')}>
        Switch to Student View
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/teacher',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/teacher/create-course',
      icon: <PlusOutlined />,
      label: 'Create Course',
    },
    {
      key: '/teacher/students',
      icon: <TeamOutlined />,
      label: 'Students',
    },
    {
      key: '/teacher/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'Messages',
    }
  ];

  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === '/teacher') return 'Dashboard';
    if (path.includes('/courses') && path.includes('/edit')) return 'Edit Course';
    if (path.includes('/courses') && path.includes('/create')) return 'Create Course';
    if (path.includes('/courses') && path.includes('/')) return 'Course Details';
    if (path.includes('/courses')) return 'Courses';
    if (path.includes('/students')) return 'Students';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/create-course')) return 'Create Course';
    return 'Teacher Portal';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="dark" style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0 }}>
        <LogoContainer>
          <Link to="/teacher">
            <Title level={4} style={{ color: 'white', margin: 0 }}>Campus Hub</Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>Teacher Portal</Text>
          </Link>
        </LogoContainer>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      
      <Layout style={{ marginLeft: 250 }}>
        <PageHeader>
          <Title level={3} style={{ margin: 0 }}>
            {getCurrentPageTitle()}
          </Title>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
              <NotificationBadge count={unreadCount}>
                <BellOutlined style={{ fontSize: 20 }} />
              </NotificationBadge>
            </Dropdown>
            
            <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
              <Space>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />} 
                  size="large"
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ cursor: 'pointer' }}>{user?.firstName} {user?.lastName}</span>
              </Space>
            </Dropdown>
          </div>
        </PageHeader>
        
        <MainContent>
          <Outlet />
        </MainContent>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
