import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layout, Card, Avatar, Input, Button, Space, List, Upload, message, Modal, Spin, Empty, 
  Dropdown, Menu, Typography, Tooltip, Badge, Divider, Form, Alert
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled, 
  CommentOutlined, 
  SendOutlined, 
  PictureOutlined, 
  UserOutlined,
  MoreOutlined,
  ShareAltOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  SmileOutlined,
  LoadingOutlined,
  PlusOutlined,
  EllipsisOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import StorySection from './StorySection';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import PostCard from './PostCard';
import { preloadImages } from '../utils/imageLoader';
import { throttle } from '../utils/debounce';
import { checkSensitiveContent } from '../utils/contentModeration';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// Styled Components
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const PostCardStyled = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  .ant-card-body {
    padding: 0;
  }
`;

const PostHeader = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Username = styled.span`
  font-weight: 600;
  margin-left: 12px;
`;

const PostImageContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  min-height: 300px;
  max-height: 500px;
  overflow: hidden;
`;

const PostImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: contain;
`;

const PostVideo = styled.video`
  width: 100%;
  max-height: 500px;
  object-fit: contain;
`;

const PostActions = styled.div`
  padding: 12px 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const LeftActions = styled.div`
  display: flex;
  gap: 16px;
`;

const LikesCount = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const Caption = styled.div`
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Comments = styled.div`
  margin-bottom: 12px;
`;

const CommentItem = styled.div`
  margin-bottom: 8px;
  display: flex;
`;

const CommentContent = styled.div`
  flex: 1;
  margin-left: 8px;
`;

const CommentUsername = styled.span`
  font-weight: 600;
  margin-right: 8px;
`;

const CommentText = styled.span`
  word-break: break-word;
`;

const CommentInput = styled(Input)`
  border: none;
  border-top: 1px solid #f0f0f0;
  padding: 16px;
  &:focus {
    box-shadow: none;
  }
`;

const CreatePostButton = styled(Button)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  .anticon {
    font-size: 24px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
`;

const CreatePostModalStyled = styled(Modal)`
  .ant-modal-body {
    padding: 0;
  }
  .ant-modal-footer {
    border-top: none;
  }
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  position: relative;
`;

const ModalTitle = styled(Title)`
  margin: 0 !important;
  font-size: 18px !important;
`;

const ModalBody = styled.div`
  padding: 16px;
`;

const ImagePreviewContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 400px;
`;

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 400px;
`;

const RemovePreviewButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 32px;
  height: 32px;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
`;

const TimeStamp = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
`;

const ActionButton = styled(Button)`
  &:hover {
    color: #1890ff;
    background: #e6f7ff;
  }
`;

// Add a preloadImage helper function
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const SocialMediaPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef();
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  useEffect(() => {
    loadPosts();
    loadRecommendedPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      setError(null);
      
      console.log('Loading posts...');
      
      // Use cache first approach - show cached posts while fetching new ones
      const cachedPosts = localStorage.getItem('cachedPosts');
      if (cachedPosts) {
        const parsedPosts = JSON.parse(cachedPosts);
        console.log('Using cached posts while fetching fresh data');
        setPosts(parsedPosts);
        setPostsLoading(false);
        
        // Preload images from cached posts
        const imageUrls = parsedPosts
          .filter(post => post.mediaUrl || post.imageUrl)
          .map(post => getMediaUrl(post.mediaUrl || post.imageUrl));
        
        if (imageUrls.length > 0) {
          preloadImages(imageUrls)
            .then(() => console.log('Cached post images preloaded'))
            .catch(err => console.warn('Some cached images failed to preload', err));
        }
      }
      
      const response = await api.get('/api/posts/feed');
      console.log('Posts loaded:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Process the post data to ensure all expected fields are present
        const processedPosts = response.data.map(post => ({
          ...post,
          mediaUrl: post.mediaUrl || post.imageUrl,
          mediaType: post.mediaType || (post.mediaUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image')
        }));
        
        setPosts(processedPosts);
        // Cache the posts for future use
        localStorage.setItem('cachedPosts', JSON.stringify(processedPosts));
        
        // Preload all images for faster display (but not videos)
        const newImageUrls = processedPosts
          .filter(post => (post.mediaUrl || post.imageUrl) && 
                          (post.mediaType !== 'video'))
          .map(post => getMediaUrl(post.mediaUrl || post.imageUrl));
        
        if (newImageUrls.length > 0) {
          preloadImages(newImageUrls)
            .then(() => console.log('New post images preloaded:', newImageUrls.length))
            .catch(err => console.warn('Some new images failed to preload', err));
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      setError(error.response?.data?.message || 'Failed to load posts. Try refreshing the page.');
      
      // If we have cached posts, continue showing them despite the error
      const cachedPosts = localStorage.getItem('cachedPosts');
      if (!cachedPosts || posts.length === 0) {
      message.error('Failed to load posts');
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const loadRecommendedPosts = async () => {
    try {
      setLoadingRecommended(true);
      console.log('Loading recommended posts...');
      const response = await api.get('/api/posts/recommended');
      console.log('Recommended posts loaded:', response.data);
      setRecommendedPosts(response.data || []);
    } catch (error) {
      console.error('Failed to load recommended posts:', error);
      // Create some sample fallback posts for new users
      setRecommendedPosts([
        {
          id: 'sample1',
          caption: 'Welcome to Campus Hub! Create your first post or find friends to get started.',
          mediaUrl: '/images/default-post-1.jpg',
          mediaType: 'image',
          userId: 'sample',
          likesCount: 15,
          commentsCount: 2,
          createdAt: new Date(),
          user: {
            id: 'sample',
            username: 'campus_hub',
            avatar: '/images/default-avatar.png'
          },
          comments: [],
          isLiked: false
        }
      ]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const refreshFeed = async () => {
    try {
      setRefreshing(true);
      message.info('Refreshing feed...');
      
      const response = await api.get('/api/posts/feed');
      console.log('Refreshed posts loaded:', response.data?.length || 0);
      
      if (response.data && Array.isArray(response.data)) {
        // Process the post data to ensure all expected fields are present
        const processedPosts = response.data.map(post => ({
          ...post,
          mediaUrl: post.mediaUrl || post.imageUrl,
          mediaType: post.mediaType || (post.mediaUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image')
        }));
        
        setPosts(processedPosts);
        // Cache the posts for future use
        localStorage.setItem('cachedPosts', JSON.stringify(processedPosts));
        
        // Preload all images for faster display (but not videos)
        const imageUrls = processedPosts
          .filter(post => (post.mediaUrl || post.imageUrl) && post.mediaType !== 'video')
          .map(post => getMediaUrl(post.mediaUrl || post.imageUrl));
          
        if (imageUrls.length > 0) {
          preloadImages(imageUrls)
            .catch(err => console.warn('Some images failed to preload on refresh', err));
        }
        
        message.success('Feed refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing feed:', error);
      message.error('Failed to refresh feed');
    } finally {
      setRefreshing(false);
      // Reset the page number for infinite scroll
      setPage(1);
      setHasMorePosts(true);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/api/posts/${postId}/like`);
      
      // Update UI optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const currentlyLiked = post.isLiked;
            return {
              ...post,
              isLiked: !currentlyLiked,
              likesCount: currentlyLiked ? post.likesCount - 1 : post.likesCount + 1
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking post:', error);
      message.error('Failed to like post');
      
      // Revert the optimistic update
      loadPosts();
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) {
      return;
    }

    const check = checkSensitiveContent(content);
    if (check.blocked) {
      message.error(check.message);
      return;
    }

    try {
      await api.post(`/api/posts/${postId}/comment`, { content });
      
      // Clear the input field
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));
      
      // Update the posts
      loadPosts();
    } catch (error) {
      console.error('Error commenting:', error);
      message.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      message.error('File size should not exceed 10MB');
      return;
    }

    console.log('Selected file:', file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    setMediaFile(file);
    
    // Set media type based on file type
    const fileType = file.type.split('/')[0];
    setMediaType(fileType === 'video' ? 'video' : 'image');
    
    console.log('Media type set to:', fileType === 'video' ? 'video' : 'image');
    
    // Reset when component unmounts or when another file is selected
    return () => URL.revokeObjectURL(previewUrl);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!mediaFile && !caption.trim()) {
      message.error('Please add a photo, video, or write something');
      return;
    }

    const check = checkSensitiveContent(caption);
    if (check.blocked) {
      message.error(check.message);
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      if (caption.trim()) {
        formData.append('caption', caption);
      }
      
      if (mediaFile) {
        formData.append('media', mediaFile);
        console.log('Adding media to form data:', {
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
          lastModified: new Date(mediaFile.lastModified).toISOString()
        });
      }
      
      console.log('Submitting post with caption:', caption);
      
      // Debug log the complete formData
      for (let pair of formData.entries()) {
        console.log(`FormData contains: ${pair[0]}, ${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]}`);
      }
      
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Post created successfully:', response.data);
      
      message.success('Post created successfully!');
      
      // Reset form and close modal
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setCaption('');
      setCreateModalVisible(false);
      
      // Add the new post to the existing posts immediately
      if (response.data) {
        const newPost = response.data;
        // Process the post to ensure it has all expected fields
        const processedPost = {
          ...newPost,
          mediaUrl: newPost.mediaUrl || newPost.imageUrl,
          mediaType: newPost.mediaType || (newPost.mediaUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image')
        };
        
        // Add the new post to the beginning of the posts array
        setPosts(prevPosts => [processedPost, ...prevPosts]);
        
        // Update the cached posts as well
        const updatedPosts = [processedPost, ...posts];
        localStorage.setItem('cachedPosts', JSON.stringify(updatedPosts));
        
        // Preload the image if it exists
        if (processedPost.mediaUrl && processedPost.mediaType !== 'video') {
          preloadImages([getMediaUrl(processedPost.mediaUrl)])
            .catch(err => console.warn('Failed to preload new post image:', err));
        }
      } else {
        // If we don't get the post data back, refresh the posts
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create post';
      message.error(`Failed to create post: ${errorMsg}`);
      
      if (error.response?.status === 413) {
        message.error('File size is too large. Maximum allowed is 10MB.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handlePostMenu = (post) => {
    const menu = (
      <Menu>
        {post.user.id === user?.id && (
          <Menu.Item 
            key="delete" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePost(post.id)}
          >
            Delete Post
          </Menu.Item>
        )}
        <Menu.Item 
          key="share" 
          icon={<ShareAltOutlined />}
          onClick={() => handleSharePost(post)}
        >
          Share
        </Menu.Item>
      </Menu>
    );
    
    return (
      <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      message.success('Post deleted successfully');
      
      // Update UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('Failed to delete post');
    }
  };

  const handleSharePost = (post) => {
    // Implement share functionality - for now, just a message
    message.info('Sharing functionality coming soon!');
  };

  const getMediaUrl = useCallback((post) => {
    let url = post.mediaUrl || post.imageUrl || '';
    if (!url) return '';
    
    // If url starts with http, it's already an absolute URL
    if (url.startsWith('http')) {
      return url;
    }
    
    // Check if there's an error in the URL formatting
    console.log('Processing post media URL:', url);
    
    // For relative URLs, ensure they have a leading slash
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    
    // Return the full URL
    const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${url}`;
    console.log('Full post media URL:', fullUrl);
    return fullUrl;
  }, []);

  const getMediaType = (post) => {
    if (post.mediaType) return post.mediaType;
    if (post.imageUrl) {
      return post.imageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image';
    }
    return 'image';
  };

  // Update renderPostMedia function to use the helper functions
  const renderPostMedia = (post) => {
    const mediaUrl = getMediaUrl(post);
    const mediaType = getMediaType(post);
    
    if (!mediaUrl) return null;
    
    if (mediaType === 'video') {
      return (
        <PostVideo controls>
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </PostVideo>
      );
    } else {
      return (
        <PostImageContainer>
          <img 
            src={mediaUrl}
            alt={post.caption || 'Post image'} 
            style={{ width: '100%', height: 'auto' }}
            onError={(e) => {
              console.error('Failed to load image:', mediaUrl);
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            }}
          />
        </PostImageContainer>
      );
    }
  };

  const renderComments = (post) => {
    if (!post.comments || post.comments.length === 0) {
      return null;
    }
    
    const allComments = [...post.comments];
    const isExpanded = expandedComments[post.id] || false;
    
    // Show only 2 comments if not expanded
    const visibleComments = isExpanded ? allComments : allComments.slice(0, 2);

  return (
      <Comments>
        {allComments.length > 2 && !isExpanded && (
          <div 
            style={{ marginBottom: '8px', color: '#8c8c8c', cursor: 'pointer' }}
            onClick={() => toggleComments(post.id)}
          >
            View all {allComments.length} comments
          </div>
        )}
        
        {visibleComments.map(comment => (
          <CommentItem key={comment.id}>
            <Avatar 
              src={comment.user.avatarUrl} 
              size="small" 
              icon={<UserOutlined />} 
              onClick={() => navigateToProfile(comment.user.id)}
              style={{ cursor: 'pointer' }}
            />
            <CommentContent>
              <div>
                <CommentUsername onClick={() => navigateToProfile(comment.user.id)}>
                  {comment.user.username}
                </CommentUsername>
                <CommentText>{comment.content}</CommentText>
              </div>
              <TimeStamp>{moment(comment.createdAt).fromNow()}</TimeStamp>
            </CommentContent>
          </CommentItem>
        ))}
        
        {allComments.length > 2 && isExpanded && (
          <div 
            style={{ marginTop: '8px', color: '#8c8c8c', cursor: 'pointer' }}
            onClick={() => toggleComments(post.id)}
          >
            Show less
          </div>
        )}
      </Comments>
    );
  };

  const renderRecommendedPosts = () => {
    if (loadingRecommended) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="small" />
          <div style={{ marginTop: 10 }}>Loading recommendations...</div>
        </div>
      );
    }

    if (recommendedPosts.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Empty 
            description="No recommendations available yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div>
        <Title level={4} style={{ padding: '0 16px', marginBottom: '16px' }}>
          Recommended Posts
        </Title>
          <List
          dataSource={recommendedPosts}
            renderItem={post => (
            <PostCardStyled>
                <PostHeader>
                  <UserInfo onClick={() => navigateToProfile(post.user.id)}>
                  <Avatar 
                    src={post.user.avatarUrl || post.user.avatar} 
                    icon={<UserOutlined />} 
                    size={40}
                  />
                  <div style={{ marginLeft: '12px' }}>
                    <Username>{post.user.username}</Username>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {moment(post.createdAt).fromNow()}
                    </div>
                  </div>
                  </UserInfo>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handleAddFriend(post.user.id)}
                >
                  Add Friend
                </Button>
                </PostHeader>

              {renderPostMedia(post)}

                <PostActions>
                  <ActionButtons>
                    <LeftActions>
                    <ActionButton 
                        type="text"
                      size="large"
                      icon={post.isLiked ? 
                        <HeartFilled style={{ color: '#ff4d4f' }} /> : 
                        <HeartOutlined />
                      }
                        onClick={() => handleLike(post.id)}
                      />
                    <ActionButton 
                      type="text"
                      size="large"
                      icon={<CommentOutlined />}
                    />
                    </LeftActions>
                  </ActionButtons>

                <LikesCount>
                  {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                </LikesCount>

                {post.caption && (
                  <Caption>
                    <CommentUsername onClick={() => navigateToProfile(post.user.id)}>
                      {post.user.username}
                    </CommentUsername>
                    {post.caption}
                  </Caption>
                )}

                {renderComments(post)}
              </PostActions>
            </PostCardStyled>
          )}
        />
      </div>
    );
  };

  const handleAddFriend = async (friendId) => {
    try {
      await api.post('/api/friends/request', { receiverId: friendId });
      message.success('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      message.error('Failed to send friend request');
    }
  };

  const renderEmptyState = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty
          description={
            <span>No posts in your feed yet</span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Space direction="vertical" size="middle">
            <Button 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
              icon={<PlusOutlined />}
            >
              Create First Post
            </Button>
            <Button 
              onClick={() => navigate('/friends')}
              icon={<UserOutlined />}
            >
              Find Friends
            </Button>
          </Space>
        </Empty>
        
        <div style={{ marginTop: '30px' }}>
          {renderRecommendedPosts()}
        </div>
      </div>
    );
  };

  // Function to load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      console.log('Loading more posts, page:', page + 1);
      
      const response = await api.get(`/api/posts/feed?page=${page + 1}`);
      console.log('Additional posts loaded:', response.data.length);
      
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          setHasMorePosts(false);
          return;
        }
        
        // Process the post data
        const processedPosts = response.data.map(post => ({
          ...post,
          mediaUrl: post.mediaUrl || post.imageUrl,
          mediaType: post.mediaType || (post.mediaUrl?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? 'video' : 'image')
        }));
        
        // Add new posts to existing posts
        setPosts(prevPosts => [...prevPosts, ...processedPosts]);
        setPage(prevPage => prevPage + 1);
        
        // Preload images for new posts
        const newImageUrls = processedPosts
          .filter(post => (post.mediaUrl || post.imageUrl) && post.mediaType !== 'video')
          .map(post => getMediaUrl(post.mediaUrl || post.imageUrl));
        
        if (newImageUrls.length > 0) {
          preloadImages(newImageUrls)
            .catch(err => console.warn('Some additional images failed to preload', err));
        }
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
      message.error('Failed to load more posts');
    } finally {
      setPostsLoading(false);
    }
  }, [page, getMediaUrl]);

  // Throttled scroll handler for infinite scroll
  const handleScroll = useCallback(
    throttle(() => {
      // Check if we're near the bottom of the page
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when we're within 200px of the bottom and not already loading
      if (scrollPosition >= documentHeight - 200 && !postsLoading && hasMorePosts) {
        loadMorePosts();
      }
    }, 300),
    [postsLoading, hasMorePosts, loadMorePosts]
  );
  
  // Add event listener for scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [postsLoading, hasMorePosts, handleScroll]);

  if (loading && posts.length === 0 && recommendedPosts.length === 0) {
    return (
      <LoadingContainer>
        <Spin size="large" tip="Loading your feed..." />
      </LoadingContainer>
    );
  }

  return (
    <div style={{ padding: '24px 0', background: '#f5f5f7', minHeight: '100vh' }}>
      <Container>
        <StorySection onStoryAdded={refreshFeed} />

        {postsLoading && recommendedPosts.length === 0 && loadingRecommended ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              action={
                <Space>
                  <Button 
                    onClick={refreshFeed}
                    icon={<ReloadOutlined />}
                  >
                    Retry
                  </Button>
                  <Button 
                    type="primary"
                    onClick={() => setCreateModalVisible(true)}
                    icon={<PlusOutlined />}
                  >
                    Create Post
                  </Button>
                </Space>
              }
            />
            {renderRecommendedPosts()}
          </div>
        ) : posts.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Button 
                onClick={refreshFeed} 
                loading={refreshing}
                icon={refreshing ? null : <SmileOutlined />}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Feed'}
              </Button>
            </div>
            
            {postsLoading && posts.length > 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" />
                <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                  Loading more posts...
                </div>
              </div>
            )}
            
            <List
              loading={postsLoading && posts.length === 0}
              dataSource={posts}
              renderItem={(post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onDelete={(postId) => {
                    setPosts(posts.filter(p => p.id !== postId));
                  }}
                />
              )}
              locale={{
                emptyText: (
                  <Empty 
                    description="No posts found. Follow more users or create your first post!" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
            
            {/* Add load more button */}
            {posts.length > 0 && hasMorePosts && (
              <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
                <Button 
                  onClick={loadMorePosts} 
                  loading={postsLoading}
                  icon={<ReloadOutlined />}
                >
                  Load More Posts
                </Button>
              </div>
            )}
            
            {posts.length > 0 && !hasMorePosts && (
              <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
                <Typography.Text type="secondary">
                  You've seen all posts
                </Typography.Text>
              </div>
            )}
          </>
        )}

        <CreatePostButton
          type="primary"
          shape="circle"
          icon={<PlusCircleOutlined />}
          onClick={() => setCreateModalVisible(true)}
          size="large"
        />

        <CreatePostModalStyled
          title={
            <ModalHeader>
              <ModalTitle level={4}>Create Post</ModalTitle>
            </ModalHeader>
          }
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            setMediaFile(null);
            setMediaPreview(null);
            setMediaType(null);
            setCaption('');
          }}
          footer={[
            <Button key="cancel" onClick={() => setCreateModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              loading={submitting}
              onClick={handleCreatePost}
              disabled={(!mediaFile && !caption.trim()) || submitting}
            >
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          ]}
          destroyOnClose
        >
          <ModalBody>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar src={user?.avatar} icon={<UserOutlined />} size={40} />
                <div style={{ marginLeft: '12px' }}>
                  <Text strong>{user?.username}</Text>
                </div>
                      </div>
              
              <TextArea
                placeholder="What's on your mind?"
                autoSize={{ minRows: 3, maxRows: 6 }}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{ marginBottom: '16px', borderRadius: '8px' }}
              />
              
              {mediaPreview && (
                <ImagePreviewContainer>
                  {mediaType === 'video' ? (
                    <VideoPreview 
                      src={mediaPreview} 
                      controls
                    />
                  ) : (
                    <ImagePreview 
                      src={mediaPreview} 
                      alt="Preview" 
                    />
                  )}
                  <RemovePreviewButton 
                    danger 
                    icon={<CloseCircleOutlined />} 
                    onClick={handleRemoveMedia}
                  />
                </ImagePreviewContainer>
              )}
              
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              <Space>
                <Button 
                  icon={<FileImageOutlined />}
                  onClick={() => fileInputRef.current.click()}
                >
                  Add Photo
                </Button>
                <Button 
                  icon={<VideoCameraOutlined />}
                  onClick={() => fileInputRef.current.click()}
                >
                  Add Video
                </Button>
              </Space>
            </Space>
          </ModalBody>
        </CreatePostModalStyled>
        </Container>
    </div>
  );
};

export default SocialMediaPage;