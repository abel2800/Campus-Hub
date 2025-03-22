import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Table, Typography } from 'antd';
import axios from '../../utils/axios';

const { Title } = Typography;

const TeacherAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    courseEngagement: [],
    studentProgress: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/teacher/analytics');
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const columns = [
    {
      title: 'Course Name',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Total Students',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
    },
    {
      title: 'Average Progress',
      dataIndex: 'averageProgress',
      key: 'averageProgress',
      render: (progress) => <Progress percent={progress} />,
    },
  ];

  return (
    <div>
      <Title level={2}>Course Analytics</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Course Progress">
            <Table
              columns={columns}
              dataSource={analyticsData.courseEngagement}
              rowKey="courseId"
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Student Progress">
            <Table
              columns={[
                {
                  title: 'Student Name',
                  dataIndex: 'studentName',
                  key: 'studentName',
                },
                {
                  title: 'Course',
                  dataIndex: 'courseName',
                  key: 'courseName',
                },
                {
                  title: 'Progress',
                  dataIndex: 'progress',
                  key: 'progress',
                  render: (progress) => <Progress percent={progress} />,
                },
                {
                  title: 'Last Active',
                  dataIndex: 'lastActive',
                  key: 'lastActive',
                },
              ]}
              dataSource={analyticsData.studentProgress}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherAnalytics;
