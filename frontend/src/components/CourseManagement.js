import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Upload, 
  List, 
  Card,
  message,
  Modal,
  Progress 
} from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EditOutlined 
} from '@ant-design/icons';
import axios from '../utils/axios';

const CourseManagement = () => {
  const [form] = Form.useForm();
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      
      videos.forEach((video, index) => {
        formData.append(`videos[${index}]`, video.file);
        formData.append(`videoTitles[${index}]`, video.title);
      });

      setUploading(true);
      
      await axios.post('/api/courses', formData, {
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentage);
        },
      });

      message.success('Course created successfully!');
      form.resetFields();
      setVideos([]);
    } catch (error) {
      console.error('Error creating course:', error);
      message.error('Failed to create course');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = ({ file }) => {
    setVideos(prev => [...prev, {
      file,
      title: file.name,
      url: URL.createObjectURL(file)
    }]);
  };

  const handleVideoRemove = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card title="Create New Course">
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="title"
          label="Course Title"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Course Description"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Upload
          customRequest={handleVideoUpload}
          showUploadList={false}
          accept="video/*"
        >
          <Button icon={<UploadOutlined />}>Add Video</Button>
        </Upload>

        <List
          style={{ marginTop: 16 }}
          dataSource={videos}
          renderItem={(video, index) => (
            <List.Item
              actions={[
                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleVideoRemove(index)} 
                />
              ]}
            >
              <List.Item.Meta
                title={video.title}
                description={
                  <Input
                    placeholder="Video title"
                    value={video.title}
                    onChange={(e) => {
                      const newVideos = [...videos];
                      newVideos[index].title = e.target.value;
                      setVideos(newVideos);
                    }}
                  />
                }
              />
            </List.Item>
          )}
        />

        {uploading && (
          <Progress percent={uploadProgress} status="active" />
        )}

        <Button 
          type="primary" 
          htmlType="submit" 
          loading={uploading}
          disabled={videos.length === 0}
          style={{ marginTop: 16 }}
        >
          Create Course
        </Button>
      </Form>
    </Card>
  );
};

export default CourseManagement; 