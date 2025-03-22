import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import axios from '../../utils/axios';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalWatchTime: 0
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
    <div>
      <h1>Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Students" 
              value={stats.totalStudents} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Courses" 
              value={stats.totalCourses} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Watch Time" 
              value={stats.totalWatchTime} 
              suffix="minutes"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard; 