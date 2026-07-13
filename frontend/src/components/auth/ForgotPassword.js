import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

const { Title, Text } = Typography;

export const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const normalizedEmail = values.email.toLowerCase();
      const { data } = await api.post('/auth/forgot-password', { email: normalizedEmail });
      message.success(data.message || 'Check the API terminal for your reset code.');
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 420, padding: 8 }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <ArrowLeftOutlined /> Back to login
        </Link>
        <Title level={3} style={{ marginBottom: 8 }}>Forgot password</Title>
        <Text type="secondary">Enter your email. The 6-digit code will appear in the API terminal.</Text>

        <Form name="forgot-password" onFinish={onFinish} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@university.edu" data-testid="email-input" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block data-testid="submit-button">
              Send reset code
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
