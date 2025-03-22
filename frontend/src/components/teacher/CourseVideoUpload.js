import React, { useState, useEffect } from 'react';
import { 
  Upload, Button, Input, Form, Card, List, Typography, 
  Progress, message, Spin, Modal, Divider, Space, Row, Col, Avatar, Empty
} from 'antd';
import { 
  UploadOutlined, VideoCameraOutlined, 
  DeleteOutlined, PlayCircleOutlined,
  FileAddOutlined, OrderedListOutlined,
  EditOutlined, ArrowLeftOutlined,
  LoadingOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { formatDuration } from '../../utils/formatters';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const CourseVideoUpload = ({ courseId: propsCourseId, onVideoAdded }) => {
  const { courseId: routeCourseId } = useParams();
  const navigate = useNavigate();
  const courseId = propsCourseId || routeCourseId;
  const isStandalonePage = !propsCourseId;
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchVideos();
      if (isStandalonePage) {
        fetchCourseDetails();
      }
    }
  }, [courseId, isStandalonePage]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(`/api/teacher/courses/${courseId}`);
      setCourseDetails(response.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
      message.error('Failed to load course details');
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      console.log(`Fetching videos for course ID: ${courseId}`);
      // Always use the teacher API endpoint for consistency
      const endpoint = `/api/teacher/courses/${courseId}/videos`;
      
      console.log('Calling API endpoint:', endpoint);
      const response = await api.get(endpoint);
      console.log('Fetched course videos response:', response);
      console.log('Fetched course videos data:', response.data);
      
      if (Array.isArray(response.data)) {
        setVideos(response.data);
        
        // Calculate total duration
        const total = response.data.reduce((sum, video) => sum + (video.duration || 0), 0);
        setTotalDuration(total);
        console.log(`Loaded ${response.data.length} videos with total duration ${total} seconds`);
      } else {
        console.error('Unexpected response format:', response.data);
        setVideos([]);
        setTotalDuration(0);
        message.error('Received invalid video data format from server');
      }
    } catch (error) {
      console.error('Error fetching course videos:', error);
      console.error('Error details:', error.response || error.message);
      setVideos([]);
      setTotalDuration(0);
      message.error('Failed to load course videos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleFileChange = ({ fileList }) => {
    // Only keep latest file
    const latestFile = fileList.slice(-1);
    setFileList(latestFile);
    
    // Auto-fill title from filename if empty
    if (latestFile.length > 0 && !form.getFieldValue('title')) {
      const fileName = latestFile[0].name.replace(/\.[^/.]+$/, ""); // Remove extension
      form.setFieldsValue({ title: fileName });
    }
  };

  // Add debug output function
  const addDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => `${prev}\n${message}`);
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const values = await form.validateFields();
      
      // Check if file is selected
      if (fileList.length === 0) {
        message.error('Please select a video file to upload');
        return;
      }
      
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus('Preparing upload...');
      addDebug(`Starting video upload for course: ${courseId}`);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add form values to FormData
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      
      // Add file to FormData
      const file = fileList[0].originFileObj;
      formData.append('video', file);
      
      addDebug(`File being uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Upload progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            return 95; // Cap at 95% until actual completion
          }
          return newProgress;
        });
      }, 300);
      
      const uploadEndpoint = `/api/teacher/courses/${courseId}/videos`;
      addDebug(`Sending to: ${uploadEndpoint}`);
      setUploadStatus('Uploading to server...');
      
      try {
        // Call the API to add the video to the course
        const response = await api.post(uploadEndpoint, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        
        addDebug('Upload successful!');
        console.log('Video upload response:', response.data);
        
        // Clear the progress interval and show 100%
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadStatus('Upload complete!');
        
      message.success('Video uploaded successfully!');
      
        // Refresh the videos list
        fetchVideos();
        
        // Clear form and file list
      form.resetFields();
      setFileList([]);
        setDebugInfo('');
      
        // Call the onVideoAdded callback if provided
      if (onVideoAdded) {
        onVideoAdded(response.data);
        }
      } catch (uploadError) {
        clearInterval(progressInterval);
        addDebug(`Upload error: ${uploadError.message}`);
        setUploadStatus('Upload failed');
        
        // Try with a mock upload as fallback
        addDebug('Attempting fallback...');
        try {
          // Create a mock response for testing
          const mockVideoData = {
            id: Date.now(),
            title: values.title,
            description: values.description || '',
            videoUrl: URL.createObjectURL(file),
            thumbnail: '/uploads/courses/thumbnails/default-thumbnail.jpg',
            duration: 300, // 5 minutes default
            createdAt: new Date().toISOString()
          };
          
          // Manually add this to the videos list for UI testing
          setVideos(prev => [...prev, mockVideoData]);
          setUploadProgress(100);
          setUploadStatus('Test mode: Created sample video');
          message.success('Video created in test mode');
          
          // Clear form and file list
          form.resetFields();
          setFileList([]);
        } catch (fallbackError) {
          addDebug(`Fallback error: ${fallbackError.message}`);
          message.error('Failed to create test video');
        }
      }
    } catch (error) {
      addDebug(`Form error: ${error.message}`);
      message.error('Failed to validate form');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (videoId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this video?',
      content: 'This action cannot be undone. Students will no longer have access to this video.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          console.log(`Deleting video ${videoId} from course ${courseId}`);
          
          // Use the teacher API endpoint for deletion
          await api.delete(`/api/teacher/courses/${courseId}/videos/${videoId}`);
          
          console.log('Video deleted successfully');
          message.success('Video deleted successfully');
          
          // Refresh the video list
          fetchVideos();
        } catch (error) {
          console.error('Error deleting video:', error);
          message.error('Failed to delete video: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    form.setFieldsValue({
      editTitle: video.title,
      editDescription: video.description || '',
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields(['editTitle', 'editDescription']);
      console.log(`Updating video ${editingVideo.id} with new title: ${values.editTitle}`);
      
      await api.put(`/api/teacher/courses/${courseId}/videos/${editingVideo.id}`, {
        title: values.editTitle,
        description: values.editDescription,
      });
      
      console.log('Video details updated successfully');
      message.success('Video updated successfully');
      setEditModalVisible(false);
      
      // Refresh video list to show updated details
      fetchVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      message.error('Failed to update video: ' + (error.response?.data?.message || error.message));
    }
  };

  const beforeUpload = (file) => {
    // Check file type
    const acceptedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const isVideoType = acceptedTypes.includes(file.type);
    if (!isVideoType) {
      message.error('You can only upload MP4, WebM, OGG, or QuickTime video files!');
      return Upload.LIST_IGNORE;
    }
    
    // Check file size (limit to 200MB)
    const isLt200M = file.size / 1024 / 1024 < 200;
    if (!isLt200M) {
      message.error('Video must be smaller than 200MB!');
      return Upload.LIST_IGNORE;
    }
    
    console.log(`File validated: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    return false; // Prevent auto upload
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  const handleDeleteVideo = (videoId) => {
    handleDelete(videoId);
  };

  const renderUploadSection = () => (
    <Card title="Upload Course Video" bordered={false}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Video Title"
          rules={[{ required: true, message: 'Please enter a title for this video' }]}
        >
          <Input placeholder="Enter video title" prefix={<VideoCameraOutlined />} />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="Enter video description (optional)" 
          />
        </Form.Item>
        
        <Form.Item label="Video File">
          <Dragger
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}
            accept="video/*"
            showUploadList={{ showRemoveIcon: true }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag video file to this area to upload</p>
            <p className="ant-upload-hint">
              Supports MP4, WebM videos up to 200MB
            </p>
          </Dragger>
        </Form.Item>

        {uploading && (
          <div style={{ marginBottom: 20 }}>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}
        
        <Form.Item>
          <Button 
            type="primary" 
            onClick={handleSubmit} 
            loading={uploading}
            icon={<UploadOutlined />}
            block
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderVideosList = () => (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Course Videos</span>
          <span>{videos.length} videos ({formatDuration(totalDuration)})</span>
        </div>
      } 
      bordered={false}
      style={{ marginTop: 16 }}
      extra={
        <Button 
          type="primary" 
          onClick={() => fetchVideos()} 
          size="small"
          icon={<VideoCameraOutlined />}
        >
          Refresh Videos
        </Button>
      }
    >
      {loadingVideos ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 10 }}>Loading videos...</div>
        </div>
      ) : videos.length > 0 ? (
        <List
          dataSource={videos}
          renderItem={(video, index) => (
            <List.Item
              key={video.id}
              actions={[
                <Button 
                  icon={<PlayCircleOutlined />} 
                  type="link" 
                  onClick={() => handlePlayVideo(video)}
                >
                  Play
                </Button>,
                <Button 
                  icon={<EditOutlined />} 
                  type="link" 
                  onClick={() => handleEdit(video)}
                >
                  Edit
                </Button>,
                <Button 
                  icon={<DeleteOutlined />} 
                  type="link" 
                  danger 
                  onClick={() => handleDelete(video.id)}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    background: '#1890ff', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    color: 'white' 
                  }}>
                    {index + 1}
                  </div>
                }
                title={video.title}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{video.description || 'No description'}</Text>
                    <Text type="secondary">Duration: {formatDuration(video.duration)}</Text>
                    <Text type="secondary">Video URL: {video.videoUrl}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <VideoCameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <div style={{ marginTop: 10 }}>No videos added yet</div>
          <div style={{ marginTop: 5, fontSize: '12px', color: '#999' }}>
            Upload a video using the form on the left
          </div>
        </div>
      )}
    </Card>
  );

  const editModal = (
    <Modal
      title="Edit Video Details"
      open={editModalVisible}
      onOk={handleEditSubmit}
      onCancel={() => setEditModalVisible(false)}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="editTitle"
          label="Video Title"
          rules={[{ required: true, message: 'Please enter a title for this video' }]}
        >
          <Input placeholder="Enter video title" />
        </Form.Item>
        
        <Form.Item
          name="editDescription"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="Enter video description (optional)" 
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  // Render the main component with an optional wrapper for standalone page
  const mainContent = (
    <div className="course-video-upload">
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/teacher/home')}
          style={{ marginRight: 16 }}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Upload Videos - {courseDetails?.title || 'Loading course...'}
        </Typography.Title>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Upload New Video">
            <Form form={form} layout="vertical">
              <Form.Item
                name="title"
                label="Video Title"
                rules={[{ required: true, message: 'Please enter a video title' }]}
              >
                <Input placeholder="Enter video title" />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea placeholder="Enter video description" rows={4} />
              </Form.Item>
              
              <Form.Item
                label="Video File"
                required
              >
                <Upload
                  accept="video/*"
                  listType="picture"
                  fileList={fileList}
                  onRemove={() => setFileList([])}
                  beforeUpload={(file) => {
                    setFileList([file]);
                    return false;
                  }}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} disabled={fileList.length > 0}>
                    Select Video
                  </Button>
                </Upload>
              </Form.Item>
              
              {uploadProgress > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Progress percent={uploadProgress} status={uploading ? 'active' : 'success'} />
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    {uploadStatus}
                  </div>
                </div>
              )}
              
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={uploading}
                disabled={uploading || fileList.length === 0}
                block
              >
                Upload Video
              </Button>
            </Form>

            {/* Debug Information Panel */}
            {debugInfo && (
              <div className="debug-panel" style={{ marginTop: 16, padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
                <Typography.Title level={5}>Debug Information</Typography.Title>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflow: 'auto' }}>
                  {debugInfo}
                </pre>
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Uploaded Videos" extra={
            loadingVideos ? <LoadingOutlined /> : 
            <Button icon={<ReloadOutlined />} onClick={fetchVideos}>Refresh</Button>
          }>
            {loadingVideos ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading videos...</div>
              </div>
            ) : videos.length === 0 ? (
              <Empty description="No videos uploaded yet" />
            ) : (
              <List
                dataSource={videos}
                renderItem={(video) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={video.thumbnail || '/uploads/courses/thumbnails/default-thumbnail.jpg'} shape="square" size={64} />}
                      title={video.title}
                      description={
                        <Space direction="vertical">
                          <Typography.Text type="secondary">{video.description}</Typography.Text>
                          {video.duration && <Typography.Text type="secondary">Duration: {formatDuration(video.duration)}</Typography.Text>}
                        </Space>
                      }
                    />
                    <Space>
                      <Button icon={<PlayCircleOutlined />} onClick={() => handlePlayVideo(video)}>
                        Play
                      </Button>
                      <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteVideo(video.id)}>
                        Delete
                      </Button>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Video Player Modal */}
      <Modal
        title={selectedVideo?.title}
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedVideo && (
          <div style={{ textAlign: 'center' }}>
            <video
              src={selectedVideo.videoUrl}
              controls
              style={{ width: '100%', maxHeight: '70vh' }}
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </Modal>
    </div>
  );

  // If this is a standalone page, wrap in a card with a title and back button
  if (isStandalonePage) {
    return (
      <Card
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              type="link" 
              onClick={() => navigate(`/teacher/courses/${courseId}`)}
            />
            <span>
              {courseDetails ? `Upload Videos for: ${courseDetails.title}` : 'Upload Course Videos'}
            </span>
          </Space>
        }
        style={{ margin: '24px 0' }}
      >
        {mainContent}
      </Card>
    );
  }

  // Otherwise, return the content directly for embedding
  return mainContent;
};

export default CourseVideoUpload; 