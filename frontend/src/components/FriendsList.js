import React from 'react';
import { List, Avatar, Button, Card, Typography, Spin, Empty, Space, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined, MessageOutlined, ProfileOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

const { Text } = Typography;

const FriendsList = ({ friends, onFriendRemoved, loading }) => {
  const navigate = useNavigate();

  const handleRemoveFriend = async (friendId) => {
    try {
      await axios.delete(`/api/friends/${friendId}`);
      toast.success('Friend removed successfully');
      if (onFriendRemoved) onFriendRemoved();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleMessage = (userId) => {
    navigate(`/chat/${userId}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
  }

  if (!friends || friends.length === 0) {
    return (
      <Empty 
        description="No friends yet" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      dataSource={friends}
      renderItem={(friendship) => {
        const friend = friendship.friend;
        return (
          <List.Item>
            <Card style={{ width: '100%' }}>
              <List.Item.Meta
                avatar={
                  <Link to={`/profile/${friend.id}`}>
                    <Avatar 
                      size={50}
                      src={friend.avatarUrl || friend.avatar} 
                      icon={!friend.avatarUrl && !friend.avatar && <UserOutlined />}
                    >
                      {!friend.avatarUrl && !friend.avatar && friend.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </Link>
                }
                title={
                  <Link to={`/profile/${friend.id}`}>
                    <Text strong style={{ fontSize: '16px' }}>{friend.username}</Text>
                  </Link>
                }
                description={friend.department}
              />
              <Space>
                <Button
                  type="primary"
                  icon={<ProfileOutlined />}
                  onClick={() => handleViewProfile(friend.id)}
                >
                  Profile
                </Button>
                <Button
                  type="default"
                  icon={<MessageOutlined />}
                  onClick={() => handleMessage(friend.id)}
                >
                  Message
                </Button>
                <Popconfirm
                  title="Remove friend"
                  description="Are you sure you want to remove this friend?"
                  onConfirm={() => handleRemoveFriend(friend.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                  >
                    Remove
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          </List.Item>
        );
      }}
    />
  );
};

export default FriendsList;