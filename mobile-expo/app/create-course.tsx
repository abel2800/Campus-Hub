import { useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { C, Gradients } from '../src/theme/colors';
import { Glass, GradButton, Screen, Chip } from '../src/components/campus/CampusUI';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
  'programming',
  'design',
  'business',
  'marketing',
  'science',
  'language',
  'other',
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];

type PendingVideo = {
  id: string;
  url: string;
  title: string;
  source: 'youtube' | 'playlist';
};

function isYouTubeUrl(url: string) {
  return /youtu\.be\/|youtube\.com\//i.test(url.trim());
}

function isPlaylistUrl(url: string) {
  return /[?&]list=|playlist/i.test(url.trim());
}

export default function CreateCourseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [duration, setDuration] = useState('8 weeks');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videos, setVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => title.trim().length > 0 && description.trim().length > 0 && !loading,
    [title, description, loading],
  );

  if (!isTeacher) {
    return (
      <Screen>
        <SafeAreaView style={styles.flex}>
          <View style={styles.center}>
            <Text style={styles.error}>Only teachers can create courses.</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  const addVideo = () => {
    const url = youtubeUrl.trim();
    if (!url) {
      setError('Paste a YouTube video or playlist URL');
      return;
    }
    if (!isYouTubeUrl(url)) {
      setError('Enter a valid YouTube URL');
      return;
    }
    const source = isPlaylistUrl(url) ? 'playlist' : 'youtube';
    setVideos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        url,
        title: videoTitle.trim() || (source === 'playlist' ? 'YouTube playlist' : 'YouTube video'),
        source,
      },
    ]);
    setYoutubeUrl('');
    setVideoTitle('');
    setError('');
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (videos.length === 0) {
      Alert.alert(
        'Add at least one video',
        'Paste a YouTube link (or playlist) so students have something to watch.',
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('level', level);
      formData.append('duration', duration.trim() || '8 weeks');
      formData.append('status', 'Open');
      formData.append(
        'department',
        category.charAt(0).toUpperCase() + category.slice(1),
      );
      if (user?.id) {
        formData.append('instructorId', String(user.id));
        formData.append('teacherId', String(user.id));
      }

      const { data: course } = await api.post('/courses', formData);
      const courseId = course?.id;
      if (!courseId) {
        throw new Error('Course created but no ID returned');
      }

      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (v.source === 'playlist') {
          await api.post(`/teacher/courses/${courseId}/videos/youtube-playlist`, {
            playlistUrl: v.url,
          });
        } else {
          await api.post(`/teacher/courses/${courseId}/videos/youtube`, {
            url: v.url,
            title: v.title,
            description: `Video for ${title.trim()}`,
            order: i + 1,
          });
        }
      }

      Alert.alert('Course published', 'Your course is live for students.', [
        {
          text: 'View course',
          onPress: () => router.replace(`/course/${courseId}`),
        },
      ]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Could not create course';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.topTitle}>Create course</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.pad}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.hint}>
              Publish a course from your phone — same as the web teacher dashboard.
            </Text>

            <Glass style={styles.field} padding={12}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Intro to Algorithms"
                placeholderTextColor={C.textMute}
                editable={!loading}
              />
            </Glass>

            <Glass style={styles.field} padding={12}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="What will students learn?"
                placeholderTextColor={C.textMute}
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </Glass>

            <Text style={styles.label}>Category</Text>
            <View style={styles.levelRow}>
              {CATEGORIES.map((c) => (
                <View key={c} style={styles.chipWrap}>
                  <Chip
                    label={c}
                    selected={category === c}
                    onPress={() => setCategory(c)}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.label}>Level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((l) => (
                <View key={l} style={styles.chipWrap}>
                  <Chip
                    label={l}
                    selected={level === l}
                    onPress={() => setLevel(l)}
                  />
                </View>
              ))}
            </View>

            <Glass style={styles.field} padding={12}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="8 weeks"
                placeholderTextColor={C.textMute}
                editable={!loading}
              />
            </Glass>

            <Text style={styles.section}>Videos (YouTube)</Text>
            <Glass style={styles.field} padding={12}>
              <Text style={styles.label}>Video title (optional)</Text>
              <TextInput
                style={styles.input}
                value={videoTitle}
                onChangeText={setVideoTitle}
                placeholder="Lecture 1"
                placeholderTextColor={C.textMute}
                editable={!loading}
              />
              <Text style={[styles.label, { marginTop: 10 }]}>YouTube URL *</Text>
              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://youtube.com/watch?v=… or playlist"
                placeholderTextColor={C.textMute}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={addVideo}
                disabled={loading}
                style={styles.addBtn}
              >
                <LinearGradient
                  colors={[...Gradients.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addBtnInner}
                >
                  <Ionicons name="add" size={18} color={C.onGrad} />
                  <Text style={styles.addBtnText}>Add video / playlist</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Glass>

            {videos.map((v) => (
              <Glass key={v.id} style={styles.videoRow} padding={12}>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {v.title}
                  </Text>
                  <Text style={styles.videoUrl} numberOfLines={1}>
                    {v.source === 'playlist' ? 'Playlist · ' : ''}
                    {v.url}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeVideo(v.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={C.danger} />
                </TouchableOpacity>
              </Glass>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradButton
              label={loading ? 'Publishing…' : 'Publish course'}
              onPress={submit}
              style={styles.submit}
            />
            {loading ? (
              <ActivityIndicator color={C.g1a} style={{ marginTop: 12 }} />
            ) : null}
            <View style={{ height: 40 }} />
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
  pad: { paddingHorizontal: 16, paddingBottom: 24 },
  hint: { color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 18 },
  field: { marginBottom: 12 },
  label: { fontSize: 11, color: C.textMute, marginBottom: 6 },
  input: { fontSize: 15, color: C.text, padding: 0, minHeight: 22 },
  multiline: { minHeight: 90 },
  chipScroll: { marginBottom: 12, maxHeight: 40 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chipWrap: { marginRight: 8, marginBottom: 8 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginTop: 8,
    marginBottom: 10,
  },
  addBtn: { marginTop: 12 },
  addBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
  addBtnText: { color: C.onGrad, fontWeight: '700', fontSize: 13 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  videoInfo: { flex: 1, minWidth: 0 },
  videoTitle: { color: C.text, fontWeight: '600', fontSize: 13 },
  videoUrl: { color: C.textMute, fontSize: 11, marginTop: 2 },
  error: { color: C.danger, textAlign: 'center', marginVertical: 8 },
  link: { color: C.g1a, marginTop: 12 },
  submit: { marginTop: 8 },
});
