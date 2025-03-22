import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Avatar, Typography, Button, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined, BookOutlined, UserAddOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import io from 'socket.io-client';

const { Text, Title } = Typography;

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      fetchNotifications();
      
      // Connect to socket.io server
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: user.token
        }
      });
      
      setSocket(newSocket);
      
      // Listen for new notifications
      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'COURSE_ENROLLMENT':
        navigate('/my-courses');
        break;
      case 'FRIEND_REQUEST':
        navigate('/friends');
        break;
      case 'MESSAGE':
        navigate('/chat');
        break;
      default:
        break;
    }
    
    // Close dropdown after clicking
    setOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'COURSE_ENROLLMENT':
        return <BookOutlined style={{ color: '#52c41a' }} />;
      case 'FRIEND_REQUEST':
        return <UserAddOutlined style={{ color: '#1890ff' }} />;
      case 'MESSAGE':
        return <MessageOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const notificationMenu = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto', padding: '8px 0', backgroundColor: '#fff', boxShadow: '0 3px 6px rgba(0,0,0,0.2)' }}>
      <div style={{ padding: '0 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={5} style={{ margin: '8px 0' }}>Notifications</Title>
      </div>
      
      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No notifications yet" 
          style={{ margin: '20px 0' }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={notification => (
            <List.Item 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: notification.read ? 'transparent' : '#f0f8ff',
                cursor: 'pointer'
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={getNotificationIcon(notification.type)} />
                }
                title={notification.type.replace(/_/g, ' ')}
                description={
                  <div>
                    <Text style={{ fontSize: '13px' }}>{notification.content}</Text>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
              {!notification.read && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CheckOutlined />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                />
              )}
            </List.Item>
          )}
        />
      )}
      
      {notifications.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Button type="link" onClick={fetchNotifications}>
            Refresh
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown 
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => notificationMenu}
      trigger={['click']} 
      placement="bottomRight"
      arrow
    >
      <Badge count={unreadCount} overflowCount={99} onClick={() => setOpen(!open)}>
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: '20px' }} />} 
          style={{ background: 'transparent' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown; 