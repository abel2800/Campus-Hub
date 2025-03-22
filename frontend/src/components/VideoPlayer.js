import React from 'react';
import { Alert } from 'antd';

const VideoPlayer = ({ videoUrl }) => {
  if (!videoUrl) {
    return <Alert message="No video selected" type="info" />;
  }

  // Check if the video URL is valid
  const isValidUrl = videoUrl && (
    videoUrl.endsWith('.mp4') || 
    videoUrl.endsWith('.webm') || 
    videoUrl.endsWith('.ogg') || 
    videoUrl.endsWith('.mov') || 
    videoUrl.endsWith('.avi') ||
    videoUrl.includes('/courses/') ||
    videoUrl.includes('/api/') ||
    videoUrl.startsWith('blob:') ||
    videoUrl.startsWith('data:')
  );

  if (!isValidUrl) {
    return (
      <Alert 
        message="Invalid Video Format" 
        description="The selected video cannot be played. It may be in an unsupported format."
        type="warning" 
      />
    );
  }

  // Ensure the URL has the correct format
  const fullVideoUrl = videoUrl.startsWith('http') || videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')
    ? videoUrl 
    : videoUrl.startsWith('/') 
      ? `${process.env.REACT_APP_API_URL || ''}${videoUrl}` 
      : `/${videoUrl}`;

  console.log('Playing video from URL:', fullVideoUrl);

  return (
    <div className="video-player-wrapper">
      <video 
        controls 
        width="100%" 
        height="auto"
        src={fullVideoUrl}
        style={{ maxHeight: '500px' }}
        onError={(e) => console.error('Video error:', e)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;