import React from 'react';
import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const { Text } = Typography;

const CaptionContainer = styled.div`
  margin-bottom: 12px;
  word-break: break-word;
`;

const Username = styled(Link)`
  font-weight: 600;
  margin-right: 8px;
  color: #262626;
  &:hover {
    text-decoration: underline;
  }
`;

const Hashtag = styled(Link)`
  color: #0095f6;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

const Mention = styled(Link)`
  color: #0095f6;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * PostCaption component renders the caption of a post with clickable hashtags and mentions
 * @param {Object} props - Component props
 * @param {Object} props.post - The post object containing username and caption
 * @param {boolean} props.truncate - Whether to truncate the caption
 * @param {number} props.maxLength - Maximum length of caption before truncation
 */
const PostCaption = ({ post, truncate = false, maxLength = 100 }) => {
  if (!post || !post.caption) return null;

  const { caption } = post;
  
  // Function to truncate text
  const truncateText = (text) => {
    if (!truncate || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Function to render caption with clickable hashtags and mentions
  const renderCaptionWithLinks = () => {
    // Truncate the caption if needed
    const displayCaption = truncateText(caption);
    
    // Regular expressions for hashtags and mentions
    const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
    const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
    
    // Split the caption by hashtags and mentions
    let parts = displayCaption.split(hashtagRegex);
    
    // Process hashtags
    parts = parts.map((part, index) => {
      if (part.match(hashtagRegex)) {
        const hashtag = part.substring(1); // Remove the # symbol
        return (
          <Hashtag key={`hashtag-${index}`} to={`/explore/tags/${hashtag}`}>
            {part}
          </Hashtag>
        );
      }
      
      // Process mentions in the remaining text
      const mentionParts = part.split(mentionRegex);
      if (mentionParts.length === 1) return part;
      
      return mentionParts.map((mentionPart, mentionIndex) => {
        if (mentionPart.match(mentionRegex)) {
          const username = mentionPart.substring(1); // Remove the @ symbol
          return (
            <Mention key={`mention-${index}-${mentionIndex}`} to={`/profile/${username}`}>
              {mentionPart}
            </Mention>
          );
        }
        return mentionPart;
      });
    });
    
    return parts;
  };

  return (
    <CaptionContainer>
      {post.username && (
        <Username to={`/profile/${post.username}`}>{post.username}</Username>
      )}
      <Text>{renderCaptionWithLinks()}</Text>
    </CaptionContainer>
  );
};

export default PostCaption; 