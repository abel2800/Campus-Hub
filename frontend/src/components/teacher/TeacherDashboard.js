import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { UserOutlined, BookOutlined, StarOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';

const { Title } = Typography;

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/teacher/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="teacher-dashboard">
      <Title level={2}>Teacher Dashboard</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic 
              title="Total Students" 
              value={stats.totalStudents} 
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div className="statistic-footer">Students enrolled in your courses</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic 
              title="Total Courses" 
              value={stats.totalCourses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="statistic-footer">Courses you've created</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic 
              title="Avg. Rating" 
              value={stats.averageRating || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="/5"
              precision={1}
            />
            <div className="statistic-footer">Average rating of your courses</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard; 