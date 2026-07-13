import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined, ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/axios';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailFromUrl = searchParams.get('email') || '';
  const otpFromUrl = searchParams.get('otp') || '';

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: values.email.toLowerCase(),
        otp: values.otp,
        password: values.password,
      });
      message.success('Password updated! Please sign in.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Could not reset password');
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
        <Title level={3}>Set new password</Title>
        <Text type="secondary">Enter the OTP code from the API terminal and your new password.</Text>

        <Form
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          style={{ marginTop: 24 }}
          initialValues={{ email: emailFromUrl, otp: otpFromUrl }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Email is required' }, { type: 'email' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@university.edu" />
          </Form.Item>

          <Form.Item
            label="Reset code (OTP)"
            name="otp"
            rules={[
              { required: true, message: 'OTP is required' },
              { len: 6, message: 'OTP must be 6 digits' },
            ]}
          >
            <Input placeholder="6-digit code" maxLength={6} style={{ letterSpacing: 4 }} />
          </Form.Item>

          <Form.Item
            label="New password"
            name="password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'At least 6 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New password" />
          </Form.Item>

          <Form.Item
            label="Confirm password"
            name="confirmPassword"
            rules={[{ required: true, message: 'Please confirm your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
