import { getApiHost } from '../config/api';

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const host = getApiHost();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `http://${host}:5000${clean}`;
}
