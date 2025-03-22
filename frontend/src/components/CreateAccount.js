import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Typography, Divider } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const CreateAccount = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('Registration attempt with:', values); // Debug log

      const response = await api.post('/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email.toLowerCase(),
        password: values.password,
        department: values.department
      });

      console.log('Registration response:', response.data); // Debug log

      if (response.data.success) {
        localStorage.setItem('autoLogin', 'true');
        
        message.success('Account created successfully!');
        navigate('/');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      message.error(error.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>Create Student Account</h2>
      
      <Form
        name="createAccount"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={true}
      >
        <Form.Item
          label="First Name"
          name="firstName"
          rules={[{ required: true, message: 'Please input your first name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[{ required: true, message: 'Please input your last name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Department"
          name="department"
          rules={[{ required: true, message: 'Please select your department!' }]}
        >
          <Select>
            <Option value="Computer Science">Computer Science</Option>
            <Option value="Engineering">Engineering</Option>
            <Option value="Business">Business</Option>
            <Option value="Arts">Arts</Option>
            <Option value="Science">Science</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Create Student Account
          </Button>
        </Form.Item>
        
        <Divider>or</Divider>
        
        <div style={{ textAlign: 'center' }}>
          <Text>Are you a teacher?</Text>
          <div style={{ marginTop: 8 }}>
            <Link to="/teacher-registration">
              <Button type="default">Register as a Teacher</Button>
            </Link>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text>Already have an account? </Text>
          <Link to="/">Log in</Link>
        </div>
      </Form>
    </div>
  );
};

export default CreateAccount;

