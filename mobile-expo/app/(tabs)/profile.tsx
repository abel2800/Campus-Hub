import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import { mediaUrl } from '../../src/utils/media';
import {
  Screen,
  Glass,
  GradButton,
  RingAvatar,
  GradThumb,
} from '../../src/components/campus/CampusUI';
import { initials } from '../../src/utils/format';

type Tab = 'posts' | 'courses' | 'friends';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, courses: 0, friends: 0 });

  const load = async () => {
    if (!user?.id) return;
    try {
      const [postsRes, coursesRes, friendsRes] = await Promise.all([
        api.get(`/posts/user/${user.id}`),
        api.get('/courses/user/enrolled'),
        api.get('/friends/list'),
      ]);
      const postList = Array.isArray(postsRes.data) ? postsRes.data : [];
      const courseList = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const friendList = Array.isArray(friendsRes.data) ? friendsRes.data : [];
      setPosts(postList);
      setCourses(courseList);
      setFriends(friendList);
      setStats({
        posts: postList.length,
        courses: courseList.length,
        friends: friendList.length,
      });
    } catch {
      setPosts([]);
      setCourses([]);
      setFriends([]);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handle = user?.username?.toLowerCase().replace(/\s+/g, '') || 'student';

  return (
    <Screen>
      <ScrollView style={styles.flex} contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...Gradients.banner]} style={styles.banner}>
          <View style={styles.bannerGlow} />
        </LinearGradient>

        <SafeAreaView edges={['top']} style={styles.body}>
          <View style={styles.avatarWrap}>
            <RingAvatar
              initials={initials(user?.username)}
              size={76}
              uri={mediaUrl(user?.avatar)}
            />
          </View>

          <Text style={styles.name}>{user?.username || 'Student'}</Text>
          <Text style={styles.handle}>
            @{handle}{user?.department ? ` · ${user.department}` : ''}
          </Text>
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}

          <View style={styles.actions}>
            <GradButton
              label="Edit profile"
              compact
              onPress={() => router.push('/edit-profile')}
              style={styles.editBtn}
            />
            <TouchableOpacity onPress={() => router.push('/(tabs)/friends')}>
              <Glass style={styles.shareBtn} padding={0}>
                <View style={styles.shareInner}>
                  <Ionicons name="people-outline" size={15} color={C.text} />
                </View>
              </Glass>
            </TouchableOpacity>
          </View>

          <Glass style={styles.stats} padding={10}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{stats.posts}</Text>
              <Text style={styles.statLbl}>Posts</Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <Text style={styles.statVal}>{stats.courses}</Text>
              <Text style={styles.statLbl}>Courses</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{stats.friends}</Text>
              <Text style={styles.statLbl}>Friends</Text>
            </View>
          </Glass>

          <View style={styles.tabs}>
            {(['posts', 'courses', 'friends'] as Tab[]).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)}>
                <Text style={[styles.tab, tab === t && styles.tabActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'posts' && (
            posts.length === 0 ? (
              <Text style={styles.tabEmpty}>No posts yet</Text>
            ) : (
              <View style={styles.grid}>
                {posts.map((p, i) => (
                  <View key={p.id} style={styles.gridItem}>
                    {p.imageUrl || p.mediaUrl ? (
                      <Image
                        source={{ uri: mediaUrl(p.imageUrl || p.mediaUrl) || '' }}
                        style={styles.gridImage}
                      />
                    ) : (
                      <GradThumb
                        width={100}
                        height={100}
                        colors={i % 2 === 0 ? Gradients.primary : Gradients.accent}
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </View>
                ))}
              </View>
            )
          )}

          {tab === 'courses' && (
            courses.length === 0 ? (
              <Text style={styles.tabEmpty}>No enrolled courses</Text>
            ) : (
              courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => router.push(`/course/${c.id}`)}
                >
                  <Glass style={styles.courseRow} padding={10}>
                    <Text style={styles.courseTitle}>{c.title || c.name}</Text>
                    <Text style={styles.courseProgress}>
                      {c.progress != null ? `${c.progress}% complete` : 'Enrolled'}
                    </Text>
                  </Glass>
                </TouchableOpacity>
              ))
            )
          )}

          {tab === 'friends' && (
            friends.length === 0 ? (
              <Text style={styles.tabEmpty}>
                No friends yet.{' '}
                <Text style={styles.link} onPress={() => router.push('/(tabs)/friends')}>
                  Find people
                </Text>
              </Text>
            ) : (
              friends.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => {
                    const id = f.friend?.id || f.id;
                    if (id) router.push(`/profile/${id}`);
                  }}
                >
                  <Glass style={styles.courseRow} padding={10}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <RingAvatar
                        initials={initials(f.friend?.username || f.username)}
                        size={36}
                        uri={mediaUrl(f.friend?.avatar || f.avatar)}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courseTitle}>
                          {f.friend?.username || f.username || 'User'}
                        </Text>
                        <Text style={styles.courseProgress}>
                          {f.friend?.department || f.department || ''}
                        </Text>
                      </View>
                    </View>
                  </Glass>
                </TouchableOpacity>
              ))
            )
          )}

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={16} color={C.g1a} />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingBottom: 100 },
  banner: { height: 110, position: 'relative' },
  bannerGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.g1a,
    opacity: 0.25,
  },
  body: { marginTop: -40, paddingHorizontal: 16 },
  avatarWrap: { marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: C.text },
  handle: { fontSize: 10, color: C.textMute, marginTop: 2, marginBottom: 6 },
  bio: { fontSize: 10, color: C.textDim, lineHeight: 15, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  editBtn: { flex: 1 },
  shareBtn: { width: 36, height: 36, borderRadius: 12 },
  shareInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: C.glassBorder,
  },
  statVal: { fontSize: 13, fontWeight: '700', color: C.text },
  statLbl: { fontSize: 9, color: C.textMute, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: C.glassBorder,
    paddingBottom: 8,
    marginBottom: 8,
  },
  tab: { fontSize: 11, color: C.textMute },
  tabActive: {
    color: C.text,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: C.g1a,
    paddingBottom: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: '31.5%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  tabEmpty: { color: C.textDim, fontSize: 12, textAlign: 'center', marginTop: 16 },
  link: { color: C.g1a },
  courseRow: { marginBottom: 8 },
  courseTitle: { fontSize: 12, fontWeight: '600', color: C.text },
  courseProgress: { fontSize: 10, color: C.textMute, marginTop: 2 },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    alignSelf: 'center',
  },
  settingsText: { color: C.g1a, fontSize: 13, fontWeight: '500' },
});
