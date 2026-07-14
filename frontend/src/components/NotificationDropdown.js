import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Space, Avatar, Button, Empty, Spin } from 'antd';
import { BellOutlined, UserOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import styled from 'styled-components';
import axios from '../utils/axios';
import { useSocket } from '../contexts/SocketContext';

const { Text } = Typography;

const NotificationItem = styled(List.Item)`
  padding: 12px 16px;
  transition: background-color 0.3s;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.unread {
    background-color: #e6f7ff;
  }
`;

const TimeText = styled(Text)`
  font-size: 12px;
  color: #8c8c8c;
`;

const NotificationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.color || '#1890ff'};
  color: white;
  margin-right: 8px;
`;

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      console.log('Setting up notification listener');
      
      // Set up the notification listener
      socket.on('notification', (newNotification) => {
        console.log('New notification received:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
      });
      
      // Clean up the listener when the component unmounts
      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    axios.put(`/api/notifications/${notification.id}/read`)
      .catch(error => console.error('Failed to mark notification as read:', error));
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'friend_request':
      case 'friend_request_accepted':
        // For friend requests, navigate to the friends page
        navigate('/friends');
        break;
      case 'message':
        // For messages, navigate to chat with the sender
        if (notification.senderId) {
          navigate(`/chat/${notification.senderId}`);
        } else {
          navigate('/chat');
        }
        break;
      case 'post_like':
      case 'post_comment':
        // For post interactions, navigate to the specific post
        if (notification.entityId) {
          navigate(`/social-media?post=${notification.entityId}`);
        } else {
          navigate('/social-media');
        }
        break;
      case 'course_enroll':
        // For course enrollments, navigate to the specific course
        if (notification.entityId) {
          navigate(`/courses/${notification.entityId}`);
        } else {
          navigate('/courses');
        }
        break;
      default:
        navigate('/notifications');
        break;
    }
    setOpen(false);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setOpen(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_request_accepted':
        return <UserOutlined />;
      case 'message':
        return <MessageOutlined />;
      case 'post_like':
        return <LikeOutlined />;
      case 'post_comment':
        return <MessageOutlined />;
      case 'course_enroll':
        return <UserOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_request_accepted':
        return '#1890ff'; // Blue
      case 'message':
        return '#722ed1'; // Purple
      case 'post_like':
        return '#fa8c16'; // Orange
      case 'post_comment':
        return '#52c41a'; // Green
      case 'course_enroll':
        return '#eb2f96'; // Pink
      default:
        return '#1890ff'; // Default blue
    }
  };

  const getFormattedTime = (time) => {
    return moment(time).fromNow();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationMenu = (
    <div style={{ width: 360, maxHeight: 500, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Notifications</Text>
      </div>
      
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No notifications" 
          style={{ padding: '24px' }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={notification => (
            <NotificationItem 
              className={notification.read ? '' : 'unread'}
              onClick={() => handleNotificationClick(notification)}
            >
              <Space>
                {notification.user && notification.user.avatar ? (
                  <Avatar src={notification.user.avatar} />
                ) : (
                  <NotificationIcon color={getColorForType(notification.type)}>
                    {getIconForType(notification.type)}
                  </NotificationIcon>
                )}
                <div>
                  <div>{notification.content}</div>
                  <TimeText>{getFormattedTime(notification.createdAt)}</TimeText>
                </div>
              </Space>
            </NotificationItem>
          )}
        />
      )}
      
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link" onClick={handleViewAll}>
          View all notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      overlay={notificationMenu}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small">
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: '20px' }} />} 
          style={{ padding: '4px 8px' }} 
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown; 