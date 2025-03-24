import React, { useState, useEffect, useRef } from 'react';
import { 
  Avatar, 
  Modal, 
  Upload, 
  message, 
  Button, 
  Spin,
  Progress,
  Space,
  Tooltip,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  CloseOutlined, 
  HeartOutlined, 
  HeartFilled,
  DeleteOutlined,
  LeftOutlined, 
  RightOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  UserOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

const { Text } = Typography;

const StoryContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 24px;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #888;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const StoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
  cursor: pointer;
`;

const StoryRing = styled.div`
  padding: 2px;
  background: ${props => props.hasStory ? 
    'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 
    '#efefef'};
  border-radius: 50%;
  margin-bottom: 8px;
`;

const StoryAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
  border: 2px solid white;
`;

const StoryThumbnail = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  border: 2px solid white;
`;

const Username = styled.span`
  font-size: 12px;
  color: #262626;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StoryModalContent = styled.div`
  height: 80vh;
  background-color: #000;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const StoryImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const StoryVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const StoryHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  color: white;
  z-index: 10;
`;

const StoryProgressContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 8px;
  gap: 4px;
  z-index: 9;
`;

const StoryProgressBar = styled.div`
  height: 2px;
  flex: 1;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
`;

const StoryProgressFill = styled.div`
  height: 100%;
  background-color: white;
  width: ${props => props.progress}%;
  transition: width 0.1s linear;
`;

const StoryFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  color: white;
  z-index: 10;
`;

const NavigationButton = styled(Button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
  &:focus {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
`;

const LeftNavButton = styled(NavigationButton)`
  left: 16px;
`;

const RightNavButton = styled(NavigationButton)`
  right: 16px;
`;

const UploadButtonContainer = styled.div`
  position: relative;
`;

const StoryTimestamp = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const UploadOptionsContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 8px;
  margin-bottom: 8px;
  z-index: 100;
`;

const StorySection = ({ onStoryAdded }) => {
  const [stories, setStories] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [friendsWithStories, setFriendsWithStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [addStoryModalVisible, setAddStoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [likedStories, setLikedStories] = useState({});
  const { user } = useAuth();
  const progressTimer = useRef(null);
  const storyDuration = 5000; // 5 seconds per story
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (stories.length > 0) {
      organizeStories();
    }
  }, [stories]);

  useEffect(() => {
    return () => {
      // Clear timer on unmount
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, []);

  // Setup progress bar and auto-advance when a story is viewed
  useEffect(() => {
    if (isModalVisible && selectedStory) {
      startProgressTimer();
      
      return () => {
        if (progressTimer.current) {
          clearInterval(progressTimer.current);
        }
      };
    }
  }, [isModalVisible, selectedStory, currentStoryIndex, currentUserIndex]);

  // Add preload image helper function
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Modify fetchStories to preload story images
  const fetchStories = async () => {
    setLoading(true);
    try {
      console.log('Fetching stories...');
      
      // Use cache first approach - show cached stories while fetching new ones
      const cachedStories = localStorage.getItem('cachedStories');
      if (cachedStories) {
        const parsedStories = JSON.parse(cachedStories);
        console.log('Using cached stories while fetching fresh data');
        setStories(parsedStories);
        setLoading(false);
        
        // Preload thumbnails for cached stories
        parsedStories.forEach(story => {
          if (story.mediaUrl) {
            const mediaUrl = getStoryMediaUrl(story.mediaUrl);
            preloadImage(mediaUrl).catch(() => console.log('Failed to preload story:', mediaUrl));
          }
        });
      }
      
      const response = await api.get('/api/stories');
      console.log('Stories fetched:', response.data.length);
      
      // Process the stories to ensure they have all required fields
      const processedStories = response.data.map(story => ({
        ...story,
        mediaUrl: story.mediaUrl || story.imageUrl,
        mediaType: story.mediaType || (story.mediaUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image')
      }));
      
      setStories(processedStories || []);
      
      // Cache the stories for future use
      localStorage.setItem('cachedStories', JSON.stringify(processedStories));
      
      // Preload all story media for faster viewing
      processedStories.forEach(story => {
        if (story.mediaUrl) {
          const mediaUrl = getStoryMediaUrl(story.mediaUrl);
          // Only preload images, not videos
          if (story.mediaType !== 'video') {
            preloadImage(mediaUrl).catch(() => console.log('Failed to preload story:', mediaUrl));
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Don't show error message, just set empty stories
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const organizeStories = () => {
    // Get current user's stories
    const currentUserStories = stories.filter(story => story.user.id === user?.id);
    setUserStories(currentUserStories);
    
    // Group other stories by user
    const friends = [];
    const friendStoriesMap = {};
    
    stories.forEach(story => {
      if (story.user.id !== user?.id) {
        if (!friendStoriesMap[story.user.id]) {
          friendStoriesMap[story.user.id] = {
            user: story.user,
            stories: []
          };
          friends.push(friendStoriesMap[story.user.id]);
        }
        friendStoriesMap[story.user.id].stories.push(story);
      }
    });
    
    setFriendsWithStories(friends);
  };

  const startProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    
    setProgress(0);
    const startTime = Date.now();
    
    progressTimer.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = (elapsedTime / storyDuration) * 100;
      
      if (newProgress >= 100) {
        clearInterval(progressTimer.current);
        handleNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 100);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      message.error('File size should not exceed 10MB');
      return;
    }
    
    // Determine file type
    const fileType = file.type.split('/')[0];
    console.log('Selected story file:', file.name, file.type, file.size);
    
    // Upload the story with proper type
    handleStoryUpload(file, fileType);
    
    // Reset the input
    e.target.value = '';
  };

  const handleStoryUpload = async (file, type = 'image') => {
    setUploading(true);
    try {
      console.log('Uploading story with file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      const formData = new FormData();
      formData.append('media', file);
      
      // Debug log the complete formData
      for (let pair of formData.entries()) {
        console.log(`FormData contains: ${pair[0]}, ${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]}`);
      }
      
      // Send the request to create story
      const response = await api.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Story uploaded successfully:', response.data);
      
      // Add the new story to the list and close modal
      setStories(prev => [response.data, ...prev]);
      setAddStoryModalVisible(false);
      
      // Notify parent component that a story was added
      if (onStoryAdded) {
        onStoryAdded();
      }
      
      message.success('Story added successfully!');
    } catch (error) {
      console.error('Error uploading story:', error);
      message.error('Failed to upload story. ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // Add getStoryMediaUrl helper function to handle different URL formats
  const getStoryMediaUrl = (url) => {
    if (!url) return '';
    
    // If it's already an absolute URL (starts with http or https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative path, prepend the API base URL
    // Remove any leading slash for consistency
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${cleanUrl}`;
  };

  const handleViewStory = (story) => {
    console.log('Viewing story:', story);
          setSelectedStory(story);
          setIsModalVisible(true);
    setProgress(0);
    
    // Start the progress timer
    startProgressTimer();
  };

  const handleNextStory = () => {
    // Clear the current timer
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    
    // Find the current story index in the stories array
    const currentIndex = stories.findIndex(story => story.id === selectedStory.id);
    
    if (currentIndex < stories.length - 1) {
      // There is a next story, show it
      setSelectedStory(stories[currentIndex + 1]);
      setProgress(0);
      startProgressTimer();
    } else {
      // No more stories, close the modal
      handleCloseModal();
    }
  };

  const handlePrevStory = () => {
    // Clear the current timer
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    
    // Find the current story index in the stories array
    const currentIndex = stories.findIndex(story => story.id === selectedStory.id);
    
    if (currentIndex > 0) {
      // There is a previous story, show it
      setSelectedStory(stories[currentIndex - 1]);
      setProgress(0);
      startProgressTimer();
    } else {
      // Already at the first story, restart it
      setProgress(0);
      startProgressTimer();
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedStory(null);
    setProgress(0);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
  };

  const handleLikeStory = async (storyId) => {
    if (!storyId) return;

    try {
      await api.post(`/api/stories/${storyId}/like`);
      
      // Update UI optimistically
      setLikedStories(prev => ({
        ...prev,
        [storyId]: !prev[storyId]
      }));
    } catch (error) {
      console.error('Failed to like story:', error);
      message.error('Failed to like story');
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!storyId) return;

    try {
      await api.delete(`/api/stories/${storyId}`);
      message.success('Story deleted successfully');
      
      // Close modal
      handleCloseModal();
      
      // Refresh stories
      await fetchStories();
    } catch (error) {
      console.error('Failed to delete story:', error);
      message.error('Failed to delete story');
    }
  };

  const toggleUploadOptions = () => {
    setShowUploadOptions(prev => !prev);
  };

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleVideoUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'video/*';
      fileInputRef.current.click();
    }
  };

  const renderStoryMedia = () => {
    if (!selectedStory) return null;
    
    const mediaUrl = getStoryMediaUrl(selectedStory.mediaUrl);
    console.log('Displaying story media:', mediaUrl);
    
    // Determine if it's a video or image based on type or URL
    const isVideo = 
      selectedStory.type === 'video' || 
      (selectedStory.mediaUrl && selectedStory.mediaUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i));
      
    return isVideo ? (
      <StoryVideo 
        src={mediaUrl} 
        controls={false}
        autoPlay
        muted={false}
        onEnded={handleNextStory}
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          console.error('Failed to load video:', mediaUrl);
          e.target.onerror = null;
          handleNextStory();
        }}
      />
    ) : (
      <StoryImage 
        src={mediaUrl} 
        alt="Story" 
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          console.error('Failed to load image:', mediaUrl);
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/400x600?text=Image+Not+Available';
        }}
      />
    );
  };

  const getCurrentUserStoriesCount = () => {
    return stories.filter(story => story.user.id === user?.id).length;
  };

  const getTimeSince = (datetime) => {
    return moment(datetime).fromNow();
  };

  const renderCreateStoryItem = () => {
    return (
      <StoryItem onClick={() => setAddStoryModalVisible(true)}>
          <StoryRing>
          <StoryAvatar icon={<PlusOutlined style={{ fontSize: '24px' }} />} />
          </StoryRing>
        <Username>Add Story</Username>
        </StoryItem>
    );
  };

  const renderAddStoryModal = () => {
    return (
      <Modal
        title="Add Story"
        open={addStoryModalVisible}
        onCancel={() => setAddStoryModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<FileImageOutlined />} 
            onClick={handleImageUploadClick}
            loading={uploading}
            block
            size="large"
            style={{ height: '60px' }}
          >
            Add Photo Story
          </Button>
          <Button 
            icon={<VideoCameraOutlined />} 
            onClick={handleVideoUploadClick}
            loading={uploading}
            block
            size="large"
            style={{ height: '60px' }}
          >
            Add Video Story
          </Button>
        </Space>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </Modal>
    );
  };

  return (
    <>
    <StoryContainer>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px 0' }}>
          <Spin size="small" />
        </div>
      ) : (
        <>
          {renderCreateStoryItem()}
          
          {stories.map(story => {
            const storyThumbnail = getStoryMediaUrl(story.mediaUrl);
            return (
              <StoryItem key={story.id} onClick={() => handleViewStory(story)}>
                <StoryRing hasStory={true}>
                  {story.mediaUrl ? (
                    <StoryThumbnail
                      style={{ 
                        backgroundImage: `url(${storyThumbnail})`
                      }}
                    />
                  ) : (
                    <StoryAvatar 
                      src={story.user?.avatar || story.user?.avatarUrl} 
                      icon={<UserOutlined />}
                    />
                  )}
                </StoryRing>
                <Username>{story.user?.username}</Username>
              </StoryItem>
            );
          })}
        </>
      )}
    </StoryContainer>

    <Modal
      open={isModalVisible}
      onCancel={handleCloseModal}
      footer={null}
      closable={false}
      centered
      width="100%"
      style={{ maxWidth: '100vw', top: 0, margin: 0, padding: 0 }}
      bodyStyle={{ padding: 0, height: '100vh' }}
      wrapClassName="story-modal"
      >
        {selectedStory && (
        <StoryModalContent onClick={handleNextStory}>
          <StoryHeader>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={selectedStory.user?.avatarUrl || selectedStory.user?.avatar}
                icon={<UserOutlined />}
                size={40} 
              />
              <div style={{ marginLeft: '12px' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {selectedStory.user?.username}
                </div>
                <StoryTimestamp>
                  {getTimeSince(selectedStory.createdAt)}
                </StoryTimestamp>
              </div>
            </div>
            <Space>
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                style={{ color: 'white' }}
              />
            </Space>
          </StoryHeader>

          <StoryProgressContainer>
            <StoryProgressBar>
              <StoryProgressFill progress={progress} />
            </StoryProgressBar>
          </StoryProgressContainer>

          {renderStoryMedia()}

          <StoryFooter>
            <Space>
              <Button
                type="text"
                icon={likedStories[selectedStory.id] ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeStory(selectedStory.id);
                }}
                style={{ color: 'white' }}
              />
            </Space>
            
            {selectedStory.user?.id === user?.id && (
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStory(selectedStory.id);
                }}
              >
                Delete
              </Button>
            )}
          </StoryFooter>

          <LeftNavButton 
            icon={<LeftOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
          />
          <RightNavButton 
            icon={<RightOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
          />
        </StoryModalContent>
        )}
      </Modal>

    {renderAddStoryModal()}
    </>
  );
};

export default StorySection;