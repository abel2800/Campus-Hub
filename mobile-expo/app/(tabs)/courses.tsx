import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import {
  Screen,
  Glass,
  ScreenTitle,
  SearchBar,
  Chip,
  GradThumb,
} from '../../src/components/campus/CampusUI';

type Filter = 'all' | 'enrolled' | 'saved';

const THUMB_COLORS = [Gradients.primary, Gradients.accent, Gradients.mixed] as const;

export default function CoursesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [allRes, mineRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/user/enrolled').catch(() => ({ data: [] })),
      ]);
      setCourses(
        Array.isArray(allRes.data) ? allRes.data : allRes.data?.courses || [],
      );
      setEnrolled(Array.isArray(mineRes.data) ? mineRes.data : []);
    } catch {
      setCourses([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const enroll = async (id: number) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      Alert.alert('Enrolled', 'You joined this course!');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not enroll');
    }
  };

  const enrolledIds = new Set(enrolled.map((c) => c.id));
  let list =
    filter === 'enrolled'
      ? enrolled
      : filter === 'saved'
        ? courses.filter((c) => c.saved)
        : courses;

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
          <ScreenTitle title="Courses" />
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder="Search courses"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filters}>
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
            <Chip
              label="Saved"
              glass
              selected={filter === 'saved'}
              onPress={() => setFilter('saved')}
            />
          </View>

          {list.length === 0 ? (
            <Text style={styles.empty}>No courses found.</Text>
          ) : (
            list.map((c, i) => {
              const isEnrolled = enrolledIds.has(c.id) || filter === 'enrolled';
              const progress = isEnrolled ? (c.progress ?? 0) : null;
              const colors = THUMB_COLORS[i % THUMB_COLORS.length];

              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/course/${c.id}`)}
                >
                  <Glass style={styles.row} padding={10}>
                    <View style={styles.rowInner}>
                    <View style={styles.thumbWrap}>
                      <GradThumb width={56} height={56} colors={colors} style={{ borderRadius: 12 }} />
                      {progress != null && (
                        <View style={styles.progressRing}>
                          <View style={styles.progressRingInner} />
                        </View>
                      )}
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{c.title || c.name}</Text>
                      <Text style={styles.rowSub}>
                        {c.teacher?.username || c.instructor || 'Instructor'}
                      </Text>
                      {progress != null ? (
                        <Text style={styles.progressText}>{progress}% complete</Text>
                      ) : (
                        <TouchableOpacity onPress={() => enroll(c.id)}>
                          <View style={styles.enrollChip}>
                            <Text style={styles.enrollText}>Enroll</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
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
  pad: { paddingBottom: 40 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  empty: { color: C.textDim, textAlign: 'center', marginTop: 40 },
  row: { marginHorizontal: 16, marginBottom: 10 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumbWrap: { position: 'relative' },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg2,
  },
  rowInfo: { flex: 1, marginLeft: 10 },
  rowTitle: { fontSize: 11, fontWeight: '600', color: C.text },
  rowSub: { fontSize: 9, color: C.textMute, marginVertical: 2 },
  progressText: { fontSize: 9, color: C.g2a },
  enrollChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,225,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 2,
  },
  enrollText: { fontSize: 9, color: C.g1a, fontWeight: '500' },
});
