import React, { useState, useEffect } from 'react';
import { 
  List, 
  Card, 
  Button, 
  Typography, 
  Empty, 
  Spin, 
  Progress,
  message,
  Tag,
  Popconfirm,
  Space
} from 'antd';
import { 
  BookOutlined, 
  RightOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';
import moment from 'moment';

const { Title, Text } = Typography;

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const shouldRefresh = localStorage.getItem('refreshMyCourses');
      if (shouldRefresh === 'true') {
        console.log('Forcing refresh of My Courses page');
        localStorage.removeItem('refreshMyCourses');
      }
      fetchEnrolledCourses();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching enrolled courses...');
      
      const response = await axios.get('/api/courses/user/enrolled');
      
      console.log('Enrolled courses response:', response.data);
      setCourses(response.data || []);
      
      if (response.data && response.data.length > 0) {
        message.success(`Found ${response.data.length} enrolled courses`);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      
      // Show more detailed error message
      if (error.response) {
        console.error('Error response:', error.response.data);
        message.error(`Failed to load courses: ${error.response.data.message || 'Server error'}`);
      } else {
        message.error('Failed to load your courses. Network error.');
      }
      
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleUnenroll = async (courseId) => {
    try {
      setLoading(true);
      console.log(`Unenrolling from course: ${courseId}`);
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please log in to manage your courses');
        navigate('/login');
        return;
      }
      
      // Ensure token is in the headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.delete(`/api/courses/${courseId}/enroll`);
      console.log('Unenroll response:', response.data);
      
      message.success('Successfully unenrolled from course');
      
      // Remove the course from the list
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again');
        navigate('/login');
      } else if (error.response?.status === 404) {
        // If enrollment not found, still remove from UI
        setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
        message.info('You were not enrolled in this course');
      } else {
        message.error('Failed to unenroll from course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update getImageUrl function to remove references to hardcoded course paths
  const getImageUrl = (imageUrl) => {
    console.log('Processing image URL:', imageUrl);
    
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>My Courses</Title>
      
      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Empty 
            description="You haven't enrolled in any courses yet" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button 
            type="primary" 
            icon={<BookOutlined />} 
            onClick={() => navigate('/')}
            style={{ marginTop: '20px' }}
          >
            Browse Courses
          </Button>
        </div>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={courses}
          renderItem={course => (
            <List.Item>
              <Card 
                hoverable
                cover={
                  <div style={{ position: 'relative' }}>
                    <img 
                      alt={course.title} 
                      src={getImageUrl(course.thumbnail)} 
                      style={{ height: 200, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Course';
                      }}
                    />
                    {course.level && (
                      <Tag color="blue" style={{ position: 'absolute', top: 10, right: 10 }}>
                        {course.level}
                      </Tag>
                    )}
                  </div>
                }
              >
                <Card.Meta
                  title={course.title}
                  description={
                    <div>
                      <Text ellipsis style={{ display: 'block', marginBottom: 8 }}>
                        {course.description}
                      </Text>
                      
                      <div style={{ marginBottom: 8, fontSize: '12px', color: '#8c8c8c' }}>
                        {course.duration && (
                          <span style={{ marginRight: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {course.duration}
                          </span>
                        )}
                        {course.enrolledAt && (
                          <span>
                            <UserOutlined style={{ marginRight: 4 }} />
                            Enrolled {moment(course.enrolledAt).fromNow()}
                          </span>
                        )}
                      </div>
                      
                      <Progress 
                        percent={course.progress || 0} 
                        size="small" 
                        status="active"
                        style={{ marginBottom: 12 }}
                      />
                      
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          type="primary" 
                          block
                          onClick={() => handleContinueCourse(course.id)}
                          icon={<RightOutlined />}
                        >
                          {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                        </Button>
                        
                        <Popconfirm
                          title="Unenroll from course"
                          description="Are you sure you want to unenroll from this course? Your progress will be lost."
                          onConfirm={() => handleUnenroll(course.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button 
                            type="text" 
                            danger
                            block
                            icon={<DeleteOutlined />}
                          >
                            Unenroll
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default MyCourses; 