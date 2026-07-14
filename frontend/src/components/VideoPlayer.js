import React, { useRef, useEffect, useCallback } from 'react';
import { Alert, Progress } from 'antd';
import axios from '../utils/axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const isYouTubeUrl = (url = '') =>
  /youtu\.be\/|youtube\.com\/(watch|embed|shorts)/i.test(url);

const getYouTubeEmbedUrl = (url = '') => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else if (u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1];
    else if (u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1];
    else id = u.searchParams.get('v') || '';
    id = (id || '').split(/[?&]/)[0];
    if (!id) return null;
    // Embed stays on Campus Hub — no redirect to youtube.com
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
  } catch {
    return null;
  }
};

const resolveVideoUrl = (videoUrl) => {
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http') || videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')) {
    return videoUrl;
  }
  if (videoUrl.startsWith('/')) return `${API_BASE}${videoUrl}`;
  return `${API_BASE}/${videoUrl}`;
};

const VideoPlayer = ({ videoUrl, courseId, videoId, enrolled, onProgressUpdate }) => {
  const videoRef = useRef(null);
  const lastSentRef = useRef(0);
  const completedRef = useRef(false);

  const reportProgress = useCallback(async (pct, watchTime = 0) => {
    if (!enrolled || !courseId || !videoId) return;
    const rounded = Math.min(100, Math.max(0, Math.round(pct)));
    // Throttle: send every 5% or when complete
    if (rounded < 100 && rounded - lastSentRef.current < 5) return;
    lastSentRef.current = rounded;
    try {
      const { data } = await axios.put(`/api/courses/${courseId}/progress`, {
        videoId,
        progress: rounded,
        watchTime: Math.round(watchTime)
      });
      if (onProgressUpdate) onProgressUpdate(data);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [enrolled, courseId, videoId, onProgressUpdate]);

  useEffect(() => {
    lastSentRef.current = 0;
    completedRef.current = false;
  }, [videoId, videoUrl]);

  if (!videoUrl) {
    return <Alert message="No video selected" type="info" />;
  }

  if (isYouTubeUrl(videoUrl)) {
    const embed = getYouTubeEmbedUrl(videoUrl);
    if (!embed) {
      return <Alert message="Invalid YouTube URL" type="warning" />;
    }
    return (
      <div className="video-player-wrapper">
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            title="Course video"
            src={embed}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, maxHeight: 500 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {enrolled && courseId && videoId && (
          <div style={{ marginTop: 12 }}>
            <Progress percent={0} showInfo={false} size="small" />
            <button
              type="button"
              onClick={() => reportProgress(100, 0)}
              style={{
                marginTop: 8,
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #1677ff',
                background: '#1677ff',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Mark video as watched
            </button>
          </div>
        )}
      </div>
    );
  }

  const fullVideoUrl = resolveVideoUrl(videoUrl);
  const looksPlayable =
    /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(fullVideoUrl) ||
    fullVideoUrl.includes('/uploads/') ||
    fullVideoUrl.includes('/courses/') ||
    fullVideoUrl.startsWith('blob:') ||
    fullVideoUrl.startsWith('data:');

  if (!looksPlayable) {
    return (
      <Alert
        message="Unsupported video"
        description="This video format cannot be played in the browser. Teachers can upload MP4 files or paste a YouTube link."
        type="warning"
      />
    );
  }

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const pct = (el.currentTime / el.duration) * 100;
    if (pct >= 90 && !completedRef.current) {
      completedRef.current = true;
      reportProgress(100, el.currentTime);
    } else {
      reportProgress(pct, el.currentTime);
    }
  };

  const handleEnded = () => {
    const el = videoRef.current;
    completedRef.current = true;
    reportProgress(100, el?.currentTime || 0);
  };

  return (
    <div className="video-player-wrapper">
      <video
        ref={videoRef}
        controls
        width="100%"
        height="auto"
        src={fullVideoUrl}
        style={{ maxHeight: '500px' }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={(e) => console.error('Video error:', e)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
