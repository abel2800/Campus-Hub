import React, { useState, useEffect } from 'react';
import { Table, Card, Progress, Typography, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';

const { Title } = Typography;

const StudentProgress = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      const response = await axios.get('/teacher/students/progress');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      filteredValue: [searchText],
      onFilter: (value, record) => 
        record.studentName.toLowerCase().includes(value.toLowerCase()),
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
      title: 'Videos Watched',
      dataIndex: 'videosWatched',
      key: 'videosWatched',
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Student Progress</Title>
        
        <Input
          placeholder="Search students"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />

        <Card>
          <Table
            columns={columns}
            dataSource={students}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default StudentProgress;
