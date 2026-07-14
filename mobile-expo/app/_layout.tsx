import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/theme/colors';

function RootNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const segment = segments[0];
    const authScreen =
      segment === 'login' ||
      segment === 'register' ||
      segment === 'teacher-register' ||
      segment === 'forgot-password' ||
      segment === 'reset-password';

    if (user && authScreen) {
      router.replace('/(tabs)');
    } else if (
      !user &&
      (segment === '(tabs)' ||
        segment === 'course' ||
        segment === 'chat' ||
        segment === 'notifications' ||
        segment === 'edit-profile' ||
        segment === 'settings' ||
        segment === 'profile' ||
        segment === 'create-course' ||
        segment === 'manage-course')
    ) {
      router.replace('/login');
    }
  }, [user, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: Colors.bg },
      }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Create account' }} />
        <Stack.Screen name="teacher-register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset password' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Course' }} />
        <Stack.Screen name="create-course" options={{ headerShown: false }} />
        <Stack.Screen name="manage-course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
