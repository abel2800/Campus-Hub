import React, { useState, useEffect } from 'react';
import { Tabs, Badge, Typography, Card, Spin, message } from 'antd';
import { UserAddOutlined, BellOutlined, TeamOutlined } from '@ant-design/icons';
import FindFriends from './FindFriends';
import FriendRequests from './FriendRequests';
import FriendsList from './FriendsList';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const { TabPane } = Tabs;

const Friends = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load friend data');
      toast.error('Failed to load friend data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/friends/list');
      console.log('Friends data:', response.data);
      setFriends(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      return [];
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('/api/friends/requests/pending');
      console.log('Pending requests:', response.data);
      setPendingRequests(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
      return [];
    }
  };

  const handleRequestSent = () => {
    fetchPendingRequests();
  };

  const handleRequestAccepted = async () => {
    await fetchPendingRequests();
    await fetchFriends();
    message.success('Friend request processed successfully');
  };

  const handleFriendRemoved = async () => {
    await fetchFriends();
    message.success('Friend removed successfully');
  };

  const items = [
    {
      key: '1',
      label: (
        <span>
          <TeamOutlined />
          Friends
        </span>
      ),
      children: <FriendsList 
        friends={friends} 
        onFriendRemoved={handleFriendRemoved} 
        loading={loading && activeTab === '1'} 
      />
    },
    {
      key: '2',
      label: (
        <span>
          <BellOutlined />
          Pending Requests
          {pendingRequests.length > 0 && (
            <Badge count={pendingRequests.length} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: <FriendRequests 
        requests={pendingRequests} 
        onRequestAccepted={handleRequestAccepted} 
        loading={loading && activeTab === '2'} 
      />
    },
    {
      key: '3',
      label: (
        <span>
          <UserAddOutlined />
          Find Friends
        </span>
      ),
      children: <FindFriends onRequestSent={handleRequestSent} />
    }
  ];

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  if (loading && activeTab === '1') {
    return (
      <Card style={{ margin: '24px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>Loading friends...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ margin: '24px' }}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Friends
      </Typography.Title>
      
      <Tabs 
        items={items} 
        activeKey={activeTab} 
        onChange={handleTabChange}
      />
    </Card>
  );
};

export default Friends;