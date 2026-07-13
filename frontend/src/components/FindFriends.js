import React, { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Card, Spin, Empty } from 'antd';
import { UserAddOutlined, UserOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { Link } from 'react-router-dom';

const { Search } = Input;

const FindFriends = ({ onRequestSent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/friends/search/users?query=${query}`);
      console.log('Search results:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error searching users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = debounce(searchUsers, 300);

  useEffect(() => {
    if (searchQuery.length > 0) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  const handleSendRequest = async (userId) => {
    try {
      await axios.post('/api/friends/request', { receiverId: userId });
      toast.success('Friend request sent!');
      setSearchResults(prevResults =>
        prevResults.map(user =>
          user.id === userId ? { ...user, friendshipStatus: 'pending' } : user
        )
      );
      if (onRequestSent) onRequestSent();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  return (
    <div className="find-friends-container">
      <Search
        placeholder="Search users by username..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', marginBottom: '20px' }}
        loading={isSearching}
      />

      {isSearching ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : (
        <List
          dataSource={searchResults}
          locale={{
            emptyText: searchQuery 
              ? 'No users found' 
              : 'Type a name to search for users'
          }}
          renderItem={(user) => (
            <List.Item>
              <Card style={{ width: '100%', marginBottom: '8px' }}>
                <List.Item.Meta
                  avatar={
                    <Link to={`/profile/${user.id}`}>
                      <Avatar 
                        size={40} 
                        src={user.avatarUrl || user.avatar}
                        icon={!user.avatarUrl && !user.avatar && <UserOutlined />}
                      >
                        {!user.avatarUrl && !user.avatar && user.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </Link>
                  }
                  title={
                    <Link to={`/profile/${user.id}`}>
                      {user.username}
                    </Link>
                  }
                  description={user.department}
                />
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    if (user.friendshipStatus === 'incoming' && user.requestId) {
                      axios.post(`/api/friends/requests/${user.requestId}/accept`)
                        .then(() => {
                          toast.success('Friend request accepted!');
                          setSearchResults(prevResults =>
                            prevResults.map(u =>
                              u.id === user.id ? { ...u, friendshipStatus: 'accepted' } : u
                            )
                          );
                          if (onRequestSent) onRequestSent();
                        })
                        .catch(() => toast.error('Failed to accept request'));
                      return;
                    }
                    handleSendRequest(user.id);
                  }}
                  disabled={user.friendshipStatus === 'pending' || user.friendshipStatus === 'accepted'}
                >
                  {user.friendshipStatus === 'pending' 
                    ? 'Request Sent'
                    : user.friendshipStatus === 'accepted'
                    ? 'Friends'
                    : user.friendshipStatus === 'incoming'
                    ? 'Accept Request'
                    : 'Add Friend'
                  }
                </Button>
              </Card>
            </List.Item>
          )}
          empty={
            <Empty 
              description={searchQuery ? "No users found" : "Type a name to search for users"}
            />
          }
        />
      )}
    </div>
  );
};

export default FindFriends;