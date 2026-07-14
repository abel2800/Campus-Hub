export function isYouTubeUrl(url = '') {
  return /youtu\.be\/|youtube\.com\//i.test(String(url));
}

export function isYouTubePlaylistUrl(url = '') {
  return isYouTubeUrl(url) && /[?&]list=[\w-]+/i.test(String(url));
}
