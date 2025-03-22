import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Typography, Space, Statistic, Row, Col } from 'antd';
import { VideoCameraOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const { Title, Text } = Typography;

const TeacherCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/teacher/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Course Management</Title>
          <Button 
            type="primary" 
            onClick={() => navigate('/teacher/create-course')}
          >
            Create New Course
          </Button>
        </div>

        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={courses}
          loading={loading}
          renderItem={course => (
            <List.Item>
              <Card
                cover={
                  <img
                    alt={course.title}
                    src={course.thumbnail}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                }
                actions={[
                  <Button 
                    type="link" 
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  >
                    View Details
                  </Button>
                ]}
              >
                <Card.Meta
                  title={course.title}
                  description={course.description}
                />
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Statistic 
                      title="Students" 
                      value={course.totalStudents} 
                      prefix={<TeamOutlined />} 
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="Videos" 
                      value={course.totalVideos} 
                      prefix={<VideoCameraOutlined />} 
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="Hours" 
                      value={Math.round(course.totalDuration / 60)} 
                      prefix={<ClockCircleOutlined />} 
                    />
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      </Space>
    </div>
  );
};

export default TeacherCourseList;
