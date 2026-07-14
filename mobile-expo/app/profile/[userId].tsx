import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { C } from '../../src/theme/colors';
import { Screen, Glass, GradButton, RingAvatar } from '../../src/components/campus/CampusUI';
import { initials, timeAgo } from '../../src/utils/format';
import { mediaUrl } from '../../src/utils/media';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: me } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'friends'>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  const isOwn = me && String(me.id) === String(userId);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      if (isOwn) {
        router.replace('/(tabs)/profile');
        return;
      }
      const uRes = await api.get(`/users/${userId}`);
      setProfile(uRes.data);

      if (uRes.data.canViewPosts) {
        const pRes = await api.get(`/posts/user/${userId}`);
        setPosts(Array.isArray(pRes.data) ? pRes.data : []);
      } else {
        setPosts([]);
      }
    } catch {
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isOwn, router]);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = async () => {
    try {
      setBusy(true);
      await api.post('/friends/request', { receiverId: Number(userId) });
      Alert.alert('Sent', 'Friend request sent');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not send request');
    } finally {
      setBusy(false);
    }
  };

  const acceptRequest = async () => {
    try {
      setBusy(true);
      if (!profile?.requestId) {
        Alert.alert('Error', 'No pending request');
        return;
      }
      await api.post(`/friends/requests/${profile.requestId}/accept`);
      Alert.alert('Friends', 'Friend request accepted');
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not accept';
      if (String(msg).toLowerCase().includes('not found')) {
        await load();
        return;
      }
      Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  const like = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`);
      await load();
    } catch {
      /* ignore */
    }
  };

  const comment = async (postId: number) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;
    try {
      await api.post(`/posts/${postId}/comment`, { content });
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not comment');
    }
  };

  const status = profile?.friendshipStatus;
  const avatar = mediaUrl(profile?.avatar || profile?.avatarUrl);

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{profile?.username || 'Profile'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
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
          {loading && <Text style={styles.muted}>Loading…</Text>}

          {profile && (
            <Glass style={styles.header} padding={16}>
              <RingAvatar
                initials={initials(profile.username)}
                size={76}
                uri={avatar}
              />
              <Text style={styles.name}>{profile.username}</Text>
              {!!profile.department && (
                <Text style={styles.muted}>{profile.department}</Text>
              )}
              {profile.isPrivate && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={12} color={C.g1a} />
                  <Text style={styles.privateText}>Private account</Text>
                </View>
              )}
              <Text style={styles.bio}>
                {profile.bio?.trim() ? profile.bio : 'No bio yet.'}
              </Text>

              <View style={styles.actions}>
                {status === 'accepted' && (
                  <GradButton
                    label="Message"
                    onPress={() => router.push(`/chat/${profile.id}`)}
                  />
                )}
                {status === 'incoming' && (
                  <GradButton
                    label={busy ? 'Accepting…' : 'Accept request'}
                    onPress={acceptRequest}
                  />
                )}
                {status === 'pending' && (
                  <Text style={styles.pending}>Friend request sent</Text>
                )}
                {status === 'none' && (
                  <GradButton
                    label={busy ? 'Sending…' : 'Add friend'}
                    onPress={sendRequest}
                  />
                )}
              </View>
            </Glass>
          )}

          {profile?.canViewPosts === false ? (
            <Glass padding={16}>
              <Ionicons name="lock-closed" size={28} color={C.textMute} style={{ alignSelf: 'center' }} />
              <Text style={[styles.muted, { marginTop: 10 }]}>
                This account is private. Follow / friend them to see posts, courses, and friends.
              </Text>
            </Glass>
          ) : (
            <>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, tab === 'posts' && styles.tabActive]}
                  onPress={() => setTab('posts')}
                >
                  <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, tab === 'friends' && styles.tabActive]}
                  onPress={() => setTab('friends')}
                >
                  <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
                    Friends{profile?.friendsCount != null ? ` (${profile.friendsCount})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {tab === 'friends' && (
                profile?.canViewFriends === false ? (
                  <Text style={styles.muted}>Friend list is hidden.</Text>
                ) : (profile?.friends || []).length === 0 ? (
                  <Text style={styles.muted}>No friends to show.</Text>
                ) : (
                  (profile.friends || []).map((f: any) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => router.push(`/profile/${f.id}`)}
                    >
                      <Glass style={styles.friendRow} padding={12}>
                        <RingAvatar
                          initials={initials(f.username)}
                          size={36}
                          uri={mediaUrl(f.avatar || f.avatarUrl)}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.friendName}>{f.username}</Text>
                          <Text style={styles.muted}>{f.bio || f.department || ''}</Text>
                        </View>
                      </Glass>
                    </TouchableOpacity>
                  ))
                )
              )}

              {tab === 'posts' && (
                posts.length === 0 ? (
                  <Text style={styles.muted}>No posts yet.</Text>
                ) : (
                  posts.map((p) => {
                    const image = p.imageUrl || p.mediaUrl;
                    return (
                      <Glass key={p.id} style={styles.post} padding={12}>
                        <Text style={styles.caption}>{p.caption || ''}</Text>
                        {image ? (
                          <Image
                            source={{ uri: mediaUrl(image) || undefined }}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                        ) : null}
                        <Text style={styles.time}>{timeAgo(p.createdAt)}</Text>
                        <View style={styles.postActions}>
                          <TouchableOpacity style={styles.action} onPress={() => like(p.id)}>
                            <Ionicons
                              name={p.isLiked ? 'heart' : 'heart-outline'}
                              size={16}
                              color={p.isLiked ? C.g2a : C.textMute}
                            />
                            <Text style={styles.actionCount}>{p.likesCount || 0}</Text>
                          </TouchableOpacity>
                          <View style={styles.action}>
                            <Ionicons name="chatbubble-outline" size={16} color={C.textMute} />
                            <Text style={styles.actionCount}>
                              {p.commentsCount || p.comments?.length || 0}
                            </Text>
                          </View>
                        </View>
                        {(p.comments || []).slice(0, 3).map((c: any) => (
                          <Text key={c.id} style={styles.commentLine}>
                            <Text style={styles.commentUser}>{c.user?.username || 'user'} </Text>
                            {c.content}
                          </Text>
                        ))}
                        <View style={styles.commentRow}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Add a comment…"
                            placeholderTextColor={C.textMute}
                            value={commentDrafts[p.id] || ''}
                            onChangeText={(t) =>
                              setCommentDrafts((prev) => ({ ...prev, [p.id]: t }))
                            }
                          />
                          <TouchableOpacity onPress={() => comment(p.id)}>
                            <Text style={styles.postComment}>Post</Text>
                          </TouchableOpacity>
                        </View>
                      </Glass>
                    );
                  })
                )
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  pad: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16, gap: 6 },
  name: { color: C.text, fontSize: 20, fontWeight: '700', marginTop: 8 },
  muted: { color: C.textMute, fontSize: 13, textAlign: 'center' },
  bio: { color: C.textDim, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  privateText: { color: C.g1a, fontSize: 11 },
  actions: { width: '100%', marginTop: 12 },
  pending: { color: C.textMute, textAlign: 'center', marginTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  tabActive: { borderColor: C.g1a },
  tabText: { color: C.textMute, fontWeight: '600', fontSize: 12 },
  tabTextActive: { color: C.g1a },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  friendName: { color: C.text, fontWeight: '600' },
  post: { marginBottom: 12 },
  caption: { color: C.text, marginBottom: 8 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  time: { color: C.textMute, fontSize: 11 },
  postActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: C.textMute, fontSize: 12 },
  commentLine: { color: C.textDim, fontSize: 12, marginTop: 6 },
  commentUser: { color: C.text, fontWeight: '700' },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.glassBorder,
    paddingTop: 8,
  },
  commentInput: { flex: 1, color: C.text, fontSize: 13, padding: 0 },
  postComment: { color: C.g1a, fontWeight: '700', fontSize: 13 },
});
