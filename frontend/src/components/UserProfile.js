import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Tabs, 
  Button, 
  Row,
  Col,
  Divider, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  message,
  Spin,
  Empty,
  List,
  Space,
  Popconfirm
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  PlusOutlined, 
  SettingOutlined,
  LogoutOutlined,
  CameraOutlined,
  UploadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import PostCard from './PostCard';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  position: relative;
  background: linear-gradient(to bottom, #1890ff20, #ffffff);
  padding: 30px 16px;
  border-radius: 10px;
`;

const ProfileCover = styled.div`
  height: 180px;
  background-image: url(${props => props.coverImage});
  background-size: cover;
  background-position: center;
  border-radius: 10px 10px 0 0;
  position: relative;
  margin-bottom: 80px;
`;

const ProfileAvatar = styled(Avatar)`
  width: 120px;
  height: 120px;
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid white;
  background-color: #f5f5f5;
`;

const ProfileInfo = styled.div`
  margin-top: 60px;
`;

const ProfileStats = styled.div`
  display: flex;
  justify-content: center;
  margin: 24px 0;
`;

const StatItem = styled.div`
  padding: 0 24px;
  text-align: center;
  cursor: pointer;
  &:not(:last-child) {
    border-right: 1px solid #f0f0f0;
  }
`;

const ActionButton = styled(Button)`
  margin: 0 8px;
`;

const UserGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 8px;
  margin-top: 16px;
`;

const GalleryItem = styled.div`
  position: relative;
  padding-top: 100%;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    .overlay {
      opacity: 1;
    }
  }
`;

const GalleryImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GalleryOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
`;

const AvatarUploadWrapper = styled.div`
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
`;

const CoverEditButton = styled(Button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.8);
`;

const FollowListItem = styled(List.Item)`
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [form] = Form.useForm();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [profileMediaModal, setProfileMediaModal] = useState({
    visible: false,
    type: null,
    url: null
  });

  useEffect(() => {
    fetchUserProfile();
  }, [username, currentUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/profile/${username}`);
      setUser(response.data);
      
      // Check if this is the current user's profile
      if (currentUser && currentUser.username === username) {
        setIsOwnProfile(true);
      } else {
        setIsOwnProfile(false);
        // Check if current user is following this profile
        if (currentUser) {
          const followingResponse = await api.get('/api/follows/check', {
            params: { targetId: response.data.id }
          });
          setIsFollowing(followingResponse.data.isFollowing);
        }
      }
      
      // Fetch user posts
      const postsResponse = await api.get(`/api/posts/user/${response.data.id}`);
      setPosts(postsResponse.data);
      
      // Fetch saved posts if own profile
      if (currentUser && currentUser.username === username) {
        const savedPostsResponse = await api.get('/api/posts/saved');
        setSavedPosts(savedPostsResponse.data);
      }
      
      // Fetch followers and following
      const followersResponse = await api.get(`/api/follows/followers/${response.data.id}`);
      setFollowers(followersResponse.data);
      
      const followingResponse = await api.get(`/api/follows/following/${response.data.id}`);
      setFollowing(followingResponse.data);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      message.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    
    if (path.startsWith('http')) {
      return path;
    }
    
    return process.env.REACT_APP_API_URL + path;
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/api/follows/${user.id}`);
        message.success(`Unfollowed ${user.username}`);
      } else {
        await api.post('/api/follows/create', { targetId: user.id });
        message.success(`Now following ${user.username}`);
      }
      
      setIsFollowing(!isFollowing);
      // Update followers count
      fetchUserProfile();
    } catch (error) {
      console.error('Error following user:', error);
      message.error('Failed to update follow status');
    }
  };

  const showEditModal = () => {
    form.setFieldsValue({
      fullName: user.fullName,
      bio: user.bio,
      location: user.location,
      website: user.website,
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      await api.put('/api/users/update', values);
      message.success('Profile updated successfully');
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        const formData = new FormData();
        formData.append('avatar', info.file.originFileObj);
        
        await api.post('/api/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        message.success('Avatar updated successfully');
        fetchUserProfile();
      } catch (error) {
        console.error('Error updating avatar:', error);
        message.error('Failed to update avatar');
      }
    }
  };

  const handleCoverChange = async (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        const formData = new FormData();
        formData.append('coverPhoto', info.file.originFileObj);
        
        await api.post('/api/users/cover', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        message.success('Cover photo updated successfully');
        fetchUserProfile();
      } catch (error) {
        console.error('Error updating cover photo:', error);
        message.error('Failed to update cover photo');
      }
    }
  };

  const navigateToUserProfile = (username) => {
    if (username === currentUser?.username) {
      // Navigate to own profile
      navigate(`/profile`);
    } else {
      // Navigate to other user's profile
      navigate(`/profile/${username}`);
    }
    
    // Close any open modals
    setShowFollowers(false);
    setShowFollowing(false);
  };

  const showMediaModal = (type, url) => {
    setProfileMediaModal({
      visible: true,
      type,
      url
    });
  };

  const handlePostDelete = async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      message.success('Post deleted successfully');
      
      // Update posts list
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <Empty
        description="User not found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Empty>
    );
  }

  return (
    <div className="profile-container">
      <Card bordered={false}>
        <ProfileCover coverImage={getImageUrl(user.coverPhoto) || '/images/default-cover.jpg'}>
          {isOwnProfile && (
            <CoverEditButton
              icon={<CameraOutlined />}
              shape="circle"
              onClick={() => document.getElementById('coverUpload').click()}
            />
          )}
          
          <Upload
            id="coverUpload"
            style={{ display: 'none' }}
            name="coverPhoto"
            showUploadList={false}
            action={`${process.env.REACT_APP_API_URL}/api/users/cover`}
            headers={{
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }}
            onChange={handleCoverChange}
          >
            <div />
          </Upload>
          
          {isOwnProfile ? (
            <AvatarUploadWrapper>
              <Upload
                name="avatar"
                showUploadList={false}
                action={`${process.env.REACT_APP_API_URL}/api/users/avatar`}
                headers={{
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }}
                onChange={handleAvatarChange}
              >
                <ProfileAvatar 
                  src={getImageUrl(user.avatar)} 
                  icon={<UserOutlined />} 
                  onClick={() => showMediaModal('image', getImageUrl(user.avatar))}
                >
                  <div className="upload-overlay" style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    cursor: 'pointer'
                  }}>
                    <CameraOutlined style={{ fontSize: 24, color: 'white' }} />
                  </div>
                </ProfileAvatar>
              </Upload>
            </AvatarUploadWrapper>
          ) : (
            <ProfileAvatar 
              src={getImageUrl(user.avatar)} 
              icon={<UserOutlined />} 
              onClick={() => showMediaModal('image', getImageUrl(user.avatar))}
            />
          )}
        </ProfileCover>
        
        <ProfileInfo>
          <Title level={3}>{user.fullName || user.username}</Title>
          <Text type="secondary">@{user.username}</Text>
          
          {user.bio && (
            <div style={{ margin: '16px 0' }}>
              <Text>{user.bio}</Text>
            </div>
          )}
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {user.location && (
              <Col span={12}>
                <Text type="secondary">Location: </Text>
                <Text>{user.location}</Text>
              </Col>
            )}
            
            {user.website && (
              <Col span={12}>
                <Text type="secondary">Website: </Text>
                <a href={user.website.startsWith('http') ? user.website : `http://${user.website}`} target="_blank" rel="noopener noreferrer">
                  {user.website}
                </a>
              </Col>
            )}
            </Row>
          
          <ProfileStats>
            <StatItem onClick={() => setShowFollowers(true)}>
              <Title level={4}>{followers?.length || 0}</Title>
              <Text type="secondary">Followers</Text>
            </StatItem>
            
            <StatItem onClick={() => setShowFollowing(true)}>
              <Title level={4}>{following?.length || 0}</Title>
              <Text type="secondary">Following</Text>
            </StatItem>
            
            <StatItem>
              <Title level={4}>{posts?.length || 0}</Title>
              <Text type="secondary">Posts</Text>
            </StatItem>
          </ProfileStats>
          
          <div style={{ margin: '24px 0' }}>
            {isOwnProfile ? (
              <Space>
                <ActionButton 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={showEditModal}
                >
                  Edit Profile
                </ActionButton>
                <ActionButton 
                  icon={<SettingOutlined />} 
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </ActionButton>
                <ActionButton 
                  icon={<LogoutOutlined />} 
                  danger
                  onClick={handleLogout}
                >
                  Logout
                </ActionButton>
              </Space>
            ) : (
              <Space>
                <ActionButton 
                  type={isFollowing ? "default" : "primary"}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </ActionButton>
                <ActionButton onClick={() => navigate(`/chat/${user.id}`)}>
                  Message
                </ActionButton>
              </Space>
            )}
          </div>
        </ProfileInfo>

        <Divider />
        
        <Tabs defaultActiveKey="posts">
          <TabPane tab="Posts" key="posts">
            {posts.length > 0 ? (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={currentUser}
                    onDelete={handlePostDelete}
                    allowDelete={isOwnProfile}
                  />
                ))}
              </div>
            ) : (
              <Empty description="No posts yet" />
            )}
          </TabPane>
          
          <TabPane tab="Photos" key="photos">
            <UserGallery>
              {posts
                .filter(post => post.mediaUrl && (post.mediaType === 'image' || post.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)))
                .map(post => (
                  <GalleryItem key={post.id} onClick={() => navigate(`/post/${post.id}`)}>
                    <GalleryImage src={getImageUrl(post.mediaUrl)} alt="" />
                    <GalleryOverlay className="overlay">
                      <div>View</div>
                    </GalleryOverlay>
                  </GalleryItem>
                ))}
            </UserGallery>
            {posts.filter(post => post.mediaUrl && post.mediaType === 'image').length === 0 && (
              <Empty description="No photos yet" />
            )}
          </TabPane>
          
          <TabPane tab="Videos" key="videos">
            <UserGallery>
              {posts
                .filter(post => post.mediaUrl && (post.mediaType === 'video' || post.mediaUrl.match(/\.(mp4|webm|ogg)$/i)))
                .map(post => (
                  <GalleryItem key={post.id} onClick={() => navigate(`/post/${post.id}`)}>
                    <GalleryImage 
                      src={post.thumbnailUrl || '/images/video-placeholder.jpg'} 
                      alt="" 
                    />
                    <GalleryOverlay className="overlay">
                      <div>Play Video</div>
                    </GalleryOverlay>
                  </GalleryItem>
                ))}
            </UserGallery>
            {posts.filter(post => post.mediaUrl && post.mediaType === 'video').length === 0 && (
              <Empty description="No videos yet" />
            )}
        </TabPane>
          
          {isOwnProfile && (
            <TabPane tab="Saved" key="saved">
              {savedPosts.length > 0 ? (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  {savedPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <Empty description="No saved posts" />
              )}
        </TabPane>
          )}
      </Tabs>
      </Card>
      
      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
          >
            <Input placeholder="Your full name" />
          </Form.Item>
          
          <Form.Item
            name="bio"
            label="Bio"
          >
            <Input.TextArea rows={4} placeholder="Tell people about yourself" />
          </Form.Item>
          
          <Form.Item
            name="location"
            label="Location"
          >
            <Input placeholder="Your location" />
          </Form.Item>
          
          <Form.Item
            name="website"
            label="Website"
          >
            <Input placeholder="Your website" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Followers Modal */}
      <Modal
        title="Followers"
        open={showFollowers}
        onCancel={() => setShowFollowers(false)}
        footer={null}
      >
        <List
          dataSource={followers}
          renderItem={follower => (
            <FollowListItem onClick={() => navigateToUserProfile(follower.username)}>
              <List.Item.Meta
                avatar={<Avatar src={getImageUrl(follower.avatar)} icon={<UserOutlined />} />}
                title={follower.fullName || follower.username}
                description={`@${follower.username}`}
              />
              {currentUser && follower.id !== currentUser.id && (
                <Button size="small" onClick={(e) => {
                  e.stopPropagation();
                  // Implement follow/unfollow
                }}>
                  Follow
                </Button>
              )}
            </FollowListItem>
          )}
          locale={{ emptyText: "No followers yet" }}
        />
      </Modal>
      
      {/* Following Modal */}
      <Modal
        title="Following"
        open={showFollowing}
        onCancel={() => setShowFollowing(false)}
        footer={null}
      >
        <List
          dataSource={following}
          renderItem={follow => (
            <FollowListItem onClick={() => navigateToUserProfile(follow.username)}>
              <List.Item.Meta
                avatar={<Avatar src={getImageUrl(follow.avatar)} icon={<UserOutlined />} />}
                title={follow.fullName || follow.username}
                description={`@${follow.username}`}
              />
              {currentUser && follow.id !== currentUser.id && (
                <Button size="small" onClick={(e) => {
                  e.stopPropagation();
                  // Implement follow/unfollow
                }}>
                  Unfollow
                </Button>
              )}
            </FollowListItem>
          )}
          locale={{ emptyText: "Not following anyone yet" }}
        />
      </Modal>
      
      {/* Media Preview Modal */}
      <Modal
        open={profileMediaModal.visible}
        footer={null}
        onCancel={() => setProfileMediaModal({ visible: false, type: null, url: null })}
        width={800}
        centered
      >
        {profileMediaModal.type === 'image' && (
          <img 
            src={profileMediaModal.url} 
            alt="Media preview"
            style={{ width: '100%', height: 'auto' }}
          />
        )}
        {profileMediaModal.type === 'video' && (
          <video 
            src={profileMediaModal.url} 
            controls
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserProfile; 