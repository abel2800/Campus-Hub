import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { getApiHost } from '../../src/config/api';
import { mediaUrl } from '../../src/utils/media';
import { C, Gradients } from '../../src/theme/colors';
import { Glass, ProgressBar } from '../../src/components/campus/CampusUI';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = Math.round((SCREEN_W - 32) * 9 / 16);

function resolveMediaUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const host = getApiHost();
  if (url.startsWith('/')) return `http://${host}:5000${url}`;
  return `http://${host}:5000/${url}`;
}

function extractYouTubeId(url = '') {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split(/[?&]/)[0];
    if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split(/[?&]/)[0];
    if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split(/[?&]/)[0];
    return u.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

function isYouTube(url = '') {
  return /youtu\.be\/|youtube\.com\//i.test(url);
}

function youtubeEmbedHtml(videoId: string) {
  // Plays inside the app WebView — no redirect to YouTube app/site
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&fs=1`;
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}
  iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
</style></head><body>
<iframe
  src="${src}"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
</body></html>`;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<Video>(null);
  const lastSent = useRef(0);
  const completed = useRef(false);

  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, vRes, eRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/videos`).catch(() => ({ data: [] })),
        api.get('/courses/user/enrolled').catch(() => ({ data: [] })),
      ]);
      setCourse(cRes.data);
      const list = Array.isArray(vRes.data) ? vRes.data : vRes.data?.videos || [];
      setVideos(list);
      if (list.length) setSelected(list[0]);

      const enrolledList = Array.isArray(eRes.data) ? eRes.data : [];
      const match = enrolledList.find((c: any) => String(c.id) === String(id));
      setEnrolled(!!match);
      if (match) setProgress(match.progress || 0);
    } catch {
      Alert.alert('Error', 'Could not load course');
      router.back();
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const reportProgress = async (pct: number, watchTime = 0) => {
    if (!enrolled || !selected?.id) return;
    const rounded = Math.min(100, Math.max(0, Math.round(pct)));
    if (rounded < 100 && rounded - lastSent.current < 5) return;
    lastSent.current = rounded;
    try {
      const { data } = await api.put(`/courses/${id}/progress`, {
        videoId: selected.id,
        progress: rounded,
        watchTime: Math.round(watchTime),
      });
      if (data?.progress != null) setProgress(data.progress);
    } catch (e) {
      console.warn('progress update failed', e);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded || !status.durationMillis) return;
    const pct = (status.positionMillis / status.durationMillis) * 100;
    if (pct >= 90 && !completed.current) {
      completed.current = true;
      reportProgress(100, status.positionMillis / 1000);
    } else {
      reportProgress(pct, status.positionMillis / 1000);
    }
    if (status.didJustFinish) {
      completed.current = true;
      reportProgress(100, status.positionMillis / 1000);
    }
  };

  const enroll = async () => {
    try {
      setEnrolling(true);
      await api.post(`/courses/${id}/enroll`);
      setEnrolled(true);
      Alert.alert('Enrolled', 'You can now watch the videos.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || '';
      if (/already enrolled/i.test(msg)) {
        setEnrolled(true);
      } else {
        Alert.alert('Error', msg || 'Could not enroll');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const selectVideo = (v: any) => {
    lastSent.current = 0;
    completed.current = false;
    setSelected(v);
  };

  if (!course) {
    return (
      <View style={styles.loading}>
        <Text style={styles.muted}>Loading course…</Text>
      </View>
    );
  }

  const thumb =
    mediaUrl(course.imageUrl || course.thumbnail) ||
    (selected?.thumbnail ? mediaUrl(selected.thumbnail) : null);
  const mediaUri = resolveMediaUrl(selected?.videoUrl);
  const yt = isYouTube(selected?.videoUrl || '');
  const ytId = yt ? extractYouTubeId(selected?.videoUrl || '') : '';
  const instructor =
    course.instructor?.username ||
    course.teacher?.username ||
    (typeof course.instructor === 'string' ? course.instructor : null) ||
    'Instructor';
  const isOwner =
    user?.role === 'teacher' &&
    (course.instructorId === user?.id || course.instructor?.id === user?.id);
  const canWatch = enrolled || isOwner;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
          <View style={styles.backRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
              <Text style={styles.backText}>Courses</Text>
            </TouchableOpacity>
            {isOwner ? (
              <TouchableOpacity
                onPress={() => router.push(`/manage-course/${id}`)}
                style={styles.manageBtn}
              >
                <Ionicons name="create-outline" size={16} color={C.onGrad} />
                <Text style={styles.manageText}>Manage</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Hero thumbnail */}
          <View style={styles.hero}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.heroImg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={[...Gradients.banner]} style={styles.heroImg} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(5,7,13,0.95)']}
              style={styles.heroFade}
            />
            <View style={styles.heroMeta}>
              <Text style={styles.level}>{course.level || 'Course'}</Text>
              <Text style={styles.title}>{course.title}</Text>
              <Text style={styles.metaLine}>
                {instructor}
                {course.totalVideos || videos.length
                  ? ` · ${course.totalVideos || videos.length} videos`
                  : ''}
                {course.duration ? ` · ${course.duration}` : ''}
              </Text>
            </View>
          </View>

          <Glass style={styles.descCard} padding={14}>
            <Text style={styles.sectionLabel}>About this course</Text>
            <Text style={styles.desc}>
              {course.description || 'No description provided.'}
            </Text>
            {enrolled ? (
              <View style={styles.progressBlock}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Your progress</Text>
                  <Text style={styles.progressPct}>{progress}%</Text>
                </View>
                <ProgressBar value={progress} />
              </View>
            ) : isOwner ? (
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={() => router.push(`/manage-course/${id}`)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[...Gradients.accent]} style={styles.enrollGrad}>
                  <Text style={styles.enrollText}>Add YouTube videos</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={enroll}
                disabled={enrolling}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[...Gradients.primary]} style={styles.enrollGrad}>
                  <Text style={styles.enrollText}>
                    {enrolling ? 'Enrolling…' : 'Enroll in this course'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Glass>

          <Text style={styles.section}>Lessons ({videos.length})</Text>

          {!canWatch ? (
            <Glass style={styles.lockCard} padding={16}>
              <Ionicons name="lock-closed" size={20} color={C.textMute} />
              <Text style={styles.lockText}>
                Enroll to watch videos in the app and track progress to 100%.
              </Text>
            </Glass>
          ) : (
            <>
              {selected ? (
                <Glass style={styles.playerCard} padding={10}>
                  <Text style={styles.videoTitle}>{selected.title}</Text>
                  {yt && ytId ? (
                    <>
                      <View style={styles.playerFrame}>
                        <WebView
                          key={ytId}
                          style={styles.webview}
                          originWhitelist={['*']}
                          source={{ html: youtubeEmbedHtml(ytId) }}
                          allowsFullscreenVideo
                          allowsInlineMediaPlayback
                          mediaPlaybackRequiresUserAction={false}
                          javaScriptEnabled
                          domStorageEnabled
                          scrollEnabled={false}
                          setSupportMultipleWindows={false}
                          onShouldStartLoadWithRequest={(req) => {
                            // Keep playback inside the WebView; block leaving to YouTube
                            const u = req.url || '';
                            if (
                              u.startsWith('about:') ||
                              u.includes('youtube-nocookie.com') ||
                              u.includes('youtube.com/embed') ||
                              u.includes('googlevideo.com') ||
                              u.includes('ytimg.com')
                            ) {
                              return true;
                            }
                            return false;
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.markBtn}
                        onPress={() => reportProgress(100, 0)}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={C.g2a} />
                        <Text style={styles.markText}>Mark as watched</Text>
                      </TouchableOpacity>
                    </>
                  ) : mediaUri ? (
                    <Video
                      ref={videoRef}
                      style={styles.nativeVideo}
                      source={{ uri: mediaUri }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                    />
                  ) : (
                    <Text style={styles.muted}>No playable video URL</Text>
                  )}
                </Glass>
              ) : null}

              {videos.map((v, idx) => {
                const active = selected?.id === v.id;
                const vThumb = mediaUrl(v.thumbnail);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.videoCard, active && styles.videoCardActive]}
                    onPress={() => selectVideo(v)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.videoThumbWrap}>
                      {vThumb ? (
                        <Image source={{ uri: vThumb }} style={styles.videoThumb} />
                      ) : (
                        <View style={[styles.videoThumb, styles.videoThumbEmpty]}>
                          <Ionicons name="play" size={18} color={C.g1a} />
                        </View>
                      )}
                      <Text style={styles.videoIndex}>{idx + 1}</Text>
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {v.title || `Video ${v.id}`}
                      </Text>
                      {v.description ? (
                        <Text style={styles.muted} numberOfLines={2}>
                          {v.description}
                        </Text>
                      ) : isYouTube(v.videoUrl) ? (
                        <Text style={styles.muted}>YouTube lesson</Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons name="play-circle" size={24} color={C.g1a} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={C.textMute} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  loading: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingBottom: 40 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: { color: C.text, marginLeft: 4, fontWeight: '600' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.g1a,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  manageText: { color: C.onGrad, fontWeight: '800', fontSize: 12 },
  hero: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroFade: { ...StyleSheet.absoluteFillObject },
  heroMeta: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  level: {
    color: C.g1a,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { color: C.text, fontSize: 22, fontWeight: '800' },
  metaLine: { color: C.textDim, marginTop: 4, fontSize: 12 },
  descCard: { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: {
    color: C.textMute,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  desc: { color: C.textDim, lineHeight: 21, fontSize: 13 },
  progressBlock: { marginTop: 14 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { color: C.textDim, fontSize: 12 },
  progressPct: { color: C.g1a, fontWeight: '700', fontSize: 12 },
  enrollBtn: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  enrollGrad: { paddingVertical: 13, alignItems: 'center' },
  enrollText: { color: C.onGrad, fontWeight: '800', fontSize: 14 },
  section: {
    color: C.text,
    fontWeight: '700',
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  lockCard: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockText: { color: C.textDim, flex: 1, fontSize: 13, lineHeight: 18 },
  playerCard: { marginHorizontal: 16, marginBottom: 12 },
  playerFrame: {
    width: '100%',
    height: PLAYER_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 8,
  },
  webview: { flex: 1, backgroundColor: '#000' },
  nativeVideo: {
    width: '100%',
    height: PLAYER_H,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#000',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,255,178,0.1)',
  },
  markText: { color: C.g2a, fontWeight: '700', fontSize: 13 },
  videoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: C.glass,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoCardActive: { borderColor: C.g1a },
  videoThumbWrap: { position: 'relative' },
  videoThumb: { width: 64, height: 44, borderRadius: 8, backgroundColor: C.avatarBg },
  videoThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  videoIndex: {
    position: 'absolute',
    left: 4,
    bottom: 2,
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  videoInfo: { flex: 1, minWidth: 0 },
  videoTitle: { color: C.text, fontWeight: '600', fontSize: 13 },
  muted: { color: C.textMute, marginTop: 3, fontSize: 11 },
});
