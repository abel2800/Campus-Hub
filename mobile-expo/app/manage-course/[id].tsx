import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import { Glass, GradButton, Screen } from '../../src/components/campus/CampusUI';

function isYouTubeUrl(url: string) {
  return /youtu\.be\/|youtube\.com\//i.test(url.trim());
}

function isPlaylistUrl(url: string) {
  return /[?&]list=|playlist/i.test(url.trim());
}

export default function ManageCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, vRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/videos`).catch(() => ({ data: [] })),
      ]);
      setCourse(cRes.data);
      setVideos(Array.isArray(vRes.data) ? vRes.data : vRes.data?.videos || []);
    } catch {
      setError('Could not load course');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner =
    user?.role === 'teacher' &&
    course &&
    (course.instructorId === user.id || course.instructor?.id === user.id);

  const addVideo = async () => {
    const url = youtubeUrl.trim();
    if (!url || !isYouTubeUrl(url)) {
      setError('Enter a valid YouTube URL');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isPlaylistUrl(url)) {
        const { data } = await api.post(
          `/teacher/courses/${id}/videos/youtube-playlist`,
          { playlistUrl: url },
        );
        Alert.alert('Imported', data?.message || 'Playlist imported');
      } else {
        await api.post(`/teacher/courses/${id}/videos/youtube`, {
          url,
          title: videoTitle.trim() || undefined,
          description: '',
        });
        Alert.alert('Added', 'YouTube video linked to this course');
      }
      setYoutubeUrl('');
      setVideoTitle('');
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to add video';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <SafeAreaView style={styles.flex}>
          <ActivityIndicator color={C.g1a} style={{ marginTop: 40 }} />
        </SafeAreaView>
      </Screen>
    );
  }

  if (!isOwner) {
    return (
      <Screen>
        <SafeAreaView style={styles.flex}>
          <View style={styles.center}>
            <Text style={styles.error}>You can only manage courses you teach.</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Manage course</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.pad}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.courseTitle}>{course?.title}</Text>
            <Text style={styles.meta}>{videos.length} videos</Text>

            <Glass style={styles.field} padding={12}>
              <Text style={styles.label}>Video title (optional)</Text>
              <TextInput
                style={styles.input}
                value={videoTitle}
                onChangeText={setVideoTitle}
                placeholder="Lecture title"
                placeholderTextColor={C.textMute}
                editable={!saving}
              />
              <Text style={[styles.label, { marginTop: 10 }]}>YouTube URL</Text>
              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Video or playlist URL"
                placeholderTextColor={C.textMute}
                editable={!saving}
              />
              <TouchableOpacity
                onPress={addVideo}
                disabled={saving}
                style={styles.addBtn}
              >
                <LinearGradient
                  colors={[...Gradients.accent]}
                  style={styles.addBtnInner}
                >
                  <Text style={styles.addBtnText}>
                    {saving ? 'Adding…' : 'Add YouTube video'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Glass>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.section}>Current videos</Text>
            {videos.length === 0 ? (
              <Text style={styles.meta}>No videos yet</Text>
            ) : (
              videos.map((v, i) => (
                <Glass key={v.id || i} style={styles.videoRow} padding={12}>
                  <Text style={styles.videoTitle}>
                    {i + 1}. {v.title || 'Untitled'}
                  </Text>
                </Glass>
              ))
            )}

            <GradButton
              label="Open course"
              onPress={() => router.push(`/course/${id}`)}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  pad: { paddingHorizontal: 16, paddingBottom: 40 },
  courseTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  meta: { color: C.textMute, fontSize: 12, marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 11, color: C.textMute, marginBottom: 6 },
  input: { fontSize: 15, color: C.text, padding: 0, minHeight: 22 },
  addBtn: { marginTop: 12 },
  addBtnInner: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBtnText: { color: C.onGrad, fontWeight: '700', fontSize: 13 },
  section: { fontSize: 15, fontWeight: '700', color: C.text, marginVertical: 10 },
  videoRow: { marginBottom: 8 },
  videoTitle: { color: C.text, fontSize: 13 },
  error: { color: C.danger, textAlign: 'center', marginVertical: 8 },
  link: { color: C.g1a, marginTop: 12 },
});
