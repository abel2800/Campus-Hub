import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Upload, 
  message, 
  Typography, 
  Divider, 
  Menu, 
  Avatar, 
  Switch, 
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  UploadOutlined, 
  BellOutlined, 
  SettingOutlined, 
  GlobalOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import styled from 'styled-components';
import axios from '../utils/axios';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const SettingsLayout = styled(Layout)`
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
`;

const SettingsContent = styled(Content)`
  padding: 24px;
  margin: 0;
`;

const PageHeader = styled.div`
  background: white;
  padding: 24px;
  border-radius: 4px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const AvatarContainer = styled.div`
  margin-right: 24px;
  position: relative;
`;

const AvatarUploadButton = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border-radius: 50%;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
`;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const onFinishProfile = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/users/profile', {
        username: values.username,
        department: values.department,
        bio: values.bio,
      });
      message.success('Profile updated successfully');
      
      localStorage.setItem('user', JSON.stringify({
        ...user,
        ...response.data,
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onFinishPrivacy = async (values) => {
    try {
      setLoading(true);
      await axios.put('/api/users/privacy', {
        profileVisibility: values.profileVisibility,
        searchable: values.searchable,
        showCourses: values.showCourses,
        showFriendsList: values.showFriendsList,
      });
      message.success('Privacy settings saved');
    } catch (error) {
      console.error('Failed to save privacy:', error);
      message.error(error.response?.data?.message || 'Failed to save privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setLoading(true);
      await axios.put('/api/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsChange = async (values) => {
    try {
      setLoading(true);
      await axios.put('/api/users/notification-settings', values);
      message.success('Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      message.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        const formData = new FormData();
        formData.append('avatar', info.file.originFileObj);
        
        const response = await axios.post('/api/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Update local storage with new avatar path
        localStorage.setItem('user', JSON.stringify({
          ...user,
          avatar: response.data.avatarUrl || response.data.avatar
        }));
        
        message.success('Avatar updated successfully');
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        message.error('Failed to upload avatar');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SettingsLayout>
      <PageHeader>
        <Title level={2}>Account Settings</Title>
        <Paragraph type="secondary">
          Manage your account settings and preferences
        </Paragraph>
      </PageHeader>

      <SettingsContent>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabPosition="left"
          style={{ background: 'white', padding: '24px', borderRadius: '4px' }}
        >
          <TabPane 
            tab={<span><UserOutlined /> Profile</span>} 
            key="profile"
          >
            <StyledCard title="Profile Information">
              <AvatarWrapper>
                <AvatarContainer>
                  <Avatar 
                    size={100} 
                    src={user.avatar ? `${process.env.REACT_APP_API_URL}${user.avatar}` : null} 
                    icon={!user.avatar && <UserOutlined />} 
                  />
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    action={`${process.env.REACT_APP_API_URL}/api/users/avatar`}
                    beforeUpload={() => false}
                    onChange={uploadAvatar}
                  >
                    <AvatarUploadButton>
                      <UploadOutlined />
                    </AvatarUploadButton>
                  </Upload>
                </AvatarContainer>
                <div>
                  <Title level={4}>{user.username}</Title>
                  <Text type="secondary">{user.email}</Text>
                </div>
              </AvatarWrapper>

              <Form
                form={profileForm}
                layout="vertical"
                initialValues={{
                  username: user.username,
                  email: user.email,
                  department: user.department,
                  bio: user.bio || ''
                }}
                onFinish={onFinishProfile}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please input your username!' }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="department"
                  label="Department"
                  rules={[{ required: true, message: 'Please select your department!' }]}
                >
                  <Select>
                    <Option value="computer_science">Computer Science</Option>
                    <Option value="engineering">Engineering</Option>
                    <Option value="business">Business</Option>
                    <Option value="arts">Arts</Option>
                    <Option value="mathematics">Mathematics</Option>
                    <Option value="physics">Physics</Option>
                    <Option value="chemistry">Chemistry</Option>
                    <Option value="biology">Biology</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="bio"
                  label="Bio"
                >
                  <Input.TextArea rows={4} placeholder="Tell us about yourself" />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    Update Profile
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </TabPane>

          <TabPane 
            tab={<span><KeyOutlined /> Password</span>} 
            key="password"
          >
            <StyledCard title="Change Password">
              <Form 
                form={passwordForm}
                layout="vertical" 
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[{ required: true, message: 'Please input your current password!' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />}
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: 'Please input your new password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />}
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />}
                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    Change Password
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </TabPane>

          <TabPane 
            tab={<span><BellOutlined /> Notifications</span>} 
            key="notifications"
          >
            <StyledCard title="Notification Preferences">
              <Form layout="vertical" onFinish={handleNotificationSettingsChange}>
                <Form.Item
                  name="emailNotifications"
                  label="Email Notifications"
                >
                  <Select defaultValue="all" style={{ width: '100%' }}>
                    <Option value="all">All Notifications</Option>
                    <Option value="important">Important Only</Option>
                    <Option value="none">None</Option>
                  </Select>
                </Form.Item>

                <Divider />

                <Form.Item
                  name="newMessageNotification"
                  label="New Messages"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>

                <Form.Item
                  name="friendRequestNotification"
                  label="Friend Requests"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>

                <Form.Item
                  name="postLikeNotification"
                  label="Post Likes & Comments"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>

                <Form.Item
                  name="courseNotification"
                  label="Course Updates"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    Save Notification Settings
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </TabPane>

          <TabPane 
            tab={<span><SecurityScanOutlined /> Privacy</span>} 
            key="privacy"
          >
            <StyledCard title="Privacy Settings">
              <Form
                layout="vertical"
                onFinish={onFinishPrivacy}
                initialValues={{
                  profileVisibility: user?.privacySettings?.profileVisibility || 'public',
                  searchable: user?.privacySettings?.searchable !== false,
                  showCourses: user?.privacySettings?.showCourses !== false,
                  showFriendsList: user?.privacySettings?.showFriendsList !== false,
                }}
              >
                <Form.Item
                  name="profileVisibility"
                  label="Post visibility"
                  extra="Private accounts (Instagram-style): only friends see your posts, courses, and friend list. Strangers see photo + bio only."
                >
                  <Select style={{ width: '100%' }}>
                    <Option value="public">Public — Anyone can see your posts</Option>
                    <Option value="private">Private — Only friends can see your posts</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="showFriendsList"
                  label="Show friends list on profile"
                  valuePropName="checked"
                  extra="Turn off to hide your friends list from others."
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="searchable"
                  label="Appear in Search Results"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="showCourses"
                  label="Show Enrolled Courses"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    Save Privacy Settings
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </TabPane>
        </Tabs>
      </SettingsContent>
    </SettingsLayout>
  );
};

export default Settings; 