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

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Check if viewing own profile or someone else's
      const viewingUserId = userId || user.id;
      setIsOwnProfile(viewingUserId === user.id.toString() || !userId);
      
      if (viewingUserId !== user.id.toString() && userId) {
        // Load other user's profile
        loadOtherUserProfile(viewingUserId);
      } else {
        // Load own profile
        setProfileUser(user);
    loadUserData();
        fetchUserStats();
      }
    }
  }, [user, navigate, userId]);

  const loadOtherUserProfile = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${userId}`);
      setProfileUser(response.data);
      
      // Load other user's data
      loadUserData(userId);
      fetchUserStats(userId);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (targetUserId) => {
    const userId = targetUserId || user?.id;
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use try/catch for each request to handle individual failures
      try {
        const postsRes = await api.get(`/api/posts/user/${userId}`);
        setPosts(postsRes.data || []);
      } catch (err) {
        console.error('Error loading posts:', err);
        setPosts([]);
      }
      
      try {
        // If viewing own profile, get enrolled courses
        if (isOwnProfile) {
          const coursesRes = await api.get('/api/courses/user/enrolled');
          setCourses(coursesRes.data || []);
        } else {
          // For other users, this might be different or not available
          setCourses([]);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourses([]);
      }
      
      try {
        // Use the correct endpoint for friends
        const friendsRes = await api.get('/api/friends/list');
        setFriends(friendsRes.data || []);
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
      
      // Fetch enrolled courses count
      if (isOwnProfile) {
        try {
          const coursesResponse = await api.get('/api/courses/user/enrolled');
          coursesCount = Array.isArray(coursesResponse.data) ? coursesResponse.data.length : 0;
        } catch (err) {
          console.error('Error fetching courses count:', err);
        }
      }
      
      // Fetch friends count - use the correct endpoint
      try {
        const friendsResponse = await api.get('/api/friends/list');
        friendsCount = Array.isArray(friendsResponse.data) ? friendsResponse.data.length : 0;
      } catch (err) {
        console.error('Error fetching friends count:', err);
      }
      
      // Fetch posts count
      try {
        const postsResponse = await api.get(`/api/posts/user/${userId}`);
        postsCount = Array.isArray(postsResponse.data) ? postsResponse.data.length : 0;
      } catch (err) {
        console.error('Error fetching posts count:', err);
      }
      
      setStats({
        courses: coursesCount,
        friends: friendsCount,
        posts: postsCount
      });
      
      console.log('User stats:', { courses: coursesCount, friends: friendsCount, posts: postsCount });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Don't show an error message for stats, just log it
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
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      });
      
      // Update user in context with new avatar URL
      const avatarUrl = response.data.avatarUrl;
      updateUser({ ...user, avatar: avatarUrl });
      
      message.success('Avatar updated successfully');
      return true;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Failed to upload avatar');
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
      const response = await api.put('/api/users/profile', values, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      updateUser(response.data);
      message.success('Profile updated successfully');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const displayedUser = profileUser || user;

  // Update the getImageUrl function to correctly handle course thumbnails
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=Course+Image';
    
    // For URLs that start with http, use as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Handle paths that start with /uploads
    if (imageUrl.startsWith('/uploads')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageUrl}`;
    }
    
    // Default thumbnail for courses
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/courses/thumbnails/default-thumbnail.jpg`;
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
                src={displayedUser.avatar} 
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
                    <Button 
                      type="primary" 
                      icon={<MessageOutlined />} 
                      onClick={() => navigate(`/chat/${displayedUser.id}`)}
                    >
                      Message
                    </Button>
                    {!displayedUser.isFriend ? (
                      <Button 
                        icon={<UserAddOutlined />}
                        onClick={() => {
                          api.post('/api/friends/request', { receiverId: displayedUser.id })
                            .then(() => message.success('Friend request sent!'))
                            .catch(err => message.error('Failed to send friend request'));
                        }}
                      >
                        Add Friend
                      </Button>
                    ) : (
                      <Button 
                        danger
                        icon={<UserOutlined />}
                        onClick={() => {
                          api.delete(`/api/friends/${displayedUser.id}`)
                            .then(() => {
                              message.success('Friend removed');
                              // Refresh the page
                              window.location.reload();
                            })
                            .catch(err => message.error('Failed to remove friend'));
                        }}
                      >
                        Remove Friend
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
                    title="Courses" 
                    value={statsLoading ? <Spin size="small" /> : stats.courses} 
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
          ) : posts.length === 0 ? (
            <Empty description="No posts yet" />
          ) : (
            <List
              itemLayout="vertical"
              dataSource={posts}
              renderItem={post => (
                <List.Item
                  key={post.id}
                  actions={[
                    <Button type="link" key="like" size="small">Like</Button>,
                    <Button type="link" key="comment" size="small">Comment</Button>,
                    <Button type="link" key="share" size="small">Share</Button>
                  ]}
                  extra={
                    post.image && (
                      <Image
                        width={272}
                        alt="post image"
                        src={post.image}
                        fallback="https://via.placeholder.com/272x150?text=Post+Image"
                      />
                    )
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar src={displayedUser.avatar} icon={<UserOutlined />} />}
                    title={<a href={`/posts/${post.id}`}>{post.title || 'Untitled Post'}</a>}
                    description={new Date(post.createdAt).toLocaleString()}
                  />
                  {post.content}
                </List.Item>
              )}
            />
          )}
          </TabPane>
          
          {/* Only show My Courses tab for non-teacher users */}
          {(!isTeacher || !isTeacher()) && (
            <TabPane 
            tab={
              <span>
                <BookOutlined />
                My Courses <Badge count={courses.length} style={{ backgroundColor: '#1890ff' }} />
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
                description={isOwnProfile ? "No courses enrolled" : "No courses to display"}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {isOwnProfile && (
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/home')}
                    style={{ marginTop: '16px' }}
                  >
                    Browse Courses
                  </Button>
                )}
              </Empty>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
                dataSource={courses}
                renderItem={course => (
                  <List.Item>
                    <Card
                      hoverable
                      cover={
                        <Image
                          alt={course.title}
                          src={getImageUrl(course.imageUrl || course.thumbnail)}
                          fallback="https://via.placeholder.com/300x200?text=Course+Image"
                          style={{ height: 160, objectFit: 'cover' }}
                        />
                      }
                      size="small"
                      actions={[
                        <Button 
                          type="link" 
                          key="view" 
                          size="small"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          View
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        title={course.title}
                        description={
                          <Paragraph ellipsis={{ rows: 1 }}>
                            {course.description}
                          </Paragraph>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </TabPane>
        )}
        
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
