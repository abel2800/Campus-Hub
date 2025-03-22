import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Divider, 
  message, 
  Select,
  Alert 
} from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Option } = Select;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: #f5f5f5;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Logo = styled.img`
  height: 70px;
`;

const TeacherRegistrationForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      // Add teacher specific fields
      const teacherData = {
        ...values,
        isTeacher: true,
      };
      
      const response = await axios.post('/api/auth/register', teacherData);
      
      message.success('Teacher account created successfully!');
      
      // Store the JWT token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirect to teacher dashboard
      navigate('/teacher');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <StyledCard>
        <LogoContainer>
          <Logo src="/logo.png" alt="CampusHub Logo" />
          <Title level={2}>Teacher Registration</Title>
          <Text type="secondary">Create your teacher account to publish courses and manage students</Text>
        </LogoContainer>
        
        {error && (
          <Alert
            message="Registration Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError('')}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={4}>Personal Information</Title>
            
            <Space direction="horizontal" size="middle" style={{ width: '100%', display: 'flex' }}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter your first name' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="First Name" />
              </Form.Item>
              
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter your last name' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Last Name" />
              </Form.Item>
            </Space>
            
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
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>
            
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
            </Form.Item>
            
            <Divider />
            
            <Title level={4}>Teacher Information</Title>
            
            <Form.Item
              name="teacherId"
              label="Teacher ID"
              rules={[{ required: true, message: 'Please enter your teacher ID' }]}
              tooltip="Enter your official teacher identification number provided by your institution"
            >
              <Input prefix={<IdcardOutlined />} placeholder="Teacher ID" />
            </Form.Item>
            
            <Form.Item
              name="specialization"
              label="Area of Specialization"
              rules={[{ required: true, message: 'Please select your specialization' }]}
            >
              <Select placeholder="Select your specialization">
                <Option value="computer_science">Computer Science</Option>
                <Option value="engineering">Engineering</Option>
                <Option value="mathematics">Mathematics</Option>
                <Option value="physics">Physics</Option>
                <Option value="biology">Biology</Option>
                <Option value="chemistry">Chemistry</Option>
                <Option value="business">Business & Economics</Option>
                <Option value="arts_humanities">Arts & Humanities</Option>
                <Option value="social_sciences">Social Sciences</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="qualification"
              label="Highest Qualification"
              rules={[{ required: true, message: 'Please select your qualification' }]}
            >
              <Select placeholder="Select your qualification">
                <Option value="bachelor">Bachelor's Degree</Option>
                <Option value="master">Master's Degree</Option>
                <Option value="phd">PhD</Option>
                <Option value="associate_professor">Associate Professor</Option>
                <Option value="professor">Professor</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="bio"
              label="Professional Bio"
              rules={[{ required: true, message: 'Please enter your professional bio' }]}
              tooltip="Write a brief professional bio that will be visible to students"
            >
              <Input.TextArea 
                placeholder="Enter a brief professional bio (500 characters max)" 
                maxLength={500} 
                showCount 
                rows={4}
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Register as Teacher
              </Button>
            </Form.Item>
            
            <Text style={{ textAlign: 'center', display: 'block' }}>
              Already have an account? <Link to="/login">Log in</Link>
            </Text>
            
            <Text style={{ textAlign: 'center', display: 'block' }}>
              Want to register as a student? <Link to="/register">Student Registration</Link>
            </Text>
          </Space>
        </Form>
      </StyledCard>
    </Container>
  );
};

export default TeacherRegistrationForm; 