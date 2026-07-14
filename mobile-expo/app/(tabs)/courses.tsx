import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { mediaUrl } from '../../src/utils/media';
import { C, Gradients } from '../../src/theme/colors';
import {
  Screen,
  Glass,
  ScreenTitle,
  SearchBar,
  Chip,
  ProgressBar,
} from '../../src/components/campus/CampusUI';

type Filter = 'all' | 'enrolled' | 'teaching';

export default function CoursesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [filter, setFilter] = useState<Filter>(isTeacher ? 'teaching' : 'all');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [teaching, setTeaching] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [allRes, mineRes, teachRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/user/enrolled').catch(() => ({ data: [] })),
        isTeacher
          ? api.get('/courses/teacher').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);
      setCourses(
        Array.isArray(allRes.data) ? allRes.data : allRes.data?.courses || [],
      );
      setEnrolled(Array.isArray(mineRes.data) ? mineRes.data : []);
      setTeaching(Array.isArray(teachRes.data) ? teachRes.data : []);
    } catch {
      setCourses([]);
      setError('Could not load courses. Pull to refresh.');
    }
  };

  useEffect(() => {
    load();
  }, [isTeacher]);

  const enroll = async (id: number) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      Alert.alert('Enrolled', 'You joined this course!');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not enroll');
    }
  };

  const enrolledMap = new Map(enrolled.map((c) => [c.id, c]));
  let list =
    filter === 'enrolled' ? enrolled : filter === 'teaching' ? teaching : courses;

  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        (c.title || c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q),
    );
  }

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.pad}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={C.g1a}
            />
          }
        >
          <ScreenTitle
            title="Courses"
            right={
              isTeacher ? (
                <TouchableOpacity
                  onPress={() => router.push('/create-course')}
                  style={styles.createChip}
                >
                  <Ionicons name="add" size={18} color={C.onGrad} />
                  <Text style={styles.createChipText}>New</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder="Search courses"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filters}>
            {isTeacher ? (
              <Chip
                label="Teaching"
                selected={filter === 'teaching'}
                onPress={() => setFilter('teaching')}
              />
            ) : null}
            <Chip
              label="All"
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label="Enrolled"
              glass
              selected={filter === 'enrolled'}
              onPress={() => setFilter('enrolled')}
            />
          </View>

          {error ? <Text style={styles.empty}>{error}</Text> : null}

          {list.length === 0 && !error ? (
            <Text style={styles.empty}>No courses found.</Text>
          ) : (
            list.map((c, i) => {
              const enrolledCourse = enrolledMap.get(c.id);
              const isOwn =
                filter === 'teaching' ||
                c.instructorId === user?.id ||
                c.instructor?.id === user?.id;
              const isEnrolled = !!enrolledCourse || filter === 'enrolled';
              const progress = isEnrolled
                ? (enrolledCourse?.progress ?? c.progress ?? 0)
                : null;
              const thumb = mediaUrl(c.imageUrl || c.thumbnail);
              const instructor = isOwn
                ? 'Your course'
                : c.teacher?.username ||
                  c.instructor?.username ||
                  (typeof c.instructor === 'string' ? c.instructor : null) ||
                  'Instructor';
              const videoCount = c.totalVideos || c.videos?.length || 0;

              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/course/${c.id}`)}
                >
                  <Glass style={styles.card} padding={0}>
                    <View style={styles.thumbHero}>
                      {thumb ? (
                        <Image
                          source={{ uri: thumb }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={
                            i % 2 === 0
                              ? [...Gradients.primary]
                              : [...Gradients.accent]
                          }
                          style={styles.thumbImg}
                        />
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(5,7,13,0.85)']}
                        style={styles.thumbFade}
                      />
                      {c.level ? (
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelText}>{c.level}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.body}>
                      <Text style={styles.rowTitle} numberOfLines={2}>
                        {c.title || c.name}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {instructor}
                        {videoCount ? ` · ${videoCount} videos` : ''}
                        {c.duration ? ` · ${c.duration}` : ''}
                      </Text>
                      {c.description ? (
                        <Text style={styles.desc} numberOfLines={3}>
                          {c.description}
                        </Text>
                      ) : null}

                      {progress != null ? (
                        <View style={styles.progressBlock}>
                          <View style={styles.progressRow}>
                            <Text style={styles.progressText}>
                              {progress}% complete
                            </Text>
                            <Ionicons
                              name="play-circle"
                              size={18}
                              color={C.g1a}
                            />
                          </View>
                          <ProgressBar value={progress} />
                        </View>
                      ) : isOwn ? (
                        <View style={styles.ownActions}>
                          <Text style={styles.rowSub}>
                            {c.enrollmentCount != null
                              ? `${c.enrollmentCount} students enrolled`
                              : 'Open course'}
                          </Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation?.();
                              router.push(`/manage-course/${c.id}`);
                            }}
                            style={styles.enrollChip}
                          >
                            <Text style={styles.enrollText}>Manage videos</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            enroll(c.id);
                          }}
                          style={styles.enrollChip}
                        >
                          <Text style={styles.enrollText}>Enroll now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Glass>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingBottom: 100 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  empty: { color: C.textDim, textAlign: 'center', marginTop: 40 },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  thumbHero: {
    height: 140,
    width: '100%',
    backgroundColor: C.avatarBg,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbFade: { ...StyleSheet.absoluteFillObject },
  levelBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: C.g1a,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  body: { padding: 14 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 11, color: C.textMute, marginTop: 4 },
  desc: {
    fontSize: 12,
    color: C.textDim,
    marginTop: 8,
    lineHeight: 18,
  },
  progressBlock: { marginTop: 12 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: { fontSize: 11, color: C.g2a, fontWeight: '600' },
  enrollChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,225,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  enrollText: { fontSize: 12, color: C.g1a, fontWeight: '700' },
  ownActions: { marginTop: 8, gap: 8 },
  createChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.g1a,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  createChipText: { color: C.onGrad, fontWeight: '800', fontSize: 12 },
});
