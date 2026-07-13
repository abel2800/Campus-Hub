import Constants from 'expo-constants';

const FALLBACK = process.env.EXPO_PUBLIC_API_HOST || '192.168.100.4';

/** Resolve API host at runtime (Expo Constants may be empty at module load). */
export function getApiHost(): string {
  const dbg = Constants.expoGoConfig as { debuggerHost?: string } | undefined;
  if (dbg?.debuggerHost) return dbg.debuggerHost.split(':')[0];
  const uri = Constants.expoConfig?.hostUri;
  if (uri) return uri.split(':')[0];
  return FALLBACK;
}

export function getApiUrl(): string {
  return `http://${getApiHost()}:5000/api`;
}

export const API_URL = getApiUrl();
export const BASE_URL = `http://${getApiHost()}:5000`;
