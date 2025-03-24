import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Typography, 
  Button, 
  Space, 
  Avatar, 
  Empty, 
  Spin, 
  message, 
  PageHeader,
  Tabs,
  Divider
} from 'antd';
import { BellOutlined, UserOutlined, LikeOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import axios from '../utils/axios';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationItem = styled(List.Item)`
  padding: 16px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &.unread {
    background-color: #e6f7ff;
  }
`;

const NotificationIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.color || '#1890ff'};
  color: white;
  margin-right: 12px;
`;

const StyledCard = styled(Card)`
  margin: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read
    axios.put(`/api/notifications/${notification.id}/read`)
      .catch(error => console.error('Failed to mark notification as read:', error));
    
    // Update local state to mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'friend_request':
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
        // Do nothing, already on notifications page
        break;
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      message.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      message.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      message.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete('/api/notifications');
      setNotifications([]);
      message.success('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      message.error('Failed to clear notifications');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'friend_request':
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
    return moment(time).format('MMM D, YYYY h:mm A');
  };

  const createTestNotification = async (type) => {
    try {
      await axios.post('/api/notifications/test', { type });
      message.success(`Test ${type} notification created`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to create test notification:', error);
      message.error('Failed to create test notification');
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread' 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === activeTab);

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={2} style={{ margin: '24px 0' }}>
        <BellOutlined style={{ marginRight: 12 }} />
        Notifications
      </Title>

      <StyledCard>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Space>
              {notifications.length > 0 && (
                <>
                  <Button onClick={handleMarkAllAsRead}>
                    Mark all as read
                  </Button>
                  <Button onClick={handleClearAll} danger>
                    Clear all
                  </Button>
                </>
              )}
            </Space>
          }
        >
          <TabPane tab="All" key="all" />
          <TabPane tab="Unread" key="unread" />
          <TabPane tab="Friend Requests" key="friend_request" />
          <TabPane tab="Messages" key="message" />
          <TabPane tab="Posts" key="post_like" />
        </Tabs>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty description="No notifications" style={{ padding: '40px 0' }} />
        ) : (
          <List
            dataSource={filteredNotifications}
            renderItem={notification => (
              <NotificationItem 
                className={notification.read ? '' : 'unread'}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    notification.sender && notification.sender.avatar ? (
                      <Avatar src={notification.sender.avatar} size="large" />
                    ) : (
                      <NotificationIcon color={getColorForType(notification.type)}>
                        {getIconForType(notification.type)}
                      </NotificationIcon>
                    )
                  }
                  title={
                    <div>
                      <Text strong={!notification.read}>{notification.content}</Text>
                    </div>
                  }
                  description={
                    <Text type="secondary">{getFormattedTime(notification.createdAt)}</Text>
                  }
                />
              </NotificationItem>
            )}
          />
        )}
        
        <Divider />
        
        <div>
          <Title level={4}>Test Notifications</Title>
          <Text type="secondary">Create test notifications for development purposes</Text>
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Button onClick={() => createTestNotification('friend_request')}>
                Friend Request
              </Button>
              <Button onClick={() => createTestNotification('message')}>
                Message
              </Button>
              <Button onClick={() => createTestNotification('post_like')}>
                Post Like
              </Button>
              <Button onClick={() => createTestNotification('post_comment')}>
                Post Comment
              </Button>
              <Button onClick={() => createTestNotification('course_enroll')}>
                Course Enrollment
              </Button>
            </Space>
          </div>
        </div>
      </StyledCard>
    </div>
  );
};

export default NotificationsPage; 