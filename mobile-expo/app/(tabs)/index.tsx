import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import {
  Screen,
  Glass,
  Chip,
  SectionLabel,
  RingAvatar,
  GlassIconBtn,
  GradThumb,
  ProgressBar,
} from '../../src/components/campus/CampusUI';

import { initials } from '../../src/utils/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [dashRes, coursesRes, mineRes, notifRes, reqRes] = await Promise.all([
        api.get('/mobile/dashboard').catch(() => ({ data: null })),
        api.get('/courses'),
        api.get('/courses/user/enrolled').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: [] })),
        api.get('/friends/requests/pending').catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data);
      const list = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      setCourses(list);
      setEnrolled(Array.isArray(mineRes.data) ? mineRes.data : []);
      const notifs = Array.isArray(notifRes.data) ? notifRes.data : [];
      const requests = Array.isArray(reqRes.data) ? reqRes.data : [];
      setNotifCount(
        notifs.filter((n: any) => !n.read).length + requests.length,
      );
    } catch {
      setCourses([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const continueCourse = enrolled[0];
  const explore = courses.slice(0, 2);
  const streak = dashboard?.gamification?.streak ?? dashboard?.streak ?? 0;
  const courseCount = enrolled.length;

  return (
    <Screen glow>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.g1a}
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greetSmall}>{greeting()}</Text>
              <Text style={styles.greetName}>
                {user?.username?.split(' ')[0] || user?.username || 'Student'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <GlassIconBtn
                icon="notifications-outline"
                badge={notifCount > 0}
                onPress={() => router.push('/notifications')}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <RingAvatar initials={initials(user?.username)} size={34} />
              </TouchableOpacity>
            </View>
          </View>

          {(streak > 0 || courseCount > 0) && (
            <View style={styles.chips}>
              {streak > 0 && (
                <Chip label={`${streak} day streak`} icon="flame" glass />
              )}
              {courseCount > 0 && (
                <Chip label={`${courseCount} courses`} icon="book-outline" glass />
              )}
            </View>
          )}

          <SectionLabel label="Continue learning" />
          {continueCourse ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/course/${continueCourse.id}`)}
            >
              <Glass style={styles.continueCard}>
                <View style={styles.continueRow}>
                  <GradThumb width={52} height={52} colors={Gradients.accent} />
                  <View style={styles.continueInfo}>
                    <Text style={styles.courseTitle}>
                      {continueCourse.title || continueCourse.name}
                    </Text>
                    <Text style={styles.courseMeta}>
                      {continueCourse.instructor?.username ||
                        continueCourse.teacher?.username ||
                        continueCourse.teacherName ||
                        'Instructor'}
                      {continueCourse.videos?.length
                        ? ` · Video ${Math.max(1, Math.round(((continueCourse.progress || 0) / 100) * continueCourse.videos.length))}/${continueCourse.videos.length}`
                        : ''}
                    </Text>
                    <ProgressBar value={continueCourse.progress ?? 0} />
                  </View>
                </View>
              </Glass>
            </TouchableOpacity>
          ) : (
            <Glass style={styles.continueCard}>
              <Text style={styles.emptyHint}>Browse courses to start learning</Text>
            </Glass>
          )}

          <SectionLabel
            label="Explore courses"
            action="See all"
            onAction={() => router.push('/(tabs)/courses')}
          />
          <View style={styles.grid}>
            {explore.length === 0 ? (
              <Glass style={styles.emptyExplore}>
                <Text style={styles.emptyHint}>No courses available yet</Text>
              </Glass>
            ) : (
              explore.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => c.id && router.push(`/course/${c.id}`)}
                  style={styles.gridItem}
                >
                  <Glass padding={10}>
                    <GradThumb
                      width="100%"
                      height={52}
                      colors={i % 2 === 0 ? Gradients.primary : Gradients.accent}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={styles.gridTitle}>{c.title || c.name}</Text>
                    <Text style={styles.gridSub}>
                      {c.teacher?.username || c.instructor || 'Professor'}
                    </Text>
                  </Glass>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  greetSmall: { fontSize: 11, color: C.textMute },
  greetName: { fontSize: 17, fontWeight: '700', color: C.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  continueCard: { marginHorizontal: 16, marginBottom: 16 },
  continueRow: { flexDirection: 'row', gap: 10 },
  continueInfo: { flex: 1, minWidth: 0 },
  courseTitle: { fontSize: 12, fontWeight: '600', color: C.text },
  courseMeta: { fontSize: 10, color: C.textMute, marginVertical: 4 },
  emptyHint: { fontSize: 12, color: C.textDim, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  gridItem: { flex: 1 },
  emptyExplore: { flex: 1, marginHorizontal: 16 },
  gridTitle: { fontSize: 11, fontWeight: '600', color: C.text },
  gridSub: { fontSize: 9, color: C.textMute, marginTop: 2 },
});
