import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Progress, Typography, Statistic } from 'antd';
import { BookOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from '../utils/axios';

const { Content } = Layout;
const { Title } = Typography;

const DashboardPage = () => {
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalStudyTime: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [progressRes, statsRes] = await Promise.all([
        axios.get('/api/analysis/progress'),
        axios.get('/api/analysis/stats')
      ]);
      setProgressData(progressRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        {/* Overview Statistics */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Courses"
                value={stats.totalCourses}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Courses"
                value={stats.activeCourses}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed Courses"
                value={stats.completedCourses}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Study Time (hrs)"
                value={stats.totalStudyTime}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Course Progress */}
        <Title level={2} style={{ margin: '24px 0' }}>Course Progress</Title>
        <Row gutter={[16, 16]}>
          {progressData.map(course => (
            <Col span={8} key={course.id}>
              <Card title={course.title} bordered>
                <p>Time Spent: {course.timeSpent} hours</p>
                <Progress percent={course.progress} />
                <p>Grade: {course.grade}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  );
};

export default DashboardPage; 