const https = require('https');

const VIDEO_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([\w-]{11})/i,
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
];

const PLAYLIST_PATTERNS = [
  /[?&]list=([\w-]+)/i,
  /youtube\.com\/playlist\?list=([\w-]+)/i,
];

function extractVideoId(url = '') {
  const value = String(url).trim();
  for (const pattern of VIDEO_PATTERNS) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractPlaylistId(url = '') {
  const value = String(url).trim();
  for (const pattern of PLAYLIST_PATTERNS) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function isYouTubeUrl(url = '') {
  return /youtu\.be\/|youtube\.com\//i.test(String(url));
}

function watchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function thumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'CampusHub/1.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

/** Fetch title via YouTube oEmbed (no API key required). */
async function fetchVideoMeta(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube video URL');
  }
  const watch = watchUrl(videoId);
  try {
    const oembed = await fetchJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`
    );
    return {
      videoId,
      title: oembed.title || `YouTube Video ${videoId}`,
      thumbnail: oembed.thumbnail_url || thumbnailUrl(videoId),
      videoUrl: watch,
      duration: 0,
    };
  } catch {
    return {
      videoId,
      title: `YouTube Video ${videoId}`,
      thumbnail: thumbnailUrl(videoId),
      videoUrl: watch,
      duration: 0,
    };
  }
}

/** Fetch playlist items via YouTube Data API (requires YOUTUBE_API_KEY). */
async function fetchPlaylistVideos(playlistUrl) {
  const playlistId = extractPlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error('Invalid YouTube playlist URL');
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Playlist import requires YOUTUBE_API_KEY in backend .env. You can still add single YouTube video links.'
    );
  }

  const items = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: '50',
      key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );

    if (data.error) {
      throw new Error(data.error.message || 'YouTube API error');
    }

    (data.items || []).forEach((item) => {
      const videoId = item.contentDetails?.videoId;
      if (!videoId || videoId === 'deleted') return;
      items.push({
        videoId,
        title: item.snippet?.title || `Video ${videoId}`,
        thumbnail: item.snippet?.thumbnails?.medium?.url || thumbnailUrl(videoId),
        videoUrl: watchUrl(videoId),
        duration: 0,
      });
    });

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  if (items.length === 0) {
    throw new Error('No videos found in this playlist');
  }

  return { playlistId, videos: items };
}

module.exports = {
  extractVideoId,
  extractPlaylistId,
  isYouTubeUrl,
  watchUrl,
  thumbnailUrl,
  fetchVideoMeta,
  fetchPlaylistVideos,
};
