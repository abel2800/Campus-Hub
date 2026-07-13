import React, { useState } from 'react';
import { Form, Input, Button, Select, message, Typography, Segmented } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { Text } = Typography;

const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Arts',
  'Science',
  'Mathematics',
  'Medicine',
  'Law',
  'Education',
];

const TEACHER_EMAIL_PATTERN = /^[^\s@]+@teacher\.edu$/i;

const CreateAccount = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');
  const [role, setRole] = useState('student');
  const [pending, setPending] = useState(null);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const onRequestOtp = async (values) => {
    try {
      setLoading(true);
      const email = values.email.toLowerCase().trim();
      const payload = {
        username: values.username.trim(),
        email,
        password: values.password,
        department: values.department,
      };

      const endpoint =
        role === 'teacher' ? '/auth/register/teacher/request' : '/auth/register/request';

      if (role === 'teacher') {
        payload.isTeacher = true;
      }

      const { data } = await api.post(endpoint, payload);

      setPending({ email, role });
      setStep('otp');
      message.success(data.message || 'Check the API terminal for your OTP code.');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values) => {
    try {
      setLoading(true);
      const endpoint =
        pending?.role === 'teacher'
          ? '/auth/register/teacher/verify'
          : '/auth/register/verify';

      const { data } = await api.post(endpoint, {
        email: pending.email,
        otp: values.otp,
      });

      const token = data.token;
      const userData = data.user;
      if (!token || !userData) {
        throw new Error('Invalid server response');
      }

      setSession(token, userData);
      message.success(
        pending?.role === 'teacher'
          ? 'Teacher account created! Welcome to Campus Hub.'
          : 'Account verified! Welcome to Campus Hub.',
      );

      if (pending?.role === 'teacher' || userData.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/home');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Verify your email</h2>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Enter the 6-digit code from the API terminal for {pending?.email}
        </Text>

        <Form name="verifyOtp" onFinish={onVerifyOtp} layout="vertical">
          <Form.Item
            label="Verification code"
            name="otp"
            rules={[
              { required: true, message: 'Enter the 6-digit code' },
              { len: 6, message: 'Code must be 6 digits' },
            ]}
          >
            <Input maxLength={6} placeholder="123456" style={{ letterSpacing: 4, fontSize: 18 }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Verify & create account
            </Button>
          </Form.Item>

          <Button type="link" block onClick={() => setStep('form')}>
            Back to registration form
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Create your account</h2>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        Choose your role, then verify with a one-time code from the API terminal.
      </Text>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <Segmented
          value={role}
          onChange={(value) => {
            setRole(value);
            form.setFieldsValue({ email: undefined });
          }}
          options={[
            { label: 'Student', value: 'student' },
            { label: 'Teacher', value: 'teacher' },
          ]}
        />
      </div>

      <Form form={form} name="createAccount" onFinish={onRequestOtp} layout="vertical" requiredMark>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input placeholder="campus_user" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
            () => ({
              validator(_, value) {
                if (!value) return Promise.resolve();
                const email = value.trim().toLowerCase();
                if (role === 'teacher' && !TEACHER_EMAIL_PATTERN.test(email)) {
                  return Promise.reject(
                    new Error('Teachers must use a @teacher.edu email (e.g. name@teacher.edu)'),
                  );
                }
                if (role === 'student' && TEACHER_EMAIL_PATTERN.test(email)) {
                  return Promise.reject(
                    new Error('Use a regular university email, or switch to Teacher role'),
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input
            placeholder={role === 'teacher' ? 'name@teacher.edu' : 'name@university.edu'}
          />
        </Form.Item>

        <Form.Item
          label={role === 'teacher' ? 'Teaching department' : 'Department'}
          name="department"
          rules={[
            {
              required: true,
              message:
                role === 'teacher'
                  ? 'Please select your teaching department!'
                  : 'Please select your department!',
            },
          ]}
        >
          <Select placeholder="Select department">
            {DEPARTMENTS.map((dept) => (
              <Option key={dept} value={dept}>
                {dept}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
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
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Send verification code
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text>Already have an account? </Text>
          <Link to="/login">Log in</Link>
        </div>
      </Form>
    </div>
  );
};

export default CreateAccount;
