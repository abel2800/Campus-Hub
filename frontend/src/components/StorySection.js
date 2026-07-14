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
  Typography,
  Input
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
  UserOutlined,
  SendOutlined,
  MessageOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import { checkSensitiveContent } from '../utils/contentModeration';

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
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 20px;
  color: white;
  z-index: 10;
  background: linear-gradient(transparent, rgba(0,0,0,0.75));
`;

const StoryCommentsStrip = styled.div`
  max-height: 120px;
  overflow-y: auto;
  width: 100%;
`;

const StoryCommentLine = styled.div`
  font-size: 13px;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  span {
    font-weight: 700;
    margin-right: 6px;
  }
`;

const StoryActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const InsightsBar = styled.button`
  width: 100%;
  border: none;
  border-radius: 24px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
`;

const InsightsPanel = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 55vh;
  background: #1a1a1a;
  border-radius: 16px 16px 0 0;
  padding: 16px;
  z-index: 20;
  overflow-y: auto;
  color: white;
`;

const InsightsSectionTitle = styled.div`
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const InsightsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const InsightsEmpty = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  padding: 8px 0 16px;
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
  const [storyLikesCount, setStoryLikesCount] = useState({});
  const [storyComments, setStoryComments] = useState({});
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [storyCaption, setStoryCaption] = useState('');
  const [storyLikers, setStoryLikers] = useState({});
  const [insightsOpen, setInsightsOpen] = useState(false);
  const { user } = useAuth();
  const progressTimer = useRef(null);
  const pausedRef = useRef(false);
  const storyDuration = 5000; // 5 seconds per story
  const fileInputRef = useRef(null);

  const isOwnStory = (story) =>
    !!story && !!user && (story.userId === user.id || story.user?.id === user.id);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return avatar.startsWith('/') ? `${base}${avatar}` : `${base}/${avatar}`;
  };

  const fetchStoryInsights = async (storyId) => {
    try {
      const { data } = await api.get(`/api/stories/${storyId}/insights`);
      setStoryLikers((prev) => ({ ...prev, [storyId]: data.likes || [] }));
      setStoryComments((prev) => ({ ...prev, [storyId]: data.comments || [] }));
      setStoryLikesCount((prev) => ({ ...prev, [storyId]: data.likesCount ?? 0 }));
      return data;
    } catch (error) {
      console.error('Failed to load story insights:', error);
      return null;
    }
  };

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

  // Refresh insights while viewing your own story
  useEffect(() => {
    if (!isModalVisible || !selectedStory || !isOwnStory(selectedStory)) return undefined;
    fetchStoryInsights(selectedStory.id);
    const interval = setInterval(() => fetchStoryInsights(selectedStory.id), 4000);
    return () => clearInterval(interval);
  }, [isModalVisible, selectedStory?.id, user?.id]);

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
    pausedRef.current = false;
    setProgress(0);
    const startTime = Date.now();
    let pausedAccum = 0;
    let pauseStarted = null;
    
    progressTimer.current = setInterval(() => {
      if (pausedRef.current) {
        if (!pauseStarted) pauseStarted = Date.now();
        return;
      }
      if (pauseStarted) {
        pausedAccum += Date.now() - pauseStarted;
        pauseStarted = null;
      }
      const elapsedTime = Date.now() - startTime - pausedAccum;
      const newProgress = (elapsedTime / storyDuration) * 100;
      
      if (newProgress >= 100) {
        clearInterval(progressTimer.current);
        handleNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 100);
  };

  const pauseStory = () => {
    pausedRef.current = true;
  };

  const resumeStory = () => {
    pausedRef.current = false;
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
    const captionCheck = checkSensitiveContent(storyCaption);
    if (captionCheck.blocked) {
      message.error(captionCheck.message);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      if (storyCaption.trim()) {
        formData.append('caption', storyCaption.trim());
      }
      
      const response = await api.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setStories(prev => [response.data, ...prev]);
      setAddStoryModalVisible(false);
      setStoryCaption('');
      
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
    setSelectedStory(story);
    setIsModalVisible(true);
    setProgress(0);
    setCommentDraft('');
    setInsightsOpen(false);
    setLikedStories(prev => ({ ...prev, [story.id]: !!story.isLiked }));
    setStoryLikesCount(prev => ({ ...prev, [story.id]: story.likes || 0 }));
    setStoryComments(prev => ({ ...prev, [story.id]: story.comments || [] }));
    setStoryLikers(prev => ({ ...prev, [story.id]: story.likers || [] }));
    if (isOwnStory(story)) {
      fetchStoryInsights(story.id);
    } else {
      startProgressTimer();
    }
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
      const next = stories[currentIndex + 1];
      setSelectedStory(next);
      setCommentDraft('');
      setLikedStories(prev => ({ ...prev, [next.id]: !!next.isLiked }));
      setStoryLikesCount(prev => ({ ...prev, [next.id]: next.likes || 0 }));
      setStoryComments(prev => ({ ...prev, [next.id]: next.comments || prev[next.id] || [] }));
      setStoryLikers(prev => ({ ...prev, [next.id]: next.likers || prev[next.id] || [] }));
      setInsightsOpen(false);
      setProgress(0);
      if (isOwnStory(next)) {
        fetchStoryInsights(next.id);
      } else {
        startProgressTimer();
      }
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
      const prevStory = stories[currentIndex - 1];
      setSelectedStory(prevStory);
      setCommentDraft('');
      setLikedStories(prev => ({ ...prev, [prevStory.id]: !!prevStory.isLiked }));
      setStoryLikesCount(prev => ({ ...prev, [prevStory.id]: prevStory.likes || 0 }));
      setStoryComments(prev => ({ ...prev, [prevStory.id]: prevStory.comments || prev[prevStory.id] || [] }));
      setStoryLikers(prev => ({ ...prev, [prevStory.id]: prevStory.likers || prev[prevStory.id] || [] }));
      setInsightsOpen(false);
      setProgress(0);
      if (isOwnStory(prevStory)) {
        fetchStoryInsights(prevStory.id);
      } else {
        startProgressTimer();
      }
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
    setInsightsOpen(false);
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
  };

  const handleLikeStory = async (storyId) => {
    if (!storyId) return;

    try {
      const { data } = await api.post(`/api/stories/${storyId}/like`);
      setLikedStories(prev => ({
        ...prev,
        [storyId]: !!data.liked
      }));
      setStoryLikesCount(prev => ({
        ...prev,
        [storyId]: data.likes ?? prev[storyId] ?? 0
      }));
      setSelectedStory(prev => prev && prev.id === storyId
        ? { ...prev, isLiked: !!data.liked, likes: data.likes }
        : prev);
    } catch (error) {
      console.error('Failed to like story:', error);
      message.error(error.response?.data?.message || 'Failed to like story');
    }
  };

  const handleStoryComment = async () => {
    if (!selectedStory?.id) return;
    const content = commentDraft.trim();
    if (!content) return;

    const check = checkSensitiveContent(content);
    if (check.blocked) {
      message.error(check.message);
      return;
    }

    setSendingComment(true);
    try {
      const { data } = await api.post(`/api/stories/${selectedStory.id}/comments`, { content });
      setStoryComments(prev => ({
        ...prev,
        [selectedStory.id]: [...(prev[selectedStory.id] || []), data]
      }));
      setCommentDraft('');
      message.success('Comment sent');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to comment');
    } finally {
      setSendingComment(false);
      resumeStory();
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
          <Input.TextArea
            rows={2}
            maxLength={150}
            placeholder="Add a caption (optional)"
            value={storyCaption}
            onChange={(e) => setStoryCaption(e.target.value)}
          />
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
        <StoryModalContent onClick={isOwnStory(selectedStory) ? undefined : handleNextStory}>
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

          <StoryFooter onClick={(e) => e.stopPropagation()}>
            {selectedStory.caption ? (
              <StoryCommentLine>
                <span>{selectedStory.user?.username}</span>
                {selectedStory.caption}
              </StoryCommentLine>
            ) : null}

            {isOwnStory(selectedStory) ? (
              <>
                <InsightsBar
                  type="button"
                  onClick={() => setInsightsOpen((open) => !open)}
                >
                  <span>
                    <HeartFilled style={{ color: '#ff4d4f', marginRight: 6 }} />
                    {storyLikesCount[selectedStory.id] || 0} likes
                  </span>
                  <span>
                    <MessageOutlined style={{ marginRight: 6 }} />
                    {(storyComments[selectedStory.id] || []).length} replies
                  </span>
                </InsightsBar>
                <StoryActionRow style={{ marginTop: 8 }}>
                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteStory(selectedStory.id)}
                  >
                    Delete story
                  </Button>
                </StoryActionRow>
                {insightsOpen && (
                  <InsightsPanel onClick={(e) => e.stopPropagation()}>
                    <InsightsSectionTitle>Likes</InsightsSectionTitle>
                    {(storyLikers[selectedStory.id] || []).length === 0 ? (
                      <InsightsEmpty>No likes yet</InsightsEmpty>
                    ) : (
                      (storyLikers[selectedStory.id] || []).map((liker) => (
                        <InsightsRow key={`like-${liker.id}-${liker.likedAt}`}>
                          <Avatar
                            src={getAvatarUrl(liker.avatar)}
                            icon={<UserOutlined />}
                            size={36}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{liker.username}</div>
                            <div style={{ fontSize: 12, opacity: 0.6 }}>
                              {moment(liker.likedAt).fromNow()}
                            </div>
                          </div>
                        </InsightsRow>
                      ))
                    )}
                    <InsightsSectionTitle>Replies</InsightsSectionTitle>
                    {(storyComments[selectedStory.id] || []).length === 0 ? (
                      <InsightsEmpty>No replies yet</InsightsEmpty>
                    ) : (
                      (storyComments[selectedStory.id] || []).map((c) => (
                        <InsightsRow key={c.id}>
                          <Avatar
                            src={getAvatarUrl(c.user?.avatar)}
                            icon={<UserOutlined />}
                            size={36}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.user?.username || 'user'}</div>
                            <div style={{ fontSize: 13, marginTop: 2 }}>{c.content}</div>
                            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                              {moment(c.createdAt).fromNow()}
                            </div>
                          </div>
                        </InsightsRow>
                      ))
                    )}
                  </InsightsPanel>
                )}
              </>
            ) : (
              <>
                <StoryCommentsStrip>
                  {(storyComments[selectedStory.id] || []).slice(-5).map((c) => (
                    <StoryCommentLine key={c.id}>
                      <span>{c.user?.username || 'user'}</span>
                      {c.content}
                    </StoryCommentLine>
                  ))}
                </StoryCommentsStrip>

                <StoryActionRow>
                  <Button
                    type="text"
                    icon={likedStories[selectedStory.id] ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                    onClick={() => handleLikeStory(selectedStory.id)}
                    style={{ color: 'white' }}
                  />
                  <span style={{ color: 'white', minWidth: 24 }}>
                    {storyLikesCount[selectedStory.id] || 0}
                  </span>
                  <MessageOutlined style={{ color: 'white', marginRight: 4 }} />
                  <Input
                    placeholder="Send message..."
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onFocus={pauseStory}
                    onBlur={resumeStory}
                    onPressEnter={handleStoryComment}
                    style={{ flex: 1, borderRadius: 20 }}
                    suffix={
                      <SendOutlined
                        onClick={handleStoryComment}
                        style={{ color: sendingComment ? '#999' : '#1677ff', cursor: 'pointer' }}
                      />
                    }
                  />
                </StoryActionRow>
              </>
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