import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Typography, Space, message } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const { Title, Text } = Typography;

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses/enrolled');
        console.log('Enrolled courses:', response.data);
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        message.error('Failed to fetch enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Function to get the appropriate image URL
  const getImageUrl = (imageUrl) => {
    console.log('Processing thumbnail:', imageUrl);
    
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

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return <div>Loading your courses...</div>;
  }

  return (
    <div>
      <Title level={2}>My Courses</Title>
      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Text>You are not enrolled in any courses yet.</Text>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map(course => (
            <Col xs={24} sm={12} md={8} key={course.id}>
              <Card 
                hoverable
                onClick={() => handleCourseClick(course.id)}
                cover={
                  <img 
                    alt={course.title} 
                    src={getImageUrl(course.thumbnail)}
                    style={{ height: 160, objectFit: 'cover' }}
                  />
                }
              >
                <Card.Meta 
                  title={course.title}
                  description={course.instructor ? 
                    (typeof course.instructor === 'object' ? 
                      `Instructor: ${course.instructor.username || course.instructor.firstName + ' ' + course.instructor.lastName}` : 
                      `Instructor: ${course.instructor}`) : 
                    'No instructor assigned'}
                />
                <div style={{ marginTop: 10 }}>
                  <Progress
                    percent={course.progress || 0}
                    format={percent => `${percent}% Complete`}
                  />
                  <Space style={{ marginTop: 5 }}>
                    <PlayCircleOutlined /> {course.totalVideos || 0} Videos
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default CourseList; 