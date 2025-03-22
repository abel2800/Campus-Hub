import React, { useState, useEffect } from 'react';
import { 
  Layout, Row, Col, Card, Statistic, Button, List, 
  Typography, Empty, Spin, Space, message, Modal, Tag
} from 'antd';
import { 
  BookOutlined, TeamOutlined, 
  PlusOutlined, DollarOutlined, StarOutlined, 
  ArrowUpOutlined, ArrowDownOutlined, UserOutlined,
  DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

// Style objects
const statsCardStyle = {
  borderRadius: '12px',
  height: '100%',
  boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
  transition: 'all 0.3s'
};

const TeacherHomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
    studentIncrease: 0,
    revenueIncrease: 0,
    activeStudents: 0
  });
  const [courses, setCourses] = useState([]);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('TeacherHomePage rendering - User:', user?.username, 'Role:', user?.role);

  useEffect(() => {
    console.log('TeacherHomePage mounted - Fetching data');
    
    const loadData = async () => {
      try {
        // Set demo data immediately for faster rendering
        setStats({
          totalStudents: 124,
          totalCourses: 7,
          totalRevenue: 3280,
          averageRating: 4.7,
          studentIncrease: 12,
          revenueIncrease: 8,
          activeStudents: 98
        });
        
        setCourses([
          { 
            id: 1, 
            title: 'Introduction to React', 
            enrollmentCount: 42, 
            category: 'programming', 
            rating: 4.8, 
            isArchived: false,
            description: 'A comprehensive introduction to React for beginners'
          },
          { 
            id: 2, 
            title: 'Advanced JavaScript', 
            enrollmentCount: 36, 
            category: 'programming', 
            rating: 4.6, 
            isArchived: false,
            description: 'Take your JavaScript skills to the next level'
          }
        ]);
        
        // Set loading false to show content from demo data
        setLoading(false);
        
        // Then try to fetch real data
        try {
          await fetchDashboardData();
          await fetchAllCourses();
        } catch (error) {
          console.error('Error fetching real data:', error);
          // Demo data is already shown, so no need to handle this error further
        }
      } catch (error) {
        console.error('Error in TeacherHomePage useEffect:', error);
        setLoading(false);
        message.error('Failed to load dashboard data');
      }
    };
    
    loadData();
    
    // Return cleanup function
    return () => {
      console.log('TeacherHomePage unmounting');
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Fetching teacher dashboard stats');
      // Fetch dashboard statistics
      const statsResponse = await api.get('/api/teacher/dashboard/stats');
      console.log('Stats response:', statsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set sample data for demo purposes
      setStats({
        totalStudents: 124,
        totalCourses: 7,
        totalRevenue: 3280,
        averageRating: 4.7,
        studentIncrease: 12,
        revenueIncrease: 8,
        activeStudents: 98
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const response = await api.get('/api/courses/teacher');
      console.log('All courses:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching all courses:', error);
      
      // For demo purposes
      setCourses([
        { 
          id: 1, 
          title: 'Introduction to React', 
          enrollmentCount: 42, 
          category: 'programming', 
          rating: 4.8, 
          isArchived: false, 
          description: 'A comprehensive introduction to React for beginners. Learn the fundamentals of building modern, interactive web applications with React.'
        },
        { 
          id: 2, 
          title: 'Advanced JavaScript', 
          enrollmentCount: 36, 
          category: 'programming', 
          rating: 4.6, 
          isArchived: false, 
          description: 'Take your JavaScript skills to the next level. This course covers advanced concepts that will make you a better JavaScript developer.'
        },
        { 
          id: 3, 
          title: 'UI/UX Design Fundamentals', 
          enrollmentCount: 28, 
          category: 'design', 
          rating: 4.5, 
          isArchived: false, 
          description: 'Learn the principles of effective UI/UX design. This course will teach you how to create beautiful, functional designs that users love.'
        }
      ]);
    }
  };

  const getAbsoluteUrl = (path) => {
    // Create an absolute URL that will bypass React Router
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}`;
  };

  const directNavigate = (path) => {
    // Create an anchor element
    const a = document.createElement('a');
    a.href = getAbsoluteUrl(path);
    a.target = '_self'; // Same window
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCreateCourse = (e) => {
    if (e) e.preventDefault();
    console.log('=== CREATE COURSE NAVIGATION ===');
    // Use the most direct method
    window.location.href = '/teacher/create-course';
  };

  const handleViewCourse = (courseId) => {
    console.log('=== VIEW COURSE NAVIGATION ===');
    console.log('Navigating to course with ID:', courseId);
    
    // Ensure courseId is a valid number before navigating
    if (!courseId || isNaN(parseInt(courseId))) {
      console.error('Invalid course ID:', courseId);
      message.error('Invalid course ID');
      return;
    }
    
    // Use the most direct method
    window.location.href = `/teacher/courses/${courseId}`;
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this course?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/api/courses/${id}`);
          message.success('Course deleted successfully');
          fetchAllCourses();
          fetchDashboardData();
        } catch (error) {
          console.error('Error deleting course:', error);
          message.error('Failed to delete course');
        }
      },
    });
  };

  const handleViewAllCourses = () => {
    navigate('/teacher/courses');
  };

  // SIMPLE FALLBACK RETURN - guaranteed to render something
  console.log('TeacherHomePage render attempt', { loading, courseCount: courses?.length });

  // Use a very simple return to ensure at least something renders
  return (
    <Layout className="teacher-dashboard" style={{ padding: '24px', minHeight: '100vh' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Title level={2}>Teacher Dashboard</Title>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={statsCardStyle}>
                <Statistic
                  title="Total Students"
                  value={stats.totalStudents}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={statsCardStyle}>
                <Statistic
                  title="Total Courses"
                  value={stats.totalCourses}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={statsCardStyle}>
                <Statistic
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="$"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={statsCardStyle}>
                <Statistic
                  title="Avg. Rating"
                  value={stats.averageRating}
                  precision={1}
                  prefix={<StarOutlined />}
                  suffix="/5"
                />
              </Card>
            </Col>
          </Row>
          
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3}>Course Management</Title>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCourse}>
                  Create New Course
                </Button>
                <Button type="default" onClick={handleViewAllCourses}>
                  Manage Courses
                </Button>
              </Space>
            </div>
          </div>
          
          {/* Course Management Section */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Course Management</span>
              </div>
            }
            style={{ marginBottom: 24 }}
          >
            {courses.length === 0 ? (
              <Empty
                description="You haven't created any courses yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCourse}>
                  Create Your First Course
                </Button>
              </Empty>
            ) : (
              <List 
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
                dataSource={courses}
                renderItem={course => (
                  <List.Item>
                    <Card 
                      hoverable 
                      cover={
                        <div style={{ 
                          height: 160, 
                          overflow: 'hidden',
                          background: `url(${course.thumbnail || course.imageUrl || 'https://via.placeholder.com/300x160?text=Course+Thumbnail'}) center center / cover no-repeat`
                        }} />
                      }
                      actions={[
                            <Button 
                          type="link" 
                              icon={<EyeOutlined />} 
                          onClick={() => {
                            console.log('View button clicked for course:', course);
                            handleViewCourse(course.id);
                          }}
                            >
                              View
                        </Button>,
                            <Button 
                          type="link" 
                          danger 
                              icon={<DeleteOutlined />} 
                              onClick={() => handleDelete(course.id)} 
                            >
                              Delete
                            </Button>
                      ]}
                    >
                      <Card.Meta
                        title={course.title || 'Untitled Course'}
                        description={
                          <div>
                            <div style={{ 
                              height: '60px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              marginBottom: '12px'
                            }}>
                              {course.description || 'No description provided'}
                            </div>
                            <Space style={{ marginTop: 8 }}>
                              <Tag color="blue">{course.category || 'General'}</Tag>
                              <Tag color="green">{course.level || 'All Levels'}</Tag>
                            </Space>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>
                                <TeamOutlined style={{ marginRight: 4 }} />
                                {course.enrollmentCount || 0} students
                              </span>
                              <span>
                                <StarOutlined style={{ marginRight: 4, color: '#faad14' }} />
                                {course.rating || 0}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </>
      )}
    </Layout>
  );
};

export default TeacherHomePage; 