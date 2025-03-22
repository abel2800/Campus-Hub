import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Statistic, Table } from 'antd';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from '../utils/axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CourseAnalytics = ({ courseId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  // Chart configuration
  const chartData = {
    labels: analytics?.watchTimeData?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Watch Time (minutes)',
        data: analytics?.watchTimeData?.map(d => d.minutes) || [],
        fill: false,
        borderColor: '#1890ff',
        tension: 0.1,
        pointBackgroundColor: '#1890ff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Watch Time',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Overall Progress"
              value={analytics?.overallProgress || 0}
              suffix="%"
              precision={1}
            />
            <Progress
              percent={analytics?.overallProgress || 0}
              status="active"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Completed Videos"
              value={analytics?.completedVideos || 0}
              suffix={`/ ${analytics?.totalVideos || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Watch Time"
              value={Math.round((analytics?.totalWatchTime || 0) / 60)}
              suffix="minutes"
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Line data={chartData} options={chartOptions} />
      </Card>

      <Card title="Video Progress Details" style={{ marginTop: 16 }}>
        <Table
          dataSource={analytics?.videoProgress || []}
          columns={[
            {
              title: 'Video Title',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: 'Progress',
              dataIndex: 'progress',
              key: 'progress',
              render: (progress) => (
                <Progress percent={Math.round(progress)} size="small" />
              ),
            },
            {
              title: 'Watch Time',
              dataIndex: 'watchTime',
              key: 'watchTime',
              render: (minutes) => `${minutes} mins`,
            },
            {
              title: 'Status',
              dataIndex: 'completed',
              key: 'completed',
              render: (completed) => completed ? 'Completed' : 'In Progress',
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CourseAnalytics;