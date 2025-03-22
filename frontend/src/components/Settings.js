import React from 'react';
import { Card, Form, Input, Button, Select, Upload, message, Space, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const onFinish = async (values) => {
    try {
      // Implement update profile logic here
      console.log('Updated values:', values);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      // Implement password change logic here
      console.log('Password change:', values);
      message.success('Password changed successfully');
    } catch (error) {
      message.error('Failed to change password');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Settings</Title>

        <Card title="Profile Settings">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              username: user.username,
              email: user.email,
              department: user.department
            }}
            onFinish={onFinish}
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
                {/* Add more departments as needed */}
              </Select>
            </Form.Item>

            <Form.Item
              name="avatar"
              label="Profile Picture"
            >
              <Upload
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Avatar</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Change Password">
          <Form layout="vertical" onFinish={handlePasswordChange}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please input your current password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
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
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Notification Settings">
          <Form layout="vertical">
            <Form.Item name="emailNotifications" valuePropName="checked">
              <Space direction="vertical">
                <Text>Email Notifications</Text>
                <Select defaultValue="all" style={{ width: 200 }}>
                  <Option value="all">All Notifications</Option>
                  <Option value="important">Important Only</Option>
                  <Option value="none">None</Option>
                </Select>
              </Space>
            </Form.Item>

            <Form.Item>
              <Button type="primary">Save Notification Settings</Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default Settings; 