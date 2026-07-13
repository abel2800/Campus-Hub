import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Upload, 
  message, 
  Card, 
  Steps, 
  Divider,
  InputNumber,
  DatePicker,
  Switch,
  Typography,
  List,
  Space,
  Progress,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  CheckOutlined, 
  BookOutlined,
  FileTextOutlined,
  PictureOutlined,
  DollarOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  InboxOutlined
} from '@ant-design/icons';
import api from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const { Title, Text } = Typography;

const CourseCreation = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoList, setVideoList] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('CourseCreation component rendering');
  
  useEffect(() => {
    console.log('CourseCreation component mounted');
    
    // Initialize form values to ensure they're defined
    form.setFieldsValue({
      title: '',
      description: '',
      category: 'programming',
      level: 'beginner',
      price: 0,
      contentType: 'video',
      published: false
    });
    
    console.log('Form initialized with default values');
    
    return () => {
      console.log('CourseCreation component unmounting');
    };
  }, [form]);

  // Add handler for direct input change to ensure values are stored
  const handleTitleChange = (e) => {
    const value = e.target.value;
    console.log('Title field changed to:', value);
    // Manually update form field
    form.setFieldsValue({ title: value });
  };

  // Debug function to check form values
  const debugFormValues = () => {
    const values = form.getFieldsValue();
    console.log('Current form values:', values);
    console.log('Title field value:', values.title);
    console.log('Form is dirty:', form.isFieldsTouched());
    console.log('Title field errors:', form.getFieldError('title'));
    return values;
  };

  const categories = [
    { value: 'programming', label: 'Programming' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'science', label: 'Science' },
    { value: 'language', label: 'Language' },
    { value: 'other', label: 'Other' }
  ];
  
  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const contentTypes = [
    { value: 'video', label: 'Video Based Course' },
    { value: 'document', label: 'Document Based Course' },
    { value: 'mixed', label: 'Mixed Content' }
  ];

  const handleThumbnailChange = ({ file }) => {
    if (file.status === 'done') {
      message.success(`${file.name} uploaded successfully`);
      setThumbnailFile(file.originFileObj);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj);
      reader.onload = () => {
        setThumbnailPreview(reader.result);
      };
    } else if (file.status === 'error') {
      message.error(`${file.name} upload failed.`);
    }
  };

  const customRequest = ({ file, onSuccess, onError }) => {
    // This just simulates a successful upload for preview purposes
    // The actual file will be uploaded when the form is submitted
    setTimeout(() => {
      onSuccess('ok');
    }, 500);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    
    return true;
  };

  const validateStep = async () => {
    try {
      console.log('Starting validation for step', currentStep);
      
      if (currentStep === 0) {
        // Get basic form values directly first
        const values = form.getFieldsValue(['title', 'category', 'level', 'contentType', 'price']);
        console.log('Validating basic info with values:', values);
        
        // Check if title is empty
        if (!values.title || values.title.trim() === '') {
          message.error('Course title is required');
          return;
        }
        
        // Proceed to next step if we have the essential fields
        if (values.category && values.level && values.contentType) {
          setCurrentStep(1);
        } else {
          message.error('Please complete all required fields in Basic Info');
        }
      } else if (currentStep === 1) {
        // Get description from form and DOM for redundancy
        const formValues = form.getFieldsValue(['description', 'requirements', 'objectives']);
        const descriptionDom = document.querySelector('textarea[placeholder="Provide a detailed description of what students will learn in this course"]')?.value;
        
        console.log('Description from form:', formValues.description);
        console.log('Description from DOM:', descriptionDom);
        
        // Use either source if available
        const finalDescription = formValues.description || descriptionDom || '';
        
        // Check if description is empty
        if (!finalDescription || finalDescription.trim() === '') {
          message.error('Course description is required');
          return;
        }
        
        // If we got the value from DOM but not from form, update the form
        if (descriptionDom && !formValues.description) {
          form.setFieldsValue({ description: descriptionDom });
        }
        
        // Proceed to next step
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Validate thumbnail
        if (!thumbnailFile) {
          message.error('Please upload a course thumbnail');
          return;
        }
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      
      // Show more specific error
      if (error.errorFields) {
        error.errorFields.forEach(field => {
          message.error(`${field.name[0]}: ${field.errors[0]}`);
        });
      } else {
        message.error('Please complete all required fields');
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleVideoUpload = async (file) => {
    // Create a temporary preview object
    const videoObject = {
      uid: Date.now(),
      name: file.name,
      status: 'uploading',
      percent: 0,
      size: file.size,
      type: file.type,
      originFileObj: file,
      title: file.name.replace(/\.[^/.]+$/, "") // Remove file extension for title
    };
    
    setVideoList([...videoList, videoObject]);
    setUploadingVideo(true);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setVideoUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // We're just storing the file for now - will be uploaded when course is created
      setTimeout(() => {
        // Update video object status to done
        setVideoList(prevList => {
          return prevList.map(video => {
            if (video.uid === videoObject.uid) {
              return {
                ...video,
                status: 'done',
                url: URL.createObjectURL(file),
                percent: 100
              };
            }
            return video;
          });
        });
        
        clearInterval(progressInterval);
        setVideoUploadProgress(100);
        setUploadingVideo(false);
        message.success(`${file.name} added to course videos`);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setVideoUploadProgress(0);
      setUploadingVideo(false);
      
      // Update video object status to error
      setVideoList(prevList => {
        return prevList.map(video => {
          if (video.uid === videoObject.uid) {
            return {
              ...video,
              status: 'error',
              error: error.message
            };
          }
          return video;
        });
      });
      
      message.error(`Failed to add video: ${error.message}`);
    }
    
    // Prevent auto upload
    return false;
  };
  
  const removeVideo = (uid) => {
    setVideoList(videoList.filter(video => video.uid !== uid));
  };
  
  const updateVideoTitle = (uid, title) => {
    setVideoList(prevList => {
      return prevList.map(video => {
        if (video.uid === uid) {
          return { ...video, title };
        }
        return video;
      });
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('Starting course creation...');
      
      // Force getting form field values directly from DOM if needed
      const title = document.querySelector('input[placeholder="Enter an engaging title for your course"]')?.value || '';
      const titleFromForm = form.getFieldValue('title');
      
      // Get description from DOM if needed
      const description = document.querySelector('textarea[placeholder="Provide a detailed description of what students will learn in this course"]')?.value || '';
      const descriptionFromForm = form.getFieldValue('description');
      
      console.log('Title from DOM:', title);
      console.log('Title from form:', titleFromForm);
      console.log('Description from DOM:', description);
      console.log('Description from form:', descriptionFromForm);
      
      // Use DOM values if form values are empty
      const finalTitle = titleFromForm || title;
      const finalDescription = descriptionFromForm || description;
      
      if (!finalTitle || finalTitle.trim() === '') {
        message.error('Course title is required');
        setLoading(false);
        return;
      }
      
      if (!finalDescription || finalDescription.trim() === '') {
        message.error('Course description is required');
        setLoading(false);
        return;
      }
      
      // Get all form values
      const values = form.getFieldsValue();
      console.log('Current form values:', values);
      
      // Check if we have at least 1 video
      if (videoList.length === 0) {
        message.error('Please add at least one video to your course');
        setLoading(false);
        return;
      }
      
      // Create FormData to handle file upload
      const formData = new FormData();
      
      // Explicitly add title and description using the final values we determined
      formData.append('title', finalTitle.trim());
      formData.append('description', finalDescription.trim());
      
      // Explicitly add required fields to ensure they're included
      formData.append('category', values.category || 'programming');
      formData.append('level', values.level || 'beginner');
      formData.append('price', values.price || 0);
      formData.append('duration', '8 weeks');
      formData.append('status', 'Open');
      formData.append('department', values.category?.charAt(0).toUpperCase() + values.category?.slice(1) || 'General');
      
      // Add the rest of the form values
      for (const key in values) {
        // Skip fields we've already added
        if (!['title', 'description', 'category', 'level', 'price', 'thumbnail'].includes(key) && values[key] !== undefined) {
          if (key === 'startDate' && values[key]) {
            formData.append(key, values[key].format('YYYY-MM-DD'));
          } else if (values[key] !== null) {
            formData.append(key, values[key]);
          }
        }
      }
      
      // Add instructor ID from auth context
      if (user && user.id) {
        console.log('Setting instructor ID:', user.id);
        formData.append('instructorId', user.id);
        formData.append('teacherId', user.id); // Add both fields for compatibility
      } else {
        console.warn('No user ID available for course creation');
        message.warning('Could not identify instructor. Course may be created without proper instructor attribution.');
      }
      
      // Add thumbnail if available
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Debug: Log all form data entries
      console.log('Submitting course data:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Submit course to API
      try {
        console.log('Sending API request to create course...');
        const response = await api.post('/api/courses', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Course created successfully:', response.data);
        
        // Now upload each video to the course
        const courseId = response.data.id;
        
        // Check if we got a valid course ID
        if (!courseId) {
          console.error('No course ID returned from API');
          message.error('Failed to create course: No course ID returned');
          setLoading(false);
          return;
        }
        
        let videoUploadSuccess = true;
        
        // Upload each video
        for (let i = 0; i < videoList.length; i++) {
          const video = videoList[i];
          const videoFormData = new FormData();
          videoFormData.append('title', video.title);
          videoFormData.append('description', 'Video for ' + values.title);
          videoFormData.append('video', video.originFileObj);
          videoFormData.append('order', i + 1);
          
          try {
            await api.post(`/api/teacher/courses/${courseId}/videos`, videoFormData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          } catch (videoError) {
            console.error(`Failed to upload video ${i+1}:`, videoError);
            videoUploadSuccess = false;
          }
        }
        
        if (videoUploadSuccess) {
          message.success('Course and videos created successfully!');
        } else {
          message.warning('Course created but some videos failed to upload.');
        }
        
        // Update course with video count
        try {
          await api.put(`/api/courses/${courseId}`, {
            totalVideos: videoList.length
          });
        } catch (updateError) {
          console.error('Failed to update video count:', updateError);
        }
        
        // Navigate to teacher home page using direct location change
        window.location.href = '/teacher/home';
      } catch (error) {
        console.error('Failed to create course:', error);
        message.error(`Failed to create course: ${error.response?.data?.message || error.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Please complete all required fields');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <BookOutlined />,
      content: (
        <>
          <Form.Item
            name="title"
            label="Course Title"
            rules={[
              { required: true, message: 'Please enter a course title' },
              { whitespace: true, message: 'Title cannot be empty spaces' },
              { min: 3, message: 'Title must be at least 3 characters' }
            ]}
          >
            <Input 
              placeholder="Enter an engaging title for your course" 
              onChange={(e) => {
                // Set the form field value explicitly
                form.setFieldsValue({ title: e.target.value });
                // Log the current value to ensure it's being set
                console.log('Title input changed:', e.target.value);
                console.log('Current form title value:', form.getFieldValue('title'));
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select course category">
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="contentType"
            label="Content Type"
            rules={[{ required: true, message: 'Please select content type' }]}
            tooltip="Select the type of content for this course. This determines how students will interact with the course material."
          >
            <Select placeholder="Select content type">
              {contentTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please select a level' }]}
          >
            <Select placeholder="Select course difficulty level">
              {levels.map(level => (
                <Option key={level.value} value={level.value}>{level.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price ($)"
            rules={[{ required: true, message: 'Please enter a price' }]}
          >
            <InputNumber 
              min={0} 
              precision={2} 
              style={{ width: '100%' }} 
              placeholder="Enter course price"
              prefix={<DollarOutlined />}
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Description',
      icon: <FileTextOutlined />,
      content: (
        <>
          <Form.Item
            name="description"
            label="Course Description"
            rules={[
              { required: true, message: 'Please enter a description' },
              { whitespace: true, message: 'Description cannot be empty spaces' },
              { min: 20, message: 'Description must be at least 20 characters' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="Provide a detailed description of what students will learn in this course"
              onChange={(e) => {
                // Set the form field value explicitly
                form.setFieldsValue({ description: e.target.value });
                // Log the current value to ensure it's being set
                console.log('Description input changed:', e.target.value);
                console.log('Current form description value:', form.getFieldValue('description'));
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="objectives"
            label="Learning Objectives"
            rules={[{ required: true, message: 'Please enter learning objectives' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="What will students achieve by the end of this course? (Each on a new line)"
            />
          </Form.Item>
          
          <Form.Item
            name="requirements"
            label="Prerequisites"
            rules={[{ required: true, message: 'Please enter prerequisites' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="What should students already know before taking this course? (Each on a new line)"
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Thumbnail',
      icon: <PictureOutlined />,
      content: (
        <>
          <Form.Item
            name="thumbnail"
            label="Course Thumbnail"
            valuePropName="fileList"
            getValueFromEvent={e => e && e.fileList}
          >
            <Upload
              name="thumbnail"
              listType="picture-card"
              showUploadList={false}
              customRequest={customRequest}
              beforeUpload={beforeUpload}
              onChange={handleThumbnailChange}
            >
              {thumbnailPreview ? (
                <img 
                  src={thumbnailPreview} 
                  alt="thumbnail" 
                  style={{ width: '100%' }} 
                />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="published"
            label="Publish Course"
            valuePropName="checked"
            extra="When enabled, your course will be visible to students immediately"
          >
            <Switch 
              checkedChildren={<CheckOutlined />} 
              defaultChecked={false}
            />
          </Form.Item>
          
          <Form.Item
            name="startDate"
            label="Start Date (Optional)"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Videos',
      icon: <VideoCameraOutlined />,
      content: (
        <div>
          <Title level={4}>Course Videos</Title>
          <Text type="secondary">
            Upload at least 1 video for your course. You can add between 1 and 20 videos.
          </Text>
          
          <Divider />
          
          <Upload.Dragger
            name="video"
            multiple={false}
            showUploadList={false}
            accept="video/*"
            beforeUpload={handleVideoUpload}
            disabled={uploadingVideo || videoList.length >= 20}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag video to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single video upload. Max size: 100MB.
            </p>
            {uploadingVideo && (
              <Progress percent={videoUploadProgress} status="active" style={{ marginTop: 16 }} />
            )}
          </Upload.Dragger>
          
          <div style={{ marginTop: 24 }}>
            <Typography.Title level={5}>
              Video List ({videoList.length}/20)
            </Typography.Title>
            
            {videoList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Typography.Text type="secondary">
                  No videos added yet. Upload your first video above.
                </Typography.Text>
              </div>
            ) : (
              <List
                dataSource={videoList}
                renderItem={(video, index) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{ marginRight: 16 }}>
                        <VideoCameraOutlined style={{ fontSize: 24 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Input 
                          value={video.title} 
                          onChange={(e) => updateVideoTitle(video.uid, e.target.value)}
                          placeholder="Video title"
                          addonBefore={`Video ${index + 1}`}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            {(video.size / 1024 / 1024).toFixed(2)} MB
                            {video.status === 'uploading' && ' - Uploading...'}
                            {video.status === 'done' && ' - Ready'}
                            {video.status === 'error' && ' - Upload Failed'}
                          </Text>
                        </div>
                      </div>
                      <div style={{ marginLeft: 16 }}>
                        <Popconfirm
                          title="Remove this video?"
                          onConfirm={() => removeVideo(video.uid)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button 
                            danger 
                            icon={<DeleteOutlined />}
                            disabled={video.status === 'uploading'}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>Create New Course</Title>
        
        <Steps current={currentStep} style={{ marginBottom: 40 }}>
          {steps.map(step => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>
        
        <Form form={form} layout="vertical" initialValues={{ price: 0 }}>
          <div style={{ minHeight: 300 }}>
            {steps[currentStep].content}
          </div>
          
          <Divider />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                Previous
              </Button>
            )}
            
            <div style={{ marginLeft: 'auto' }}>
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={() => validateStep()}>
                  Next
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  onClick={handleSubmit} 
                  loading={loading}
                  disabled={videoList.length === 0}
                >
                  Create Course
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CourseCreation;
