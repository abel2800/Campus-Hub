import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, Card, Typography, Tabs, Row, Col, 
  Statistic, Tag, Avatar, List, Progress, 
  Button, Divider, Space, Spin, Empty, message, 
  Table, Rate, Modal, Input, Dropdown, Menu,
  Upload, Popconfirm, Alert
} from 'antd';
import { 
  PlayCircleOutlined, 
  UsergroupAddOutlined, 
  StarOutlined, 
  ClockCircleOutlined,
  EditOutlined, 
  CheckCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  DownloadOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  MoreOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Meta } = Card;

const CourseView = ({ courseId: propsCourseId }) => {
  const { courseId: paramsCourseId } = useParams();
  const courseId = paramsCourseId || propsCourseId;
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentProgressModalVisible, setStudentProgressModalVisible] = useState(false);
  const [studentVideoProgress, setStudentVideoProgress] = useState([]);
  const [studentProgressLoading, setStudentProgressLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('CourseView component initialized with:', {
    paramsCourseId,
    propsCourseId,
    courseId
  });

  useEffect(() => {
    console.log('CourseView mounted, course ID:', courseId);
    
    if (!courseId) {
      console.error('No course ID provided');
      setLoading(false);
      return;
    }
    
    // Initial data fetch
    fetchCourseData();
    fetchEnrolledStudents();
    
    // Set up interval for real-time enrollment updates
    const enrollmentInterval = setInterval(() => {
      fetchEnrolledStudents(false); // Don't show loading indicator for automatic updates
    }, 30000); // Update every 30 seconds
    
    return () => {
      console.log('CourseView unmounting');
      clearInterval(enrollmentInterval);
    };
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      console.log('Fetching course data for courseId:', courseId);
      
      // Fetch course details with proper error handling
      let courseData = null;
      try {
        const courseResponse = await axios.get(`/api/courses/${courseId}`);
        courseData = courseResponse.data;
        console.log('Course data received:', courseData);
      } catch (courseError) {
        console.error('Error fetching course details from main API:', courseError);
        // Try teacher-specific endpoint as fallback
        try {
          const teacherCourseResponse = await axios.get(`/api/teacher/courses/${courseId}`);
          courseData = teacherCourseResponse.data;
          console.log('Teacher course data received:', courseData);
        } catch (teacherError) {
          console.error('Error fetching course from teacher API:', teacherError);
          throw new Error('Failed to fetch course data from both endpoints');
        }
      }
      
      // Set course data
      setCourse(courseData);
      
      // Fetch course videos with proper error handling
      try {
        const videosResponse = await axios.get(`/api/courses/${courseId}/videos`);
        const videosData = videosResponse.data;
        console.log('Course videos received:', videosData.length, 'videos');
        setVideos(videosData);
      } catch (videoError) {
        console.error('Error fetching course videos, trying alternative endpoint:', videoError);
        
        // Try teacher-specific endpoint as fallback
        try {
          const teacherVideosResponse = await axios.get(`/api/teacher/courses/${courseId}/videos`);
          const teacherVideosData = teacherVideosResponse.data;
          console.log('Teacher videos received:', teacherVideosData.length, 'videos');
          setVideos(teacherVideosData);
        } catch (teacherVideoError) {
          console.error('Error fetching videos from teacher API:', teacherVideoError);
          setVideos([]);
          message.warning('Could not load course videos. Please try again later.');
        }
      }
      
      // Fetch enrolled students
      await fetchEnrolledStudents(true);
      
    } catch (error) {
      console.error('Error fetching course data:', error);
      console.error('Error details:', error.response?.data || error.message);
      message.error('Failed to fetch course data. Please try again later.');
      
      // Clear course data on error to prevent showing stale data
      setCourse(null);
      setVideos([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setStudentsLoading(true);
      }
      console.log('Fetching enrolled students for course:', courseId);
      
      // Try fetching from the main API first
      let enrollmentsData = [];
      try {
        const response = await axios.get(`/api/courses/${courseId}/enrollments`);
        enrollmentsData = response.data;
        console.log('Enrolled students from main API:', enrollmentsData.length);
      } catch (mainError) {
        console.error('Error fetching from main API:', mainError);
        
        // Try teacher-specific endpoint as fallback
        try {
          const teacherResponse = await axios.get(`/api/teacher/courses/${courseId}/students`);
          enrollmentsData = teacherResponse.data;
          console.log('Enrolled students from teacher API:', enrollmentsData.length);
        } catch (teacherError) {
          console.error('Error fetching from teacher API:', teacherError);
          throw new Error('Failed to fetch enrollments from both endpoints');
        }
      }
      
      // Process enrollment data based on the structure returned from the API
      // This handles both standard and teacher API response formats
      const formattedStudents = enrollmentsData.map(enrollment => {
        // Extract the student data, handling differences in API response structure
        const student = enrollment.student || enrollment.User || enrollment;
        const userId = student?.id || enrollment.userId;
        const username = student?.username || 'Unknown User';
        const firstName = student?.firstName || student?.first_name || '';
        const lastName = student?.lastName || student?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || username;
        
        return {
          id: userId,
          userId: userId,
          enrollmentId: enrollment.id,
          username: username,
          fullName: fullName,
          profilePicture: student?.profileImage || student?.profilePicture,
          email: student?.email,
          enrollmentDate: enrollment.enrollmentDate || enrollment.createdAt,
          lastActivity: enrollment.lastActivityDate || enrollment.updatedAt,
          progress: enrollment.progress || 0,
          status: enrollment.status || 'enrolled',
          grade: enrollment.grade || calculateGrade(enrollment.progress)
        };
      });
      
      // Set state with the formatted data
      setEnrolledStudents(formattedStudents);
      setStudents(formattedStudents);
      
      // Update the course enrollment count if needed
      if (course && formattedStudents.length > 0 && course.enrollmentCount !== formattedStudents.length) {
        setCourse({
          ...course,
          enrollmentCount: formattedStudents.length
        });
      }
      
      console.log('Processed student data:', formattedStudents);
      
      } catch (error) {
      console.error('Error fetching enrolled students:', error);
      if (showLoading) {
        message.error('Failed to fetch enrolled students');
      }
    } finally {
      if (showLoading) {
        setStudentsLoading(false);
      }
    }
  };

  // Calculate student grade based on progress percentage
  const calculateGrade = (progress) => {
    if (progress === undefined || progress === null) return 'N/A';
    
    if (progress >= 90) return 'A';
    if (progress >= 80) return 'B';
    if (progress >= 70) return 'C';
    if (progress >= 60) return 'D';
    if (progress > 0) return 'F';
    return 'Not Started';
  };

  const handleEditCourse = () => {
    console.log('Navigating to edit course page for course ID:', courseId);
    window.location.href = `/teacher/courses/${courseId}/edit`;
  };

  const handleGradeStudent = (student) => {
    setSelectedStudent(student);
    setGradeValue(student.grade || calculateGrade(student.progress)); // Default to calculated grade
    setGradeModalVisible(true);
  };

  const submitGrade = async () => {
    try {
      if (!selectedStudent?.id || !courseId) {
        message.error('Missing student or course information');
        return;
      }
      
      await axios.post(`/api/teacher/courses/${courseId}/students/${selectedStudent.id}/grade`, {
        grade: gradeValue,
        enrollmentId: selectedStudent.enrollmentId
      });
      
      message.success(`Grade updated for ${selectedStudent.username}`);
      
      // Update the student in the local state
      setStudents(students.map(s => 
        s.id === selectedStudent.id ? { ...s, grade: gradeValue } : s
      ));
      
      setGradeModalVisible(false);
    } catch (error) {
      console.error('Error updating grade:', error);
      message.error('Failed to update grade');
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#52c41a';
    if (progress >= 50) return '#1890ff';
    return '#faad14';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewStudentProgress = async (student) => {
    try {
      setSelectedStudent(student);
      setStudentProgressLoading(true);
      setStudentProgressModalVisible(true);
      
      console.log('Fetching progress for student:', student.id, 'in course:', courseId);
      
      // Fetch student's progress for individual videos
      let progressData = [];
      try {
        const response = await axios.get(`/api/courses/${courseId}/students/${student.id}/progress`);
        progressData = response.data;
        console.log('Student progress data received:', progressData);
      } catch (mainError) {
        console.error('Error fetching from main API:', mainError);
        
        // Try teacher-specific endpoint as fallback
        try {
          const teacherResponse = await axios.get(`/api/teacher/courses/${courseId}/students/${student.id}/progress`);
          progressData = teacherResponse.data;
          console.log('Student progress from teacher API:', progressData);
        } catch (teacherError) {
          console.error('Error fetching from teacher API:', teacherError);
          message.warning('Could not fetch detailed progress data for this student');
          // Still continue with empty progress data
        }
      }
      
      // Map video progress data with course videos
      const videoProgressData = videos.map(video => {
        const progressRecord = progressData.find(p => p.videoId === video.id);
        return {
          ...video,
          progress: progressRecord?.progress || 0,
          lastWatched: progressRecord?.lastWatched || null,
          watchTime: progressRecord?.watchTime || 0,
          completed: progressRecord?.progress >= 100
        };
      });
      
      setStudentVideoProgress(videoProgressData);
    } catch (error) {
      console.error('Error in handleViewStudentProgress:', error);
      message.error('Failed to fetch student progress details');
    } finally {
      setStudentProgressLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <Empty
        description={
          <div>
            <div style={{ marginBottom: 16 }}>Course not found</div>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
              <div>Debug info:</div>
              <div>Course ID: {courseId || 'undefined'}</div>
              <div>Current path: {window.location.pathname}</div>
            </div>
          </div>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Space>
          <Button type="primary" onClick={() => window.location.href = '/teacher/home'}>
            Back to Dashboard
          </Button>
          <Button onClick={() => fetchCourseData()}>
            Retry Loading
          </Button>
        </Space>
      </Empty>
    );
  }

  // Add student progress modal
  const studentProgressModal = (
    <Modal
      title={`Progress for ${selectedStudent?.fullName || selectedStudent?.username || 'Student'}`}
      open={studentProgressModalVisible}
      onCancel={() => setStudentProgressModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setStudentProgressModalVisible(false)}>
          Close
        </Button>,
      ]}
      width={800}
      style={{ 
        top: 20,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ marginBottom: 24 }}>
        <Card 
          bordered={false}
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Overall Progress</Text>
                  <Progress 
                    percent={selectedStudent?.progress || 0} 
                    strokeColor={getProgressColor(selectedStudent?.progress || 0)}
                    status={selectedStudent?.progress === 100 ? 'success' : 'active'}
                    style={{ marginTop: 8 }}
                  />
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Current Grade</Text>
                  <div style={{ marginTop: 8 }}>
                    {selectedStudent?.grade ? (
                      <Tag 
                        color={
                          selectedStudent.grade === 'A' ? '#52c41a' :
                          selectedStudent.grade === 'B' ? '#87d068' :
                          selectedStudent.grade === 'C' ? '#faad14' :
                          selectedStudent.grade === 'D' ? '#fa8c16' :
                          selectedStudent.grade === 'F' ? '#f5222d' : '#108ee9'
                        } 
                        style={{ fontSize: 16, padding: '4px 12px' }}
                      >
                        {selectedStudent.grade}
                      </Tag>
                    ) : (
                      <Tag color="#d9d9d9" style={{ fontSize: 16, padding: '4px 12px' }}>Not Graded</Tag>
                    )}
                  </div>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Status</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag 
                      color={selectedStudent?.status === 'completed' ? 'green' : 'blue'} 
                      style={{ fontSize: 14, padding: '2px 10px', textTransform: 'capitalize' }}
                    >
                      {selectedStudent?.status || 'enrolled'}
                    </Tag>
                  </div>
                </div>
                
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Text type="secondary">Enrollment Date</Text>
                    <div style={{ marginTop: 4 }}>
                      {selectedStudent?.enrollmentDate ? 
                        formatDate(selectedStudent.enrollmentDate) : 'N/A'}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Last Activity</Text>
                    <div style={{ marginTop: 4 }}>
                      {selectedStudent?.lastActivity ? 
                        formatDate(selectedStudent.lastActivity) : 'N/A'}
                    </div>
                  </Col>
                </Row>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
      
      <Divider orientation="left">Video Progress</Divider>
      
      <Table
        dataSource={studentVideoProgress}
        rowKey="id"
        loading={studentProgressLoading}
        style={{ 
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
        columns={[
          {
            title: 'Video',
            dataIndex: 'title',
            key: 'title',
            render: (title, video, index) => (
              <Space align="start">
                <Avatar 
                  shape="square" 
                  size={48} 
                  src={video.thumbnail} 
                  icon={<PlayCircleOutlined />}
                  style={{ borderRadius: '4px' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>{index + 1}. {title}</div>
                  {video.description && (
                    <Paragraph 
                      ellipsis={{ rows: 1 }} 
                      type="secondary" 
                      style={{ marginBottom: 0, fontSize: '12px' }}
                    >
                      {video.description}
                    </Paragraph>
                  )}
                </div>
              </Space>
            )
          },
          {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            width: 100,
            render: duration => (
              <Text type="secondary">{duration || 'N/A'}</Text>
            )
          },
          {
            title: 'Watch Time',
            dataIndex: 'watchTime',
            key: 'watchTime',
            width: 120,
            render: (watchTime) => {
              // Convert seconds to a readable format
              if (!watchTime) return <Text type="secondary">Not viewed</Text>;
              
              const minutes = Math.floor(watchTime / 60);
              const seconds = watchTime % 60;
              return <Text>{minutes}m {seconds}s</Text>;
            }
          },
          {
            title: 'Last Watched',
            dataIndex: 'lastWatched',
            key: 'lastWatched',
            width: 130,
            render: date => (
              date ? (
                <Text>{formatDate(date)}</Text>
              ) : (
                <Text type="secondary">Not viewed</Text>
              )
            )
          },
          {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            width: 160,
            render: progress => (
              <div>
                <Progress
                  percent={progress}
                  size="small"
                  status={progress >= 100 ? 'success' : 'active'}
                  strokeColor={getProgressColor(progress)}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {progress === 100 ? 'Completed' : 
                   progress > 0 ? `${progress}% complete` : 'Not started'}
                </div>
              </div>
            )
          },
          {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_, video) => (
              <Tag 
                color={
                  video.progress >= 100 ? 'green' : 
                  video.progress > 0 ? 'blue' : 
                  'gray'
                }
                style={{ textTransform: 'capitalize' }}
              >
                {video.progress >= 100 ? 'Completed' : 
                 video.progress > 0 ? 'In Progress' : 
                 'Not Started'}
              </Tag>
            )
          }
        ]}
        pagination={false}
        summary={pageData => {
          const completedVideos = pageData.filter(v => v.progress >= 100).length;
          const totalVideos = pageData.length;
          const completionPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
          const totalWatchTime = pageData.reduce((total, video) => total + (video.watchTime || 0), 0);
          
          // Convert total watch time to hours, minutes, seconds
          const hours = Math.floor(totalWatchTime / 3600);
          const minutes = Math.floor((totalWatchTime % 3600) / 60);
          const seconds = totalWatchTime % 60;
          
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                <Row gutter={16} align="middle">
                  <Col span={14}>
                    <Text strong>
                      Completed {completedVideos} of {totalVideos} videos ({completionPercentage}%)
                    </Text>
                  </Col>
                  <Col span={10}>
                    <div>
                      <Text>Total watch time: </Text>
                      <Text strong>{hours > 0 ? `${hours}h ` : ''}{minutes}m {seconds}s</Text>
                    </div>
                    <Progress 
                      percent={completionPercentage} 
                      size="small" 
                      style={{ marginTop: 5 }}
                      strokeColor={getProgressColor(completionPercentage)}
                    />
                  </Col>
                </Row>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </Modal>
  );

  return (
    <Layout.Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card
        style={{ 
          marginBottom: 24, 
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}
        cover={
          <div style={{ 
            height: 240, 
            background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${course.thumbnail || 'https://via.placeholder.com/1200x400'}) center center / cover no-repeat`,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <div style={{ 
              padding: '32px 24px 24px'
            }}>
              <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>{course.title}</Title>
              <div style={{ display: 'flex', marginTop: 16, flexWrap: 'wrap', gap: '8px' }}>
                <Tag color="#108ee9" style={{ fontSize: '14px', padding: '2px 10px' }}>{course.category}</Tag>
                <Tag color="#87d068" style={{ fontSize: '14px', padding: '2px 10px' }}>{course.level}</Tag>
                <Tag color="#f50" style={{ fontSize: '14px', padding: '2px 10px' }}>{course.duration}</Tag>
                <Tag icon={<UsergroupAddOutlined />} color="#2db7f5" style={{ fontSize: '14px', padding: '2px 10px' }}>
                  {course.enrollmentCount || students.length} Students
                </Tag>
              </div>
            </div>
          </div>
        }
      >
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>{course.description}</Paragraph>
            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEditCourse}>
                Edit Course
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  size="small"
                  style={{ 
                    borderRadius: '6px',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                  }}
                >
                  <Statistic
                    title="Students"
                    value={course.enrollmentCount || students.length}
                    prefix={<UsergroupAddOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small"
                  style={{ 
                    borderRadius: '6px',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                  }}
                >
                  <Statistic
                    title="Rating"
                    value={course.rating || 0}
                    prefix={<StarOutlined />}
                    suffix="/ 5"
                    precision={1}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small"
                  style={{ 
                    borderRadius: '6px',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                  }}
                >
              <Statistic 
                    title="Videos"
                value={videos.length}
                    prefix={<VideoCameraOutlined />}
                    valueStyle={{ color: '#52c41a' }}
              />
                </Card>
          </Col>
              <Col span={12}>
                <Card 
                  size="small"
                  style={{ 
                    borderRadius: '6px',
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                  }}
                >
              <Statistic 
                    title="Created"
                    value={formatDate(course.createdAt)}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Tabs 
        defaultActiveKey="1" 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        size="large"
        style={{ 
          marginBottom: 24,
          background: '#fff',
          borderRadius: '8px',
          padding: '8px 8px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
        items={[
          {
            key: "1",
            label: <span><VideoCameraOutlined />Course Content</span>,
            children: (
              <div style={{ padding: '16px 0' }}>
                {videos.length === 0 && !loading ? (
                  <Empty 
                    description={
                      <div>
                        <p>No videos have been added to this course yet.</p>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => window.location.href = `/teacher/courses/${courseId}/videos/add`}
                        >
                          Add Video
                        </Button>
                      </div>
                    }
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <Title level={4} style={{ margin: 0 }}>Course Videos ({videos.length})</Title>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => window.location.href = `/teacher/courses/${courseId}/videos/add`}
                      >
                        Add Video
                      </Button>
                    </div>
                    
      <List
        itemLayout="horizontal"
        dataSource={videos}
                      loading={loading}
        renderItem={(video, index) => (
                        <List.Item
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.3s ease',
                            background: '#fff',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                          }}
                          actions={[
                            <Button 
                              type="primary" 
                              ghost
                              icon={<EditOutlined />}
                              onClick={() => window.location.href = `/teacher/courses/${courseId}/videos/${video.id}/edit`}
                            >
                              Edit
                            </Button>,
                            <Button 
                              type="default" 
                              icon={<PlayCircleOutlined />}
                              onClick={() => window.open(video.videoUrl || video.url, '_blank')}
                            >
                              Preview
                            </Button>
                          ]}
                        >
            <List.Item.Meta
              avatar={
                <Avatar 
                  shape="square" 
                                size={90} 
                                src={video.thumbnail || 'https://via.placeholder.com/160x90'} 
                                icon={<VideoCameraOutlined />}
                                style={{ borderRadius: '6px' }}
                              />
                            }
                            title={
                              <div style={{ fontSize: 16, fontWeight: 500 }}>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px' 
                                }}>
                                  <Text strong>{index+1}. {video.title}</Text>
                                  {video.featured && (
                                    <Tag color="#f50">Featured</Tag>
                                  )}
                                  {video.isPremium && (
                                    <Tag color="#722ed1">Premium</Tag>
                                  )}
                                </div>
                              </div>
                            }
                            description={
                              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <Space align="center">
                                  <Text type="secondary"><ClockCircleOutlined /> {video.duration || '10:00'}</Text>
                                  <Divider type="vertical" />
                                  <Text type="secondary">
                                    Added {formatDate(video.createdAt)}
                                  </Text>
                                </Space>
                                
                                {video.description && (
                                  <Paragraph ellipsis={{ rows: 2 }} type="secondary">
                                    {video.description}
                                  </Paragraph>
                                )}
                                
                                <Row gutter={16}>
                                  <Col>
                                    <Statistic 
                                      value={video.viewCount || 0} 
                                      title="Views" 
                                      valueStyle={{ fontSize: '14px' }} 
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic 
                                      value={video.completionCount || 0} 
                                      title="Completions" 
                                      valueStyle={{ fontSize: '14px' }} 
                                    />
                                  </Col>
                                  <Col>
                                    <Statistic 
                                      value={video.averageRating || 0} 
                                      title="Rating" 
                                      valueStyle={{ fontSize: '14px' }} 
                                      suffix={`/5`}
                                      precision={1}
                                    />
                                  </Col>
                                </Row>
            </Space>
                            }
                          />
          </List.Item>
        )}
                      locale={{
                        emptyText: (
                          <Empty 
                            description="No videos available" 
                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          />
                        )
                      }}
                    />
                  </>
                )}
              </div>
            )
          },
          {
            key: "2",
            label: <span><UsergroupAddOutlined />Students</span>,
            children: (
              <div style={{ padding: '16px 0' }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card 
                      size="small"
                      style={{ 
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                      }}
                    >
                      <Statistic
                        title="Total Enrolled"
                        value={students.length}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card 
                      size="small"
                      style={{ 
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                      }}
                    >
                      <Statistic
                        title="Average Progress"
                        value={students.reduce((acc, student) => acc + student.progress, 0) / Math.max(students.length, 1)}
                        suffix="%"
                        precision={0}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card 
                      size="small"
                      style={{ 
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                      }}
                    >
                      <Statistic
                        title="Completed Course"
                        value={students.filter(s => s.progress === 100).length}
                        suffix={`/${students.length}`}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Table
                  dataSource={students}
                  rowKey="id"
                  loading={studentsLoading}
                  style={{ 
                    background: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  columns={[
      {
        title: 'Student',
        dataIndex: 'username',
        key: 'username',
                      render: (_, student) => (
          <Space>
                          <Avatar 
                            src={student.profilePicture} 
                            icon={!student.profilePicture && <UserOutlined />}
                            style={{ backgroundColor: !student.profilePicture ? '#1890ff' : undefined }}
                          />
                          <span>{student.fullName || student.username}</span>
          </Space>
        ),
      },
      {
                      title: 'Enrollment Date',
                      dataIndex: 'enrollmentDate',
                      key: 'enrollmentDate',
                      render: date => formatDate(date),
                      sorter: (a, b) => new Date(a.enrollmentDate) - new Date(b.enrollmentDate),
                    },
                    {
                      title: 'Last Activity',
                      dataIndex: 'lastActivity',
                      key: 'lastActivity',
                      render: date => date ? formatDate(date) : 'N/A',
                      sorter: (a, b) => new Date(a.lastActivity || 0) - new Date(b.lastActivity || 0),
                      defaultSortOrder: 'descend',
      },
      {
        title: 'Progress',
                      dataIndex: 'progress',
        key: 'progress',
                      render: (progress, student) => (
                        <div>
                          <Progress 
                            percent={progress} 
                            strokeColor={getProgressColor(progress)} 
                            size="small" 
                            status={progress === 100 ? 'success' : 'active'}
                          />
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {progress === 100 ? 'Completed' : 
                             progress > 0 ? `${progress}% complete` : 'Not started'}
                          </div>
                        </div>
                      ),
                      sorter: (a, b) => a.progress - b.progress,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: status => {
                        let color = 'blue';
                        if (status === 'completed') color = 'green';
                        if (status === 'dropped') color = 'red';
                        
                        return (
                          <Tag color={color} style={{ textTransform: 'capitalize' }}>
                            {status || 'enrolled'}
                          </Tag>
                        );
                      },
                      filters: [
                        { text: 'Enrolled', value: 'enrolled' },
                        { text: 'Completed', value: 'completed' },
                        { text: 'Dropped', value: 'dropped' },
                      ],
                      onFilter: (value, record) => record.status === value,
                    },
                    {
                      title: 'Current Grade',
                      dataIndex: 'grade',
                      key: 'grade',
                      render: (grade, student) => {
                        // Determine tag color based on grade
                        let color = '#108ee9';
                        if (grade === 'A') color = '#52c41a';
                        if (grade === 'B') color = '#87d068';
                        if (grade === 'C') color = '#faad14';
                        if (grade === 'D') color = '#fa8c16';
                        if (grade === 'F') color = '#f5222d';
                        
                        return grade ? (
                          <Tag color={color} style={{ fontSize: 14, padding: '0 8px' }}>
                            {grade}
                          </Tag>
                        ) : (
                          <Text type="secondary">Not graded</Text>
                        );
                      },
                      filters: [
                        { text: 'A', value: 'A' },
                        { text: 'B', value: 'B' },
                        { text: 'C', value: 'C' },
                        { text: 'D', value: 'D' },
                        { text: 'F', value: 'F' },
                        { text: 'Not Started', value: 'Not Started' },
                      ],
                      onFilter: (value, record) => record.grade === value,
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, student) => (
                        <Space>
                          <Button 
                            type="primary"
                            size="small"
                            onClick={() => handleGradeStudent(student)}
                          >
                            Assign Grade
                          </Button>
          <Button 
                            type="default"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewStudentProgress(student)}
                          >
                            View Progress
          </Button>
                        </Space>
                      ),
                    },
                  ]}
                  pagination={{ pageSize: 10 }}
                  summary={pageData => {
                    const totalStudents = pageData.length;
                    const completedStudents = pageData.filter(s => s.progress === 100).length;
                    const avgProgress = Math.round(
                      pageData.reduce((acc, student) => acc + (student.progress || 0), 0) / Math.max(totalStudents, 1)
                    );
    
    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3}>
                            <Text strong>Summary: {totalStudents} students ({completedStudents} completed)</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} colSpan={4}>
                            <Text strong>Average Progress: {avgProgress}%</Text>
                            <Progress percent={avgProgress} size="small" style={{ marginTop: 5 }} />
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />
              </div>
            )
          }
        ]}
      />

      <Modal
        title={`Assign Grade for ${selectedStudent?.fullName || selectedStudent?.username || 'Student'}`}
        open={gradeModalVisible}
        onOk={submitGrade}
        onCancel={() => setGradeModalVisible(false)}
        okText="Save Grade"
        okButtonProps={{ style: { backgroundColor: '#1890ff' } }}
        style={{ borderRadius: '8px', overflow: 'hidden' }}
        bodyStyle={{ padding: '24px' }}
      >
              <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Grade should reflect student's performance and progress in the course.
            Current progress: {selectedStudent?.progress || 0}%
          </Text>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">Current Progress: </Text>
                <Progress 
            percent={selectedStudent?.progress || 0}
            strokeColor={getProgressColor(selectedStudent?.progress || 0)}
            style={{ marginTop: 8 }}
                />
              </div>
              
              <div>
          <Input
            addonBefore="Grade"
            value={gradeValue}
            onChange={e => setGradeValue(e.target.value)}
            placeholder="Enter grade (A, B, C, D, F)"
            size="large"
            style={{ borderRadius: '4px' }}
                />
              </div>
      </Modal>
      
      {/* Student Progress Modal */}
      {studentProgressModal}
    </Layout.Content>
  );
};

export default CourseView; 