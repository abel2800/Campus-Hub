import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, message, Spin, Alert, Tag, Space, Row, Col, Empty, Image } from 'antd';
import { BookOutlined, ClockCircleOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;
const { Meta } = Card;

// Update the fallback image to use an inline data URL instead of a file path
const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAAAQlBMVEXu7u7///+dnZ3MzMz5+fm6urqPj4/ExMT8/Py2trbl5eXQ0NDa2trT09OXl5d8fHyGhoaioqKrq6uSkpJ0dHSAgIAXOFLhAAACdklEQVR4AezRsVEDQRDG8QWRFhDI/ivlgzG+vgDDxm//GpJnZ0P/uvLnCYAlKpqJKBGAiEREieZNJpKIIpIoYgUiwEqEb1YSK4XVi+KZ1cbqRZEIQCoZ/aaSEllJ8M0qJbKSKGsEYCBLZCXBNyuJZygAfDkzUSICEImEXzOJkhBZRYlIzCQiJFYpkVUoWUtqAVDKGhErR0SJRNYmshJZiawkshJZiaxEVnJeD+xEFSGMg2EYfQBR6tCO2nv/v2lZMQWKYpd+4v7jZ7MdQBmFACQsaFKNAShagJZPIQ8yFoSsC1KWhCwJWRKyIGRByJKQJSFLQpaELAhZELIkZEnIkpAlIUtClgQU0Cn/u5Dl6Rc8fURdlyU5i7IcD9PtMh0E//3nXZYjXnZjGMaTu5j0u7LG42U36rqu63pYCrh8jbIcL8dxGJZlm06lMZQkwf4sazgN5zC/pbtS/nCWI9z2YRjPQ5i2MvvI8j8fxnE87sNxK2Fflge6/Pwf9WFet7LTyRLvlV3XQZvnWreSsyRkSciSkAUhC0KWhCwJWRKy5K9O8jP/dZf7spQzn2VJzqKsW79lVcs6fq1rWbZtdCnr5/1BQj8t/26oQlY71nVpa5SzHPudWJ6yJGQJ7IRlY0HIgpAlIUtCloQsCVkSsiRkSciSkAUhC0KWhCwJWRKyJGRJyJKQJSFLQhaELAlZErIkZEnIkpAlIUv+5J4sA1kysiRkSciCkAUhS0KWhCwJWRKyJGRJyJKQBSELQpaELAlZErIkZEnIkpAFIQtCloQsCVkSsiRkSciSkCUhS0KWhCwJWRKyJGRByIKQJSFLQpaELAlZErIkZMm3ZckwDObKWn8AcVGTaBUBuYcAAAAASUVORK5CYII=';

// Fix the image loading to handle different thumbnail formats based on the database information
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return fallbackImage;
  
  // For URLs that start with http, use as is
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

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    // Clear cached courses to ensure we get fresh data
    localStorage.removeItem('cachedCourses');
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching courses...');
      const response = await axios.get('/api/courses');
      console.log('Courses response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Process courses to ensure all needed fields and replace any old course paths
        const processedCourses = response.data.map(course => ({
          ...course,
          // Ensure we have the teacher's name as instructor
          instructor: course.instructor || course.Teacher?.name || course.teacherName || 'Instructor',
          // Make sure we have thumbnailUrl set properly - prioritize uploads paths
          imageUrl: course.imageUrl?.startsWith('/uploads') 
            ? course.imageUrl 
            : course.thumbnail?.startsWith('/uploads') 
              ? course.thumbnail 
              : '/uploads/courses/thumbnails/default-thumbnail.jpg',
          // Ensure course title is never undefined
          title: course.title && course.title !== 'undefined' ? course.title : 'Untitled Course'
        }));

        // Don't filter out courses - display all valid courses
        setCourses(processedCourses);
        
        // Cache courses for faster access
        localStorage.setItem('cachedCourses', JSON.stringify(processedCourses));
        
        console.log('Processed courses:', processedCourses.length, 'courses ready for display');
      } else {
        console.error('Invalid response format:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // Try to use cached courses if available
      const cachedCourses = localStorage.getItem('cachedCourses');
      if (cachedCourses) {
        const parsedCourses = JSON.parse(cachedCourses);
        console.log('Using cached courses due to fetch error');
        setCourses(parsedCourses);
      } else {
        setError(`Failed to fetch courses: ${error.message}`);
        message.error('Failed to fetch courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      console.log('Enrolling in course:', courseId);
      setEnrolling(courseId);
      
      // Get fresh token
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.info('Please log in to enroll in courses');
        navigate('/login', { state: { from: '/' } });
        return;
      }
      
      // Ensure token is set in headers for this specific request
      const response = await axios.post(`/api/courses/${courseId}/enroll`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Enrollment response:', response.data);
      
      if (response.status === 201 || response.status === 200) {
        message.success('Successfully enrolled in course!');
        
        // Update the local courses list to show as enrolled
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId 
              ? { ...course, isEnrolled: true } 
              : course
          )
        );
        
        // Force refresh the My Courses page next time
        localStorage.setItem('refreshMyCourses', 'true');
        
        // Navigate to the course page
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again');
        navigate('/login', { state: { from: '/' } });
      } else if (error.response?.status === 400 && error.response?.data?.message === 'Already enrolled in this course') {
        message.info('You are already enrolled in this course');
        navigate(`/courses/${courseId}`);
      } else if (error.response?.status === 404) {
        message.error('Course not found');
      } else {
        message.error('Failed to enroll in course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleRetry = () => {
    fetchCourses();
  };

  const handleImageError = (e) => {
    console.log('Failed to load image: ', e);
    e.target.src = fallbackImage;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading courses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>Popular Courses</Title>
        <Paragraph>Explore our most popular courses and start learning today!</Paragraph>
      </div>
      
      <Row gutter={[24, 24]}>
        {courses.map(course => (
          <Col xs={24} sm={12} md={8} key={course.id}>
            <Card
              hoverable
              style={{ height: '100%', borderRadius: '8px', overflow: 'hidden' }}
              cover={
                <Link to={`/courses/${course.id}`}>
                  <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      alt={course.title}
                      src={getImageUrl(course.imageUrl || course.thumbnail)}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                      onError={handleImageError}
                    />
                  </div>
                </Link>
              }
              styles={{ body: { padding: '16px' } }}
            >
              <Link to={`/courses/${course.id}`}>
                <Meta
                  title={<div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>{course.title}</div>}
                  description={
                    <>
                      <div style={{ 
                        marginBottom: '12px', 
                        height: '40px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: '#666'
                      }}>
                        {course.description}
                      </div>
                      {course.instructor && (
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                          <UserOutlined style={{ marginRight: '5px' }} />
                          {typeof course.instructor === 'object' ? course.instructor.username : course.instructor}
                        </div>
                      )}
                    </>
                  }
                />
              </Link>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  type="primary" 
                  onClick={() => handleEnroll(course.id)}
                  loading={enrolling === course.id}
                >
                  Enroll
                </Button>
                <Button onClick={() => handleViewCourse(course.id)}>
                  Details
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomePage;