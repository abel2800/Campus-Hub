import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Avatar, 
  Tabs, 
  List, 
  Button, 
  Upload, 
  message, 
  Form, 
  Input,
  Modal,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Statistic,
  Spin,
  Empty,
  Image,
  Badge,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  UploadOutlined,
  BookOutlined,
  MessageOutlined,
  PictureOutlined,
  SettingOutlined,
  CameraOutlined,
  TeamOutlined,
  UserAddOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axios';
import { checkSensitiveContent } from '../utils/contentModeration';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    posts: 0,
    courses: 0,
    friends: 0
  });
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [canViewPosts, setCanViewPosts] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    console.log('ProfilePage mounted - User:', user?.username, 'Role:', user?.role);
    
    setIsTeacher(user && user.role === 'teacher');
    
    if (!user) {
      navigate('/login');
    } else {
      const viewingUserId = userId ? String(userId) : String(user.id);
      const own = viewingUserId === String(user.id);
      setIsOwnProfile(own);
      
      if (!own) {
        loadOtherUserProfile(viewingUserId);
      } else {
        setProfileUser(user);
        setCanViewPosts(true);
        loadUserData(user.id);
        fetchUserStats(user.id);
      }
    }
  }, [userId, user]);

  const loadOtherUserProfile = async (targetId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${targetId}`);
      setProfileUser(response.data);
      setCanViewPosts(response.data.canViewPosts !== false);

      if (response.data.canViewPosts) {
        loadUserData(targetId, response.data);
      } else {
        setPosts([]);
        setCourses([]);
        setFriends([]);
        setStats({
          posts: 0,
          courses: 0,
          friends: response.data.friendsCount || 0,
        });
        setLoading(false);
      }
      fetchUserStats(targetId);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
      setLoading(false);
    }
  };

  const refreshOtherProfile = async () => {
    if (userId) await loadOtherUserProfile(userId);
  };

  const handleSendFriendRequest = async () => {
    try {
      setActionLoading(true);
      await api.post('/api/friends/request', { receiverId: Number(userId) });
      message.success('Friend request sent!');
      await refreshOtherProfile();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      setActionLoading(true);
      const requestId = profileUser?.requestId;
      if (!requestId) {
        message.error('No pending request found');
        return;
      }
      await api.post(`/api/friends/requests/${requestId}/accept`);
      message.success('Friend request accepted!');
      await refreshOtherProfile();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const loadUserData = async (targetUserId, profileData) => {
    const userId = targetUserId || user?.id;
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      try {
        const postsRes = await api.get(`/api/posts/user/${userId}`);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      } catch (err) {
        console.error('Error loading posts:', err);
        setPosts([]);
      }
      
      try {
        if (isOwnProfile || profileData?.canViewCourses !== false) {
          if (isOwnProfile && isTeacher) {
            const coursesRes = await api.get('/api/courses/teacher');
            setCourses(coursesRes.data || []);
          } else if (isOwnProfile) {
            const coursesRes = await api.get('/api/courses/user/enrolled');
            setCourses(coursesRes.data || []);
          } else {
            setCourses([]);
          }
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourses([]);
      }
      
      try {
        if (profileData?.friends) {
          setFriends(profileData.friends.map((f) => ({ friend: f, id: f.id })));
        } else if (isOwnProfile) {
          const friendsRes = await api.get('/api/friends/list');
          setFriends(friendsRes.data || []);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error('Error loading friends:', err);
        setFriends([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (targetUserId) => {
    const userId = targetUserId || user?.id;
    if (!userId) return;
    
    try {
      setStatsLoading(true);
      
      let postsCount = 0;
      let coursesCount = 0;
      let friendsCount = 0;
      
      // Fetch appropriate courses count based on role
      if (isOwnProfile) {
        try {
          if (isTeacher) {
            // For teachers, count courses they've created
            try {
              const coursesResponse = await api.get('/api/courses/teacher');
              const coursesData = coursesResponse.data || [];
              
              // Handle different data types but prioritize array length
              if (Array.isArray(coursesData)) {
                coursesCount = coursesData.length;
              } else if (typeof coursesData === 'object') {
                coursesCount = 0; // Default to 0 for object
              } else if (typeof coursesData === 'number') {
                coursesCount = coursesData;
              }
            } catch (err) {
              coursesCount = 0;
            }
          } else {
            // For students, count enrolled courses
            const coursesResponse = await api.get('/api/courses/user/enrolled');
            coursesCount = Array.isArray(coursesResponse.data) ? coursesResponse.data.length : 0;
          }
        } catch (err) {
          // Silent error handling
          coursesCount = 0;
        }
      }
      
      // Fetch friends count - use the correct endpoint
      try {
        const friendsResponse = await api.get('/api/friends/list');
        friendsCount = Array.isArray(friendsResponse.data) ? friendsResponse.data.length : 0;
      } catch (err) {
        // Silent error handling
        friendsCount = 0;
      }
      
      // Fetch posts count
      try {
        const postsResponse = await api.get(`/api/posts/user/${userId}`);
        postsCount = Array.isArray(postsResponse.data) ? postsResponse.data.length : 0;
      } catch (err) {
        // Silent error handling
        postsCount = 0;
      }
      
      setStats({
        courses: coursesCount,
        friends: friendsCount,
        posts: postsCount
      });
    } catch (error) {
      // Silent error handling
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRetry = () => {
    loadUserData(userId);
    fetchUserStats(userId);
  };

  const handleAvatarUpload = async ({ file }) => {
    if (!isOwnProfile) return false;
    
    try {
      setUploadLoading(true);
      
      // Check if file is an image type before uploading
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        // Silent failure
        setUploadLoading(false);
        return false;
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user in context with new avatar URL
      const avatarUrl = response.data.avatarUrl || response.data.avatar;
      updateUser({ ...user, avatar: avatarUrl });
      
      // Force a reload of the page to ensure the avatar is displayed correctly
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      // Silent failure
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  const showEditModal = () => {
    if (!isOwnProfile) return;
    
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      bio: user.bio,
      department: user.department,
      interests: user.interests
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    if (!isOwnProfile) return;
    
    try {
      const response = await api.put('/api/users/profile', values);
      updateUser(response.data);
      message.success('Profile updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const displayedUser = profileUser || user;

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=No+Image';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageUrl}`;
    }
    
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/courses/thumbnails/default-thumbnail.jpg`;
  };

  const getAvatarUrl = (imageUrl) => {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageUrl}`;
    }
    return undefined;
  };

  // Update the Statistic component to handle different data types
  const renderStatValue = (value) => {
    // Check for simple number values first
    if (typeof value === 'number') return value;
    
    // Handle null/undefined cases
    if (value === undefined || value === null) return 0;
    
    // Handle array cases (most common for courses)
    if (Array.isArray(value)) return value.length;
    
    // For non-array objects, just return 0 to avoid issues
    if (typeof value === 'object') return 0;
    
    // Default fallback
    return 0;
  };

  if (!displayedUser) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '20px' }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button 
              size="small" 
              type="primary" 
              onClick={handleRetry}
              icon={<ReloadOutlined />}
            >
              Retry
            </Button>
          }
        />
      )}
      
      <Card bordered={false}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar 
                size={120} 
                src={getAvatarUrl(displayedUser.avatar || displayedUser.avatarUrl)} 
                icon={<UserOutlined />} 
              />
              {isOwnProfile && (
                <Upload
                  name="avatar"
                  showUploadList={false}
                  customRequest={handleAvatarUpload}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('You can only upload image files!');
                    }
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      message.error('Image must be smaller than 2MB!');
                    }
                    return isImage && isLt2M;
                  }}
                >
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<CameraOutlined />} 
                    size="small"
                    loading={uploadLoading}
                    style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0,
                      backgroundColor: '#1890ff' 
                    }}
                  />
                </Upload>
              )}
        </div>

            <div style={{ marginTop: '16px' }}>
              <Space>
                {isOwnProfile ? (
                  <>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />} 
                      onClick={showEditModal}
                    >
                      Edit
                    </Button>
                    <Button 
                      icon={<SettingOutlined />}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </Button>
                  </>
                ) : (
                  <>
                    {(profileUser?.friendshipStatus === 'accepted' || profileUser?.isFriend) && (
                      <Button 
                        type="primary" 
                        icon={<MessageOutlined />} 
                        onClick={() => navigate(`/chat/${displayedUser.id}`)}
                      >
                        Message
                      </Button>
                    )}
                    {profileUser?.friendshipStatus === 'incoming' && (
                      <Button
                        type="primary"
                        loading={actionLoading}
                        icon={<UserAddOutlined />}
                        onClick={handleAcceptFriendRequest}
                      >
                        Accept Request
                      </Button>
                    )}
                    {profileUser?.friendshipStatus === 'pending' && (
                      <Button disabled>Request Sent</Button>
                    )}
                    {(profileUser?.friendshipStatus === 'none' || (!profileUser?.friendshipStatus && !profileUser?.isFriend)) && (
                      <Button 
                        icon={<UserAddOutlined />}
                        loading={actionLoading}
                        onClick={handleSendFriendRequest}
                      >
                        Add Friend
                      </Button>
                    )}
                    {(profileUser?.friendshipStatus === 'accepted' || profileUser?.isFriend) && (
                      <Button 
                        danger
                        icon={<UserOutlined />}
                        onClick={() => {
                          api.delete(`/api/friends/${displayedUser.id}`)
                            .then(() => {
                              message.success('Friend removed');
                              refreshOtherProfile();
                            })
                            .catch(() => message.error('Failed to remove friend'));
                        }}
                      >
                        Unfriend
                      </Button>
                    )}
                  </>
                )}
              </Space>
            </div>
          </Col>
          
          <Col xs={24} sm={16} md={18}>
            <Title level={2}>{displayedUser.username}</Title>
            <Text type="secondary">{displayedUser.email}</Text>
            
            <Paragraph style={{ marginTop: '16px' }}>
              {displayedUser.bio || 'No bio provided yet.'}
            </Paragraph>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic 
                    title="Posts" 
                    value={statsLoading ? <Spin size="small" /> : stats.posts} 
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
              
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic 
                    title={isTeacher ? "Courses Created" : "Courses Enrolled"} 
                    value={statsLoading ? <Spin size="small" /> : renderStatValue(stats.courses)} 
                    prefix={<BookOutlined />}
                  />
                </Card>
              </Col>
              
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic 
                    title="Friends" 
                    value={statsLoading ? <Spin size="small" /> : stats.friends} 
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      
      <Tabs 
        defaultActiveKey="posts" 
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginTop: '24px' }}
      >
          <TabPane 
          tab={
            <span>
              <MessageOutlined />
              Posts <Badge count={posts.length} style={{ backgroundColor: '#1890ff' }} />
            </span>
          } 
            key="posts"
          >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin />
            </div>
          ) : !canViewPosts ? (
            <Empty description="This account is private. Become friends to see their posts." />
          ) : posts.length === 0 ? (
            <Empty description="No posts yet" />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 4,
              }}
            >
              {posts.map((post) => {
                const src = getImageUrl(post.imageUrl || post.mediaUrl || post.image);
                const hasMedia = !!(post.imageUrl || post.mediaUrl || post.image);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      aspectRatio: '1 / 1',
                      background: '#111',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {hasMedia ? (
                      <img
                        src={src}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg,#e6f4ff,#f0f5ff)',
                          color: '#1677ff',
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      >
                        {(post.caption || post.content || 'Post').slice(0, 80)}
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                        color: '#fff',
                        fontSize: 12,
                        textShadow: '0 1px 2px rgba(0,0,0,.6)',
                      }}
                    >
                      ♥ {post.likesCount || 0} · 💬 {post.commentsCount || post.comments?.length || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Modal
            open={!!selectedPost}
            onCancel={() => {
              setSelectedPost(null);
              setCommentText('');
            }}
            footer={null}
            width={720}
            title={displayedUser?.username}
          >
            {selectedPost && (
              <div>
                {(selectedPost.imageUrl || selectedPost.mediaUrl || selectedPost.image) && (
                  <Image
                    src={getImageUrl(selectedPost.imageUrl || selectedPost.mediaUrl || selectedPost.image)}
                    style={{ width: '100%', maxHeight: 420, objectFit: 'contain', marginBottom: 12 }}
                  />
                )}
                <Paragraph>{selectedPost.caption || selectedPost.content || ''}</Paragraph>
                <Text type="secondary">{new Date(selectedPost.createdAt).toLocaleString()}</Text>
                <Space style={{ marginTop: 12, width: '100%' }}>
                  <Button
                    type={selectedPost.isLiked ? 'primary' : 'default'}
                    onClick={async () => {
                      try {
                        await api.post(`/api/posts/${selectedPost.id}/like`);
                        const res = await api.get(`/api/posts/user/${displayedUser.id}`);
                        const next = Array.isArray(res.data) ? res.data : [];
                        setPosts(next);
                        setSelectedPost(next.find((p) => p.id === selectedPost.id) || selectedPost);
                      } catch {
                        message.error('Could not like post');
                      }
                    }}
                  >
                    {selectedPost.isLiked ? 'Liked' : 'Like'} ({selectedPost.likesCount || 0})
                  </Button>
                </Space>
                <Divider />
                <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 12 }}>
                  {(selectedPost.comments || []).length === 0 ? (
                    <Text type="secondary">No comments yet</Text>
                  ) : (
                    (selectedPost.comments || []).map((c) => (
                      <div key={c.id} style={{ marginBottom: 8 }}>
                        <Text strong>{c.user?.username || 'user'} </Text>
                        <Text>{c.content}</Text>
                      </div>
                    ))
                  )}
                </div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onPressEnter={async () => {
                      if (!commentText.trim()) return;
                      const check = checkSensitiveContent(commentText);
                      if (check.blocked) {
                        message.error(check.message);
                        return;
                      }
                      try {
                        await api.post(`/api/posts/${selectedPost.id}/comment`, {
                          content: commentText.trim(),
                        });
                        setCommentText('');
                        const res = await api.get(`/api/posts/user/${displayedUser.id}`);
                        const next = Array.isArray(res.data) ? res.data : [];
                        setPosts(next);
                        setSelectedPost(next.find((p) => p.id === selectedPost.id) || selectedPost);
                      } catch (err) {
                        message.error(err.response?.data?.message || 'Could not comment');
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    onClick={async () => {
                      if (!commentText.trim()) return;
                      const check = checkSensitiveContent(commentText);
                      if (check.blocked) {
                        message.error(check.message);
                        return;
                      }
                      try {
                        await api.post(`/api/posts/${selectedPost.id}/comment`, {
                          content: commentText.trim(),
                        });
                        setCommentText('');
                        const res = await api.get(`/api/posts/user/${displayedUser.id}`);
                        const next = Array.isArray(res.data) ? res.data : [];
                        setPosts(next);
                        setSelectedPost(next.find((p) => p.id === selectedPost.id) || selectedPost);
                      } catch (err) {
                        message.error(err.response?.data?.message || 'Could not comment');
                      }
                    }}
                  >
                    Post
                  </Button>
                </Space.Compact>
              </div>
            )}
          </Modal>
          </TabPane>
          
          {/* Course tab for all users */}
          <TabPane 
            tab={
              <span>
                <BookOutlined />
                {isTeacher ? 'Courses Created' : 'My Courses'} <Badge count={courses.length} style={{ backgroundColor: '#1890ff' }} />
              </span>
            } 
            key="courses"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin />
              </div>
            ) : courses.length === 0 ? (
              <Empty 
                description={isOwnProfile ? 
                  (isTeacher ? "You haven't created any courses yet" : "You're not enrolled in any courses") : 
                  "No courses to display"}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {isOwnProfile && (
                  <Button 
                    type="primary" 
                    onClick={() => navigate(isTeacher ? '/teacher/create-course' : '/courses')}
                    style={{ marginTop: '16px' }}
                  >
                    {isTeacher ? 'Create New Course' : 'Browse Courses'}
                  </Button>
                )}
              </Empty>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                dataSource={courses}
                renderItem={course => (
                  <List.Item>
                    <Card
                      hoverable
                      cover={
                        <img
                          alt={course.title}
                          src={getImageUrl(course.imageUrl)}
                          style={{ height: 160, objectFit: 'cover' }}
                        />
                      }
                      onClick={() => navigate(isTeacher ? `/teacher/courses/${course.id}` : `/courses/${course.id}`)}
                    >
                      <Card.Meta 
                        title={course.title}
                        description={course.description ? (course.description.length > 60 ? course.description.substring(0, 60) + '...' : course.description) : 'No description'}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                Friends <Badge count={friends.length} style={{ backgroundColor: '#1890ff' }} />
              </span>
            } 
            key="friends"
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin />
              </div>
            ) : friends.length === 0 ? (
              <Empty 
                description="No friends added yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  onClick={() => navigate('/friends')}
                  style={{ marginTop: '16px' }}
                >
                  Find Friends
                </Button>
              </Empty>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
                dataSource={friends}
                renderItem={friendship => {
                  const friend = friendship.friend;
                  return (
                    <List.Item>
                      <Card size="small" hoverable>
                        <Card.Meta
                          avatar={
                            <Avatar 
                              src={friend.avatar || friend.avatarUrl} 
                              icon={<UserOutlined />} 
                              size={64}
                            />
                          }
                          title={friend.username}
                          description={friend.department || 'No department'}
                        />
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                          <Link to={`/profile/${friend.id}`}>
                            <Button size="small" type="link">View Profile</Button>
                          </Link>
                          <Button 
                            size="small" 
                            icon={<MessageOutlined />}
                            onClick={() => navigate(`/chat/${friend.id}`)}
                          >
                            Chat
                          </Button>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            )}
          </TabPane>
        </Tabs>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Email" disabled />
          </Form.Item>
          
          <Form.Item
            name="bio"
            label="Bio"
          >
            <TextArea 
              placeholder="Tell us about yourself" 
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
          
          <Form.Item
            name="department"
            label="Department"
          >
            <Input placeholder="Your department or major" />
          </Form.Item>
          
          <Form.Item
            name="interests"
            label="Interests"
          >
            <TextArea 
              placeholder="What are you interested in?" 
              autoSize={{ minRows: 2, maxRows: 3 }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              Save
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
