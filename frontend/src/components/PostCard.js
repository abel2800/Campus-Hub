import React, { useState } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Button, 
  Input, 
  Space, 
  Divider,
  Dropdown,
  Menu,
  Popconfirm,
  message,
  Image,
  Modal
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled, 
  CommentOutlined, 
  SendOutlined, 
  BookOutlined,
  BookFilled,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  FullscreenOutlined,
  ExpandOutlined,
  CloseOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../utils/axios';
import PostCaption from './PostCaption';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const PostContainer = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Username = styled(Text)`
  margin-left: 8px;
  font-weight: 500;
`;

const PostMedia = styled.div`
  margin: 16px -24px;
  text-align: center;
  max-height: 600px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  
  &:hover .media-overlay {
    opacity: 1;
  }
`;

const MediaOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
`;

const ExpandButton = styled.div`
  color: white;
  font-size: 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
  }
`;

const PostVideo = styled.video`
  width: 100%;
  max-height: 600px;
  object-fit: contain;
`;

const PostActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 16px;
`;

const ActionButton = styled(Button)`
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #1890ff;
    background: transparent;
  }
`;

const LikeButton = styled(ActionButton)`
  color: ${props => props.liked ? '#ff4d4f' : 'inherit'};
  
  &:hover {
    color: #ff4d4f;
  }
`;

const SaveButton = styled(ActionButton)`
  color: ${props => props.saved ? '#722ed1' : 'inherit'};
  
  &:hover {
    color: #722ed1;
  }
`;

const CommentSection = styled.div`
  margin-top: 16px;
`;

const CommentList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
`;

const CommentItem = styled.div`
  display: flex;
  margin-bottom: 12px;
`;

const CommentContent = styled.div`
  margin-left: 8px;
  flex: 1;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimeStamp = styled(Text)`
  color: #8c8c8c;
  font-size: 12px;
`;

const PostCard = ({ post, currentUser, onDelete, allowDelete = false }) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(false);
  const navigate = useNavigate();

  const toggleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/api/posts/${post.id}/unlike`);
        setLikesCount(prev => prev - 1);
      } else {
        await api.post(`/api/posts/${post.id}/like`);
        setLikesCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
      message.error('Failed to update like');
    }
  };

  const toggleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/api/posts/${post.id}/unsave`);
      } else {
        await api.post(`/api/posts/${post.id}/save`);
      }
      setSaved(!saved);
    } catch (error) {
      console.error('Error toggling save:', error);
      message.error('Failed to update save status');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.post(`/api/posts/${post.id}/comment`, {
        content: commentText
      });
      
      // Add new comment to list
      setComments([...comments, response.data]);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      message.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      message.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      message.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/api/posts/${post.id}`);
      message.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('Failed to delete post');
    }
  };

  const handleEditPost = () => {
    navigate(`/edit-post/${post.id}`);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    
    if (path.startsWith('http')) {
      return path;
    }
    
    return process.env.REACT_APP_API_URL + path;
  };

  const renderMedia = () => {
    if (!post.mediaUrl && !post.imageUrl) return null;
    
    const mediaUrl = post.mediaUrl || post.imageUrl;
    
    // Determine type of media based on the file extension or media type
    const isVideo = post.mediaType === 'video' || 
                   mediaUrl.match(/\.(mp4|webm|ogg)$/i);
    
    if (isVideo) {
      return (
        <PostMedia>
          <MediaOverlay className="media-overlay">
            <ExpandButton onClick={(e) => {
              e.stopPropagation();
              setMediaVisible(true);
            }}>
              <FullscreenOutlined />
            </ExpandButton>
          </MediaOverlay>
          <PostVideo 
            src={getImageUrl(mediaUrl)} 
            controls 
            onClick={(e) => e.stopPropagation()}
          />
        </PostMedia>
      );
    } else {
      return (
        <PostMedia onClick={() => setMediaVisible(true)}>
          <MediaOverlay className="media-overlay">
            <ExpandButton>
              <ExpandOutlined />
            </ExpandButton>
          </MediaOverlay>
          <Image
            src={getImageUrl(mediaUrl)}
            alt="Post"
            style={{ maxWidth: '100%' }}
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAAGP0lEQVR4nO3dz29UZRTH8e8dKFALpdCCKRJNkCKIgIYYY4JbSYwrN/4FbHBvdOle/wHXJq5cGF0hRgmBGCHBKPKrQsWWWgv9Yd/F84Sb6XQ6M7UzZ+55+H6ShWHofeae03Ofc19nhjnnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwCY1XPcACrP3uKS3JL0u6cDof/dLelrSLknNMcd8K+m8pF8l/SPpe0kXJF2OMNbHNvvsA/e4XR/Nzj+mYRj0qeGYk06SnTVL20r2T+vg9tIeZ1PNvs/1V5ImJH0i6eNRdLU2+EXnlv43y+/65KhHrXG9SZJ1JvPueY3RY0xLek/Sm5J2j/u86JMltcYcc0PSNUm/SfpF0jyjHgYDa57TyWc65LS/I6/upK7OlPUo62v2mYw+15EkfSbpg+TjlodzzNULt4NqhT2SpiQdlfRs9tEfj8Hp2O0o6+poHF1J35E0I2m2hMcsSn9GHh+yQZB9LOkVFRdUm7FP0luSTmcfoSxfStqy1tiBG7PTwblpO8dEt9PZznnbPnjFjjsqZlQjbyTPr9Tqq9HzS2aUkfxSRtMzrO44p2O7nLpHtfLKbOFGSc/5RJrRp2Gok9t3AirWgKrP5ug1TUtqxH7gPfY01e1ednPdUev0hk1NHbZ9E5M2aK98fwzS8+iHNBIH9JKSM+Dcp8bT8RdaUxo6L+nN0cfZDah6bY5eU0PSm7EfeEK6ffbUQufgKoGVVl7NZlP9gS+lE00mZyWdcV79fvT9MC3p3fhjrRVB1fPgNXXKfNB79vTU5RcrQfLIwDo2MWk3bu6wXrcb7QmNlGNO0pm3y+lEw8Vep/LCqIgPQVXEa2qU+aDP2LN2JnBuWcHKwNrXbGnm6qTt7bZs0G/ZuN5Bdc45nS5hcXU9EFR9FfGaGitbVqHjTv7Y95cCa++Ell1rlzXsCNiSflRyzGD0Zxmrq3UCKm59RbymRtkPvOfWxZ0PBdZkq2XTVyer2B5JCo9XZey6FoLoS53N+7oIqvjKfk2bDq2XPvlgVdA8qsCKsD1KGyXHNKLUwQgoKhc6LBVY7Ty3R2kFhYdXP/H9aqFjBFR9yn5NjTJO7Hzymq2E1tOjwNqKgfUwYEYeD0FVrzJfU2kz8o2u8T9efb2q4eL8l0FQJSGo8qvlmEEVCzvn1Et2T7vKcmgVWNUKe1XkGAGVTy3HLKrc62JIUimvq+1u29PdlnZ0t6UR4C+vV+YXUxcCqrjajom+uBut0C2Y04XTk3a40bTJG5PWGMTf/VQxo1qPgCq+tmNWcnGXdV2cy1vX78TsS9rXbNlPVydtOg2uKmbkOSx0zm2bP80FQVWe2o9ZUMPpYvK5zGWvmZPbJe3tdXTC05f+qsKM/L4IqnLVfswijlkZWjODG3Z0ZUb+/XLbf/YeZnZfq8q18kAEVflqP2YRx6yZkZ8rvpL/6YH5Fb/fM6zdUu8hqOKo/ZiFHbNmRh6ekcfjjmLiXKwp/JgFHXN1Rl5OfadqE/3eBDmrE7rMO4qJUNox9+yZzf/6KlXZqshzx/BYmJHfV+Zc7OZA99XOTG/VKnrwgcr2/WGLZ84ZeLTajlnFQRuqTdg9wCBhZlYCZuTFRZmLtTR7tnJoVZmgD1X2UmWzGXlxseZi7fdJNFVlbdtTQ/9Jfbfy5qXjXluTz1DtJ6P3VXR3tLkZeXGx5mIHm0/bqbXnsmZpO2Zfd0YO4LWZc/Lq6Oj3DtIqOrCW1n1u68i1JtR/t71h22OtrmpCUJXvgbmYxnOxS+v3+WlPv3/jSdvRaGl7j3TvONItMoP6fjT4uXV/hXa7tUEYrNv+BqP8lP9bCKrq3DcXy/W6uDyTSXMxl5m2pNdj01NNs+MBbSHIEo1BeFfUZtNVBFW17puL5X5dXDZoWJO5WLY9prPvVe2r7ZpbQ+2Gd22qqrUdV0EEVfXum4uFvC7eGdwYd3NqDw0bWuN65PZMbEpbJGnXQx7V/qfA4trSTKoY3VUFUu+p1UvvMV2bkiK0v93a/wAAAAAAAAAAAAAAAAAAAAAAAABj/A8Xjm6+M07PBQAAAABJRU5ErkJggg=="
            onError={(e) => {
              console.error('Failed to load image:', mediaUrl);
            }}
          />
        </PostMedia>
      );
    }
  };

  const renderPostMenu = () => {
    const items = [];
    
    if (allowDelete || (currentUser && post.user.id === currentUser.id)) {
      items.push({
        key: 'edit',
        label: 'Edit Post',
        icon: <EditOutlined />,
        onClick: handleEditPost
      });
      
      items.push({
        key: 'delete',
        label: 
          <Popconfirm
            title="Are you sure you want to delete this post?"
            onConfirm={handleDeletePost}
            okText="Yes"
            cancelText="No"
          >
            Delete Post
          </Popconfirm>,
        icon: <DeleteOutlined />,
        danger: true
      });
    }
    
    if (items.length === 0) return null;
    
    return (
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const formatTimeAgo = (dateString) => {
    return moment(dateString).fromNow();
  };

  return (
    <PostContainer>
      <PostHeader>
        <UserInfo 
          onClick={() => navigate(`/profile/${post.user.username}`)}
          style={{ cursor: 'pointer' }}
        >
          <Avatar 
            src={getImageUrl(post.user.avatar)} 
            icon={<UserOutlined />}
            size={40}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ marginLeft: 12 }}>
            <Username strong>{post.user.fullName || post.user.username}</Username>
            <div>
              <TimeStamp>{formatTimeAgo(post.createdAt)}</TimeStamp>
            </div>
          </div>
        </UserInfo>
        {renderPostMenu()}
      </PostHeader>
      
      {post.caption && (
        <PostCaption
          post={{
            ...post,
            username: post.user.username,
            caption: post.caption || post.content
          }}
          truncate={true}
          maxLength={150}
        />
      )}
      
      {renderMedia()}
      
      <PostActions>
        <ActionGroup>
          <LikeButton 
            liked={liked} 
            onClick={toggleLike}
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
          >
            {likesCount > 0 && <span style={{ marginLeft: 8 }}>{likesCount}</span>}
          </LikeButton>
          
          <ActionButton 
            icon={<CommentOutlined />} 
            onClick={() => setShowComments(!showComments)}
          >
            {comments.length > 0 && <span style={{ marginLeft: 8 }}>{comments.length}</span>}
          </ActionButton>
          
          <ActionButton 
            icon={<SendOutlined />} 
            onClick={() => {
              // Share functionality
              navigator.clipboard.writeText(
                `${window.location.origin}/post/${post.id}`
              );
              message.success('Link copied to clipboard');
            }}
          />
        </ActionGroup>
        
        <SaveButton 
          saved={saved} 
          onClick={toggleSave}
          icon={saved ? <BookFilled /> : <BookOutlined />}
        />
      </PostActions>
      
      {showComments && (
        <CommentSection>
          <Divider style={{ margin: '12px 0' }} />
          
          {comments.length > 0 ? (
            <CommentList>
              {comments.map(comment => (
                <CommentItem key={comment.id}>
                  <Avatar 
                    src={getImageUrl(comment.user.avatar)} 
                    icon={<UserOutlined />}
                    size="small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${comment.user.username}`)}
                  />
                  <CommentContent>
                    <CommentHeader>
                      <Text 
                        strong 
                        style={{ fontSize: 14, cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${comment.user.username}`)}
                      >
                        {comment.user.username}
                      </Text>
                      <Space>
                        <TimeStamp>{formatTimeAgo(comment.createdAt)}</TimeStamp>
                        {(currentUser && comment.user.id === currentUser.id) && (
                          <Popconfirm
                            title="Delete this comment?"
                            onConfirm={() => handleDeleteComment(comment.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        )}
                      </Space>
                    </CommentHeader>
                    <Text>{comment.content}</Text>
                  </CommentContent>
                </CommentItem>
              ))}
            </CommentList>
          ) : (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', margin: '12px 0' }}>
              No comments yet
            </Text>
          )}
          
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSubmitComment}
              loading={loading}
            />
          </Space.Compact>
        </CommentSection>
      )}

      {/* Full screen image preview modal */}
      <Modal
        open={mediaVisible}
        footer={null}
        onCancel={() => setMediaVisible(false)}
        width="100%"
        centered
        styles={{
          body: { 
            padding: 0, 
            background: 'black', 
            borderRadius: 0, 
            overflow: 'hidden',
            height: '100vh'
          },
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          },
          wrapper: {
            maxWidth: '100vw',
            maxHeight: '100vh'
          },
          content: {
            height: '100vh',
            maxWidth: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
        style={{ maxWidth: '100vw', top: 0, padding: 0, margin: 0 }}
      >
        {post.mediaType === 'video' || post.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
          <video
            src={getImageUrl(post.mediaUrl || post.imageUrl)}
            controls
            autoPlay
            style={{ 
              maxWidth: '95vw', 
              maxHeight: '90vh', 
              display: 'block',
              margin: 'auto',
              objectFit: 'contain'
            }}
          />
        ) : (
          <Image
            src={getImageUrl(post.mediaUrl || post.imageUrl)}
            style={{ 
              maxWidth: '95vw', 
              maxHeight: '90vh', 
              display: 'block',
              margin: 'auto',
              objectFit: 'contain'
            }}
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABmJLR0QA/wD/AP+gvaeTAAAGP0lEQVR4nO3dz29UZRTH8e8dKFALpdCCKRJNkCKIgIYYY4JbSYwrN/4FbHBvdOle/wHXJq5cGF0hRgmBGCHBKPKrQsWWWgv9Yd/F84Sb6XQ6M7UzZ+55+H6ShWHofeae03Ofc19nhjnnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwCY1XPcACrP3uKS3JL0u6cDof/dLelrSLknNMcd8K+m8pF8l/SPpe0kXJF2OMNbHNvvsA/e4XR/Nzj+mYRj0qeGYk06SnTVL20r2T+vg9tIeZ1PNvs/1V5ImJH0i6eNRdLU2+EXnlv43y+/65KhHrXG9SZJ1JvPueY3RY0xLek/Sm5J2j/u86JMltcYcc0PSNUm/SfpF0jyjHgYDa57TyWc65LS/I6/upK7OlPUo62v2mYw+15EkfSbpg+TjlodzzNULt4NqhT2SpiQdlfRs9tEfj8Hp2O0o6+poHF1J35E0I2m2hMcsSn9GHh+yQZB9LOkVFRdUm7FP0luSTmcfoSxfStqy1tiBG7PTwblpO8dEt9PZznnbPnjFjjsqZlQjbyTPr9Tqq9HzS2aUkfxSRtMzrO44p2O7nLpHtfLKbOFGSc/5RJrRp2Gok9t3AirWgKrP5ug1TUtqxH7gPfY01e1ednPdUev0hk1NHbZ9E5M2aK98fwzS8+iHNBIH9JKSM+Dcp8bT8RdaUxo6L+nN0cfZDah6bY5eU0PSm7EfeEK6ffbUQufgKoGVVl7NZlP9gS+lE00mZyWdcV79fvT9MC3p3fhjrRVB1fPgNXXKfNB79vTU5RcrQfLIwDo2MWk3bu6wXrcb7QmNlGNO0pm3y+lEw8Vep/LCqIgPQVXEa2qU+aDP2LN2JnBuWcHKwNrXbGnm6qTt7bZs0G/ZuN5Bdc45nS5hcXU9EFR9FfGaGitbVqHjTv7Y95cCa++Ell1rlzXsCNiSflRyzGD0Zxmrq3UCKm59RbymRtkPvOfWxZ0PBdZkq2XTVyer2B5JCo9XZey6FoLoS53N+7oIqvjKfk2bDq2XPvlgVdA8qsCKsD1KGyXHNKLUwQgoKhc6LBVY7Ty3R2kFhYdXP/H9aqFjBFR9yn5NjTJO7Hzymq2E1tOjwNqKgfUwYEYeD0FVrzJfU2kz8o2u8T9efb2q4eL8l0FQJSGo8qvlmEEVCzvn1Et2T7vKcmgVWNUKe1XkGAGVTy3HLKrc62JIUimvq+1u29PdlnZ0t6UR4C+vV+YXUxcCqrjajom+uBut0C2Y04XTk3a40bTJG5PWGMTf/VQxo1qPgCq+tmNWcnGXdV2cy1vX78TsS9rXbNlPVydtOg2uKmbkOSx0zm2bP80FQVWe2o9ZUMPpYvK5zGWvmZPbJe3tdXTC05f+qsKM/L4IqnLVfswijlkZWjODG3Z0ZUb+/XLbf/YeZnZfq8q18kAEVflqP2YRx6yZkZ8rvpL/6YH5Fb/fM6zdUu8hqOKo/ZiFHbNmRh6ekcfjjmLiXKwp/JgFHXN1Rl5OfadqE/3eBDmrE7rMO4qJUNox9+yZzf/6KlXZqshzx/BYmJHfV+Zc7OZA99XOTG/VKnrwgcr2/WGLZ84ZeLTajlnFQRuqTdg9wCBhZlYCZuTFRZmLtTR7tnJoVZmgD1X2UmWzGXlxseZi7fdJNFVlbdtTQ/9Jfbfy5qXjXluTz1DtJ6P3VXR3tLkZeXGx5mIHm0/bqbXnsmZpO2Zfd0YO4LWZc/Lq6Oj3DtIqOrCW1n1u68i1JtR/t71h22OtrmpCUJXvgbmYxnOxS+v3+WlPv3/jSdvRaGl7j3TvONItMoP6fjT4uXV/hXa7tUEYrNv+BqP8lP9bCKrq3DcXy/W6uDyTSXMxl5m2pNdj01NNs+MBbSHIEo1BeFfUZtNVBFW17puL5X5dXDZoWJO5WLY9prPvVe2r7ZpbQ+2Gd22qqrUdV0EEVfXum4uFvC7eGdwYd3NqDw0bWuN65PZMbEpbJGnXQx7V/qfA4trSTKoY3VUFUu+p1UvvMV2bkiK0v93a/wAAAAAAAAAAAAAAAAAAAAAAAABj/A8Xjm6+M07PBQAAAABJRU5ErkJggg=="
            onError={(e) => {
              console.error('Failed to load fullscreen image:', post.mediaUrl || post.imageUrl);
            }}
          />
        )}
        
        {/* Close button overlay */}
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={() => setMediaVisible(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Modal>
    </PostContainer>
  );
};

export default PostCard; 