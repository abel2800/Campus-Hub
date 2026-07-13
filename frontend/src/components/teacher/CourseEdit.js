import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Spin, 
  Empty, 
  Upload, 
  Select,
  InputNumber,
  Space,
  Divider,
  List,
  Avatar,
  Modal 
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const PageContainer = styled.div`
  padding: 24px;
`;

const ThumbnailUploader = styled(Upload)`
  .ant-upload-select-picture-card {
    width: 100%;
    height: 200px;
  }
`;

const CourseEdit = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const contentTypes = [
    { value: 'video', label: 'Video Based Course' },
    { value: 'document', label: 'Document Based Course' },
    { value: 'mixed', label: 'Mixed Content' }
  ];

  const fetchCourseData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch course details
      const courseResponse = await api.get(`/api/teacher/courses/${courseId}`);
      const course = courseResponse.data;
      setCourseData(course);
      
      // Set thumbnail preview if one exists
      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }
      
      // Set form values
      form.setFieldsValue({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        contentType: course.contentType || 'video' // Default to video if not specified
      });
      
      // Fetch course videos
      const videosResponse = await api.get(`/api/teacher/courses/${courseId}/videos`);
      setVideos(videosResponse.data);
      
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data');
      message.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // Get the uploaded file
      const file = info.file.originFileObj;
      setThumbnailFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setThumbnailPreview(reader.result);
      };
    }
  };

  const handleDeleteVideo = (videoId) => {
    confirm({
      title: 'Are you sure you want to delete this video?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone. Students will no longer have access to this video.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/api/teacher/courses/${courseId}/videos/${videoId}`);
          message.success('Video deleted successfully');
          // Update videos list
          setVideos(videos.filter(v => v.id !== videoId));
        } catch (error) {
          console.error('Error deleting video:', error);
          message.error('Failed to delete video');
        }
      }
    });
  };

  const handleEditVideo = (videoId) => {
    // For now, just show a message
    message.info('Video editing feature coming soon');
  };

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      
      // Create form data for course update
      const formData = new FormData();
      
      // Append all form values
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('level', values.level);
      formData.append('duration', values.duration);
      formData.append('contentType', values.contentType);
      
      // Append thumbnail if changed
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Update the course
      await api.put(`/api/teacher/courses/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success('Course updated successfully');
      
      // Navigate back to course view
      navigate(`/teacher/courses/${courseId}`);
      
    } catch (error) {
      console.error('Error updating course:', error);
      message.error('Failed to update course: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading course data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Empty
        description={
          <Space direction="vertical">
            <Text type="danger">{error}</Text>
            <Button type="primary" onClick={fetchCourseData}>Retry</Button>
          </Space>
        }
      />
    );
  }

  return (
    <PageContainer>
      <Card title={<Title level={2}>Edit Course</Title>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Title level={4}>Course Information</Title>
          
          <Form.Item
            name="title"
            label="Course Title"
            rules={[{ required: true, message: 'Please enter course title' }]}
          >
            <Input placeholder="Enter course title" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Course Description"
            rules={[{ required: true, message: 'Please enter course description' }]}
          >
            <TextArea 
              placeholder="Enter course description" 
              rows={4} 
            />
          </Form.Item>
          
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Select category">
                <Option value="programming">Programming</Option>
                <Option value="design">Design</Option>
                <Option value="business">Business</Option>
                <Option value="marketing">Marketing</Option>
                <Option value="photography">Photography</Option>
                <Option value="music">Music</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="level"
              label="Level"
              rules={[{ required: true, message: 'Please select a level' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Select level">
                <Option value="beginner">Beginner</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="advanced">Advanced</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="contentType"
              label="Content Type"
              rules={[{ required: true, message: 'Please select content type' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Select content type">
                {contentTypes.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="duration"
              label="Duration (in minutes)"
              rules={[{ required: true, message: 'Please enter duration' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 120" />
            </Form.Item>
          </Space>
          
          <Form.Item
            label="Course Thumbnail"
            tooltip="Upload a new thumbnail image to replace the current one"
          >
            <ThumbnailUploader
              name="thumbnail"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleThumbnailChange}
            >
              {thumbnailPreview ? (
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <UploadOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 8 }}>Upload Thumbnail</div>
                </div>
              )}
            </ThumbnailUploader>
            <Text type="secondary">Recommended size: 1280x720 pixels</Text>
          </Form.Item>
          
          <Divider />
          
          <Title level={4}>Course Content</Title>
          
          {videos.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={videos}
              renderItem={(video, index) => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEditVideo(video.id)}
                    >
                      Edit
                    </Button>,
                    <Button 
                      type="text" 
                      danger
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      Delete
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        shape="square" 
                        size={64} 
                        icon={<PlayCircleOutlined />} 
                        src={video.thumbnail}
                      />
                    }
                    title={`${index + 1}. ${video.title}`}
                    description={video.description}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No videos in this course yet" />
          )}
          
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              if (form.getFieldValue('contentType') === 'document') {
                message.info('This is a document-based course. Please change the content type to add videos.');
              } else {
                navigate(`/teacher/courses/${courseId}/videos`);
              }
            }}
          >
            Add New Video
          </Button>
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Update Course
              </Button>
              <Button onClick={() => navigate(`/teacher/courses/${courseId}`)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default CourseEdit; 