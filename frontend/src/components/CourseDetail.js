import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, List, Spin, Alert, Tabs, Tag, Space, Divider, message } from 'antd';
import { PlayCircleOutlined, BookOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import VideoPlayer from './VideoPlayer';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [courseProgress, setCourseProgress] = useState(0);

  useEffect(() => {
    if (courseId && courseId !== 'undefined') {
      fetchCourse();
      checkEnrollment();
    } else {
      setError('Invalid course ID');
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      console.log('Fetching course with ID:', courseId);
      
      // Fetch course details
      const response = await axios.get(`/api/courses/${courseId}`);
      console.log('Course data:', response.data);
      setCourse(response.data);
      
      // If videos not included in course data, fetch them separately
      if (!response.data.videos || response.data.videos.length === 0) {
        try {
          console.log('Fetching videos for course:', courseId);
          const videosResponse = await axios.get(`/api/courses/${courseId}/videos`);
          console.log('Course videos:', videosResponse.data);
          
          // Update course with videos
          setCourse(prevCourse => ({
            ...prevCourse,
            videos: videosResponse.data
          }));
          
          // Set the first video as selected if available
          if (videosResponse.data && videosResponse.data.length > 0) {
            setSelectedVideo(videosResponse.data[0]);
          }
        } catch (videoError) {
          console.error('Error fetching course videos:', videoError);
          // Continue with course display even if videos fail to load
        }
      } else {
        // Set the first video as selected if available
        if (response.data.videos && response.data.videos.length > 0) {
          setSelectedVideo(response.data.videos[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await axios.get('/api/courses/user/enrolled');
      const enrolledCourses = response.data;
      const match = enrolledCourses.find(
        (c) => c.id === parseInt(courseId, 10) || String(c.id) === String(courseId)
      );
      setEnrolled(!!match);
      if (match) setCourseProgress(match.progress || 0);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      console.log(`Enrolling in course: ${courseId}`);
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please log in to enroll in this course');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }
      
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.post(`/api/courses/${courseId}/enroll`);
      console.log('Enrollment response:', response.data);
      
      message.success('Successfully enrolled in course!');
      setEnrolled(true);
      setActiveTab('2');
      localStorage.setItem('refreshMyCourses', 'true');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again.');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
      } else if (error.response?.status === 400 && error.response?.data?.message === 'Already enrolled in this course') {
        message.info('You are already enrolled in this course');
        setEnrolled(true);
        setActiveTab('2');
      } else {
        message.error('Failed to enroll in course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  // Update the getImageUrl function to use the default thumbnail from backend/uploads/courses/thumbnails instead of the hardcoded course paths
  const getImageUrl = (imageUrl) => {
    console.log('Processing course thumbnail:', imageUrl);
    
    if (!imageUrl) return 'https://via.placeholder.com/800x400?text=Course+Image';
    
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

  const handleUnenroll = async () => {
    try {
      setEnrolling(true); // Reuse enrolling state for unenroll operation
      console.log(`Unenrolling from course: ${courseId}`);
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Please log in to manage your courses');
        navigate('/login');
        return;
      }
      
      // Ensure token is in the headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.delete(`/api/courses/${courseId}/enroll`);
      console.log('Unenroll response:', response.data);
      
      message.success('Successfully unenrolled from course');
      setEnrolled(false);
      
      // Force refresh the My Courses page next time it's loaded
      localStorage.setItem('refreshMyCourses', 'true');
      
      // Redirect to My Courses page
      navigate('/my-courses');
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please log in again');
        navigate('/login');
      } else if (error.response?.status === 404) {
        // If enrollment not found, consider user as not enrolled
        setEnrolled(false);
        message.info('You were not enrolled in this course');
        navigate('/courses');
      } else {
        message.error('Failed to unenroll from course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate('/home')}>
            Return to Home
          </Button>
        }
      />
    );
  }

  if (!course) {
    return (
      <Alert
        message="Course Not Found"
        description="The requested course could not be found."
        type="warning"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate('/home')}>
            Return to Home
          </Button>
        }
      />
    );
  }

  return (
    <div className="course-detail-container">
      <div style={{ 
        height: '300px', 
        backgroundImage: `url(${getImageUrl(course.thumbnail || course.imageUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        marginBottom: '24px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '20px',
          color: 'white'
        }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>{course.title}</Title>
          <div style={{ marginTop: '8px' }}>
            {course.instructor && (
              <span style={{ marginRight: '16px' }}>
                <UserOutlined /> {typeof course.instructor === 'object' ? course.instructor.username : course.instructor}
              </span>
            )}
            {course.level && (
              <Tag color={course.level === 'Beginner' ? 'green' : course.level === 'Intermediate' ? 'orange' : 'red'}>
                {course.level}
              </Tag>
            )}
          </div>
        </div>
      </div>

      <div className="course-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="1">
            <div className="course-overview">
              <Title level={3}>About this course</Title>
              <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>{course.description}</Paragraph>
              
              <Divider />
              
              <div className="course-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {course.instructor && (
                  <div className="info-item">
                    <Title level={5}>Instructor</Title>
                    <div>
                      <UserOutlined style={{ marginRight: '8px' }} />
                      {typeof course.instructor === 'object' ? course.instructor.username : course.instructor}
                    </div>
                  </div>
                )}
                
                {course.department && (
                  <div className="info-item">
                    <Title level={5}>Department</Title>
                    <div>{course.department}</div>
                  </div>
                )}
                
                {course.level && (
                  <div className="info-item">
                    <Title level={5}>Level</Title>
                    <div>
                      <Tag color={course.level.toLowerCase() === 'beginner' ? 'green' : course.level.toLowerCase() === 'intermediate' ? 'orange' : 'red'}>
                        {course.level}
                      </Tag>
                    </div>
                  </div>
                )}
                
                {course.duration && (
                  <div className="info-item">
                    <Title level={5}>Duration</Title>
                    <div>
                      <ClockCircleOutlined style={{ marginRight: '8px' }} />
                      {course.duration}
                    </div>
                  </div>
                )}
                
                {course.totalVideos !== undefined && (
                  <div className="info-item">
                    <Title level={5}>Total Videos</Title>
                    <div>
                      <PlayCircleOutlined style={{ marginRight: '8px' }} />
                      {course.totalVideos || (course.videos && course.videos.length) || 0}
                    </div>
                  </div>
                )}

                {enrolled && (
                  <div className="info-item">
                    <Title level={5}>Your progress</Title>
                    <div>{courseProgress}%</div>
                  </div>
                )}
                
                {course.totalDuration !== undefined && (
                  <div className="info-item">
                    <Title level={5}>Total Duration</Title>
                    <div>
                      <ClockCircleOutlined style={{ marginRight: '8px' }} />
                      {course.totalDuration ? `${Math.floor(course.totalDuration / 60)} minutes` : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
              
              <Divider />
            
            {!enrolled ? (
              <Button 
                type="primary" 
                size="large" 
                onClick={handleEnroll}
                loading={enrolling}
                style={{ marginTop: 20 }}
              >
                Enroll Now
              </Button>
            ) : (
              <Space direction="horizontal" style={{ marginTop: 20 }}>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={() => setActiveTab('2')}
                >
                  {courseProgress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Button>
                <Button 
                  type="default" 
                  danger 
                  size="large" 
                  onClick={handleUnenroll}
                  loading={enrolling}
                >
                  Unenroll
                </Button>
              </Space>
            )}
            </div>
          </TabPane>
          
          {(course.contentType === 'video' || course.contentType === 'mixed' || !course.contentType) && (
            <TabPane tab="Videos" key="2">
              {!enrolled ? (
                <Alert
                  type="info"
                  showIcon
                  message="Enroll to watch videos"
                  description="Join this course to unlock the video player and track your progress toward 100%."
                  action={
                    <Button type="primary" loading={enrolling} onClick={handleEnroll}>
                      Enroll Now
                    </Button>
                  }
                />
              ) : (
                <div className="video-container">
                  <div className="video-player">
                    {selectedVideo ? (
                      <VideoPlayer
                        videoUrl={selectedVideo.videoUrl}
                        courseId={courseId}
                        videoId={selectedVideo.id}
                        enrolled={enrolled}
                        onProgressUpdate={(data) => {
                          if (data?.progress != null) setCourseProgress(data.progress);
                        }}
                      />
                    ) : (
                      <div className="no-video-placeholder">
                        <PlayCircleOutlined style={{ fontSize: 48 }} />
                        <p>Select a video to play</p>
                      </div>
                    )}
                    
                    {selectedVideo && (
                      <div className="video-info">
                        <Title level={4}>{selectedVideo.title}</Title>
                        <Paragraph>{selectedVideo.description}</Paragraph>
                        <Paragraph type="secondary">Course progress: {courseProgress}%</Paragraph>
                      </div>
                    )}
                  </div>
                  
                  <div className="video-list">
                    <List
                      itemLayout="horizontal"
                      dataSource={course.videos || []}
                      locale={{ emptyText: 'No videos available for this course' }}
                      renderItem={(video) => {
                        const secs = Number(video.duration) || 0;
                        const mins = Math.floor(secs / 60);
                        const rem = secs % 60;
                        const durationLabel = secs
                          ? `Duration: ${mins}:${rem < 10 ? '0' : ''}${rem}`
                          : 'Duration: —';
                        return (
                          <List.Item 
                            onClick={() => handleVideoSelect(video)}
                            className={selectedVideo && selectedVideo.id === video.id ? 'selected-video' : ''}
                            style={{ cursor: 'pointer' }}
                          >
                            <List.Item.Meta
                              avatar={<PlayCircleOutlined style={{ fontSize: 24 }} />}
                              title={video.title}
                              description={durationLabel}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            </TabPane>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default CourseDetail;