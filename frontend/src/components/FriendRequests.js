import React from 'react';
import { List, Avatar, Button, Card, Typography, Space, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const { Text } = Typography;

const FriendRequests = ({ requests, onRequestAccepted, loading }) => {
  const handleAccept = async (requestId) => {
    try {
      await axios.post(`/api/friends/requests/${requestId}/accept`);
      toast.success('Friend request accepted!');
      if (onRequestAccepted) onRequestAccepted();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.post(`/api/friends/requests/${requestId}/reject`);
      toast.success('Friend request rejected');
      if (onRequestAccepted) onRequestAccepted();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
  }

  if (!requests || requests.length === 0) {
    return <Text type="secondary">No pending friend requests</Text>;
  }

  return (
    <List
      dataSource={requests}
      renderItem={(request) => (
        <List.Item key={request.id}>
          <Card style={{ width: '100%' }}>
            <List.Item.Meta
              avatar={
                <Link to={`/profile/${request.sender.id}`}>
                  <Avatar 
                    src={request.sender.avatarUrl || request.sender.avatar}
                    icon={!request.sender.avatarUrl && !request.sender.avatar && <UserOutlined />}
                  >
                    {!request.sender.avatarUrl && !request.sender.avatar && request.sender.username[0]?.toUpperCase()}
                  </Avatar>
                </Link>
              }
              title={
                <Link to={`/profile/${request.sender.id}`}>
                  {request.sender.username}
                </Link>
              }
              description={`Sent ${new Date(request.createdAt).toLocaleDateString()}`}
            />
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleAccept(request.id)}
              >
                Accept
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(request.id)}
              >
                Reject
              </Button>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default FriendRequests;