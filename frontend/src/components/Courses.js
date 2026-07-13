import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Typography, Space, message, Spin } from 'antd';
import { BookOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const { Title, Text } = Typography;

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses');
      console.log('Courses data:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again');
        navigate('/login');
      } else {
        message.error('Failed to load courses');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to get the appropriate image URL
  const getImageUrl = (imageUrl) => {
    console.log('Processing course thumbnail:', imageUrl);
    
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=Course';
    
    // For full URLs with http, use as is
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

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(true);
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please log in to enroll in this course');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }
      
      // Ensure token is in the headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await axios.post(`/api/courses/${courseId}/enroll`);
      message.success('Successfully enrolled in course');
      
      // Force refresh the My Courses page next time it's loaded
      localStorage.setItem('refreshMyCourses', 'true');
      
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
      } else if (error.response?.status === 400 && error.response?.data?.message === 'Already enrolled in this course') {
        message.info('You are already enrolled in this course');
        navigate(`/courses/${courseId}`);
      } else {
        message.error('Failed to enroll: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'green';
      case 'Closed':
        return 'red';
      case 'Coming Soon':
        return 'orange';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <Spin size="large" />
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Available Courses</Title>
        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <Text>No courses available at the moment. Check back later!</Text>
          </div>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={courses}
            renderItem={course => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={course.title}
                      src={getImageUrl(course.imageUrl || course.thumbnail)}
                      style={{ height: 200, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = getImageUrl('/uploads/courses/thumbnails/default-thumbnail.jpg');
                      }}
                    />
                  }
                  actions={[
                    <Button 
                      type="primary"
                      onClick={() => handleEnroll(course.id)}
                      loading={enrolling}
                    >
                      Enroll Now
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={course.title}
                    description={course.description}
                  />
                  <Space direction="vertical" style={{ marginTop: 16 }}>
                    <Space>
                      <UserOutlined />
                      <Text>Instructor: {typeof course.instructor === 'object' ? course.instructor.username : (course.instructor || 'Unknown')}</Text>
                    </Space>
                    
                    <Space>
                      <ClockCircleOutlined />
                      <Text>Duration: {course.duration || '8 weeks'}</Text>
                    </Space>

                    <Tag color={getStatusColor(course.status || 'Open')}>
                      {course.status || 'Open'}
                    </Tag>

                    <Text type="secondary">
                      Department: {course.department || 'General'}
                    </Text>
                    
                    <Tag color="blue">{course.level || 'Beginner'}</Tag>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Space>
    </div>
  );
};

export default Courses;