import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  department?: string | null;
  bio?: string | null;
  avatar?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; username: string; department?: string }) => Promise<void>;
  requestRegisterOtp: (data: { email: string; password: string; username: string; department?: string }) => Promise<{ message: string }>;
  requestTeacherRegisterOtp: (data: { email: string; password: string; username: string; department: string }) => Promise<{ message: string }>;
  verifyRegisterOtp: (email: string, otp: string) => Promise<void>;
  verifyTeacherRegisterOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(data: any, fallback?: User): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    role: data.role || fallback?.role || 'student',
    department: data.department ?? null,
    bio: data.bio ?? null,
    avatar: data.avatar ?? null,
  };
}

function parseAuthResponse(data: any): { token: string; user: User } {
  const token = data?.token;
  const user = data?.user;
  if (!token || !user?.id) {
    throw new Error('Login failed: invalid server response');
  }
  return { token, user: mapUser(user) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const raw = await AsyncStorage.getItem('user');
        if (token && raw) {
          const cached = JSON.parse(raw) as User;
          setUser(cached);
          try {
            const { data } = await api.get('/auth/me');
            const refreshed = mapUser(data, cached);
            setUser(refreshed);
            await AsyncStorage.setItem('user', JSON.stringify(refreshed));
          } catch {
            /* keep cached user */
          }
        }
      } catch {
        await AsyncStorage.multiRemove(['token', 'user']);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = async (session: { token: string; user: User }) => {
    await AsyncStorage.setItem('token', session.token);
    await AsyncStorage.setItem('user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const login = async (email: string, password: string) => {
    const id = email.trim();
    const payload = id.includes('@')
      ? { email: id.toLowerCase(), password }
      : { username: id, password };
    const { data } = await api.post('/auth/login', payload);
    const session = parseAuthResponse(data);
    await persistSession(session);
    return session.user;
  };

  const requestRegisterOtp = async (payload: { email: string; password: string; username: string; department?: string }) => {
    const { data } = await api.post('/auth/register/request', {
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      username: payload.username.trim(),
      department: payload.department || '',
    });
    return { message: data.message };
  };

  const register = async (payload: { email: string; password: string; username: string; department?: string }) => {
    const result = await requestRegisterOtp(payload);
    const err: any = new Error(result.message || 'Verification code sent. Check the API terminal.');
    err.requiresOtp = true;
    throw err;
  };

  const verifyRegisterOtp = async (email: string, otp: string) => {
    const { data } = await api.post('/auth/register/verify', { email: email.toLowerCase().trim(), otp: otp.trim() });
    await persistSession(parseAuthResponse(data));
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    const refreshed = mapUser(data, user || undefined);
    await AsyncStorage.setItem('user', JSON.stringify(refreshed));
    setUser(refreshed);
  };

  const updateUser = async (patch: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    await AsyncStorage.setItem('user', JSON.stringify(next));
    setUser(next);
  };

  const requestTeacherRegisterOtp = async (payload: {
    email: string;
    password: string;
    username: string;
    department: string;
  }) => {
    const { data } = await api.post('/auth/register/teacher/request', {
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      username: payload.username.trim(),
      department: payload.department,
      isTeacher: true,
    });
    return { message: data.message };
  };

  const verifyTeacherRegisterOtp = async (email: string, otp: string) => {
    const { data } = await api.post('/auth/register/teacher/verify', {
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
    });
    await persistSession(parseAuthResponse(data));
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestRegisterOtp, requestTeacherRegisterOtp, verifyRegisterOtp, verifyTeacherRegisterOtp, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
