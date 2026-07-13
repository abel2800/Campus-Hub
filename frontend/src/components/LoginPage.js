import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const userWithRole = await login(values);
      
      if (userWithRole) {
        localStorage.setItem('autoLogin', 'true');
        
        // Check user role and redirect accordingly
        if (userWithRole.role === 'teacher') {
          console.log('Teacher logged in, redirecting to teacher dashboard');
          message.success('Welcome back, Teacher!');
          
          // Use setTimeout to ensure message is shown before redirect
          setTimeout(() => {
            // Force a hard redirect to ensure proper routing
            window.location.href = '/teacher/home';
          }, 500);
        } else {
          console.log('Student logged in, redirecting to dashboard');
          message.success('Login successful!');
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, padding: '24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Login to Campus Hub
        </Title>
        
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email or username!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email or username" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              Log in
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text>Don&apos;t have an account? </Text>
            <Link to="/create-account">Create account</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 