import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import { mediaUrl } from '../../src/utils/media';
import {
  Screen,
  Glass,
  ScreenTitle,
  RingAvatar,
  GradAvatar,
} from '../../src/components/campus/CampusUI';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { checkSensitiveContent } from '../../src/utils/contentModeration';

import { initials, timeAgo } from '../../src/utils/format';

type StoryUser = {
  userId: number;
  username: string;
  hasStory: boolean;
  isSelf?: boolean;
};

export default function SocialScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [caption, setCaption] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [storyComment, setStoryComment] = useState('');
  const [storyLiked, setStoryLiked] = useState(false);
  const [storyLikes, setStoryLikes] = useState(0);
  const [storyComments, setStoryComments] = useState<any[]>([]);
  const [storyLikers, setStoryLikers] = useState<any[]>([]);
  const [storyInsightsOpen, setStoryInsightsOpen] = useState(false);
  const [storyCaptionDraft, setStoryCaptionDraft] = useState('');

  const isOwnStory = (story: any) =>
    !!story &&
    !!user &&
    ((story.userId || story.user?.id) === user.id);

  const loadStoryInsights = async (storyId: number) => {
    try {
      const { data } = await api.get(`/stories/${storyId}/insights`);
      setStoryLikers(data.likes || []);
      setStoryComments(data.comments || []);
      setStoryLikes(data.likesCount ?? 0);
      return data;
    } catch {
      return null;
    }
  };

  const loadStories = async () => {
    try {
      const { data } = await api.get('/stories');
      const stories = Array.isArray(data) ? data : [];
      const byUser = new Map<number, StoryUser>();

      if (user?.id) {
        byUser.set(user.id, {
          userId: user.id,
          username: 'You',
          hasStory: stories.some((s: any) => s.userId === user.id),
          isSelf: true,
        });
      }

      stories.forEach((story: any) => {
        const uid = story.userId || story.user?.id;
        if (!uid || uid === user?.id) return;
        if (!byUser.has(uid)) {
          byUser.set(uid, {
            userId: uid,
            username: story.user?.username || 'User',
            hasStory: true,
          });
        }
      });

      setStoryUsers(Array.from(byUser.values()));
    } catch {
      if (user?.id) {
        setStoryUsers([{
          userId: user.id,
          username: 'You',
          hasStory: false,
          isSelf: true,
        }]);
      } else {
        setStoryUsers([]);
      }
    }
  };

  const load = async () => {
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    }
    await loadStories();
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!activeStory?.id || !isOwnStory(activeStory)) return undefined;
    loadStoryInsights(activeStory.id);
    const t = setInterval(() => loadStoryInsights(activeStory.id), 4000);
    return () => clearInterval(t);
  }, [activeStory?.id, user?.id]);

  const like = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`);
      load();
    } catch {
      /* ignore */
    }
  };

  const comment = async (postId: number) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;
    const check = checkSensitiveContent(content);
    if (check.blocked) {
      Alert.alert('Blocked', check.message || 'Sensitive content is not allowed.');
      return;
    }
    try {
      await api.post(`/posts/${postId}/comment`, { content });
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not comment');
    }
  };

  const openStory = async (s: StoryUser) => {
    if (!s.hasStory && s.isSelf) {
      pickStory();
      return;
    }
    if (!s.hasStory) return;
    try {
      const { data } = await api.get('/stories');
      const stories = Array.isArray(data) ? data : [];
      const story = stories.find(
        (st: any) => (st.userId || st.user?.id) === s.userId,
      );
      if (story) {
        setActiveStory(story);
        setStoryInsightsOpen(false);
        setStoryLiked(!!story.isLiked);
        setStoryLikes(story.likes || 0);
        setStoryComments(story.comments || []);
        setStoryLikers(story.likers || []);
        setStoryComment('');
        if ((story.userId || story.user?.id) === user?.id) {
          loadStoryInsights(story.id);
        }
      }
    } catch {
      /* ignore */
    }
  };

  const likeStory = async () => {
    if (!activeStory?.id) return;
    try {
      const { data } = await api.post(`/stories/${activeStory.id}/like`);
      setStoryLiked(!!data.liked);
      setStoryLikes(data.likes ?? storyLikes);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not like story');
    }
  };

  const sendStoryComment = async () => {
    if (!activeStory?.id) return;
    const content = storyComment.trim();
    if (!content) return;
    const check = checkSensitiveContent(content);
    if (check.blocked) {
      Alert.alert('Blocked', check.message || 'Sensitive content is not allowed.');
      return;
    }
    try {
      const { data } = await api.post(`/stories/${activeStory.id}/comments`, { content });
      setStoryComments((prev) => [...prev, data]);
      setStoryComment('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not comment');
    }
  };

  const pickPostImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPostImage(result.assets[0].uri);
    }
  };

  const pickStory = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add a story.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const check = checkSensitiveContent(storyCaptionDraft);
    if (check.blocked) {
      Alert.alert('Blocked', check.message || 'Sensitive content is not allowed.');
      return;
    }
    try {
      const form = new FormData();
      form.append('media', {
        uri: result.assets[0].uri,
        name: 'story.jpg',
        type: 'image/jpeg',
      } as any);
      if (storyCaptionDraft.trim()) {
        form.append('caption', storyCaptionDraft.trim());
      }
      await api.post('/stories', form);
      setStoryCaptionDraft('');
      load();
      Alert.alert('Story added', 'Your story is now visible to friends.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not add story');
    }
  };

  const createPost = async () => {
    if (!caption.trim() && !postImage) {
      Alert.alert('Empty post', 'Write something or add a photo.');
      return;
    }
    const check = checkSensitiveContent(caption);
    if (check.blocked) {
      Alert.alert('Blocked', check.message || 'Sensitive content is not allowed.');
      return;
    }
    setPosting(true);
    try {
      if (postImage) {
        const form = new FormData();
        form.append('caption', caption.trim());
        form.append('media', {
          uri: postImage,
          name: 'post.jpg',
          type: 'image/jpeg',
        } as any);
        await api.post('/posts', form);
      } else {
        await api.post('/posts', { caption: caption.trim() });
      }
      setCaption('');
      setPostImage(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not create post');
    } finally {
      setPosting(false);
    }
  };

  const ListHeader = () => (
  <>
      <SafeAreaView edges={['top']}>
        <ScreenTitle
          title="Feed"
          right={
            <TouchableOpacity onPress={() => router.push('/(tabs)/friends')}>
              <Ionicons name="paper-plane-outline" size={18} color={C.textDim} />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <TextInput
        style={styles.storyCaptionField}
        placeholder="Optional caption for your next story"
        placeholderTextColor={C.textMute}
        value={storyCaptionDraft}
        onChangeText={setStoryCaptionDraft}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stories}
      >
        {storyUsers.map((s) => (
          <TouchableOpacity
            key={s.userId}
            style={styles.storyItem}
            onPress={() => openStory(s)}
            onLongPress={() => router.push(s.isSelf ? '/(tabs)/profile' : `/profile/${s.userId}`)}
          >
            {s.isSelf && !s.hasStory ? (
              <View style={styles.storyAdd}>
                <Ionicons name="add" size={16} color={C.g1a} />
              </View>
            ) : s.hasStory ? (
              <RingAvatar
                initials={initials(s.isSelf ? user?.username : s.username)}
                size={52}
                uri={s.isSelf ? mediaUrl(user?.avatar) : undefined}
              />
            ) : (
              <View style={styles.storyDim}>
                <View style={styles.storyInner}>
                  <Text style={styles.storyInitials}>
                    {initials(s.isSelf ? user?.username : s.username)}
                  </Text>
                </View>
              </View>
            )}
            <Text style={styles.storyLabel}>{s.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Glass style={styles.compose} padding={10}>
        <View style={styles.composeRow}>
          <GradAvatar
            initials={initials(user?.username)}
            size={24}
            uri={mediaUrl(user?.avatar)}
          />
          <TextInput
            style={styles.composeInput}
            placeholder="What's on your mind?"
            placeholderTextColor={C.textMute}
            value={caption}
            onChangeText={setCaption}
          />
        </View>
        {postImage ? (
          <Image source={{ uri: postImage }} style={styles.composePreview} />
        ) : null}
        <View style={styles.composeActions}>
          <TouchableOpacity onPress={pickPostImage} style={styles.composeAction}>
            <Ionicons name="image-outline" size={18} color={C.g1a} />
            <Text style={styles.composeActionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={createPost}
            style={styles.postBtn}
            disabled={posting}
          >
            <Text style={styles.postBtnText}>{posting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </Glass>
    </>
  );

  return (
    <Screen>
      <FlatList
        style={styles.flex}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
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
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.feedEmpty}>
            No posts yet. Add friends to see their updates!
          </Text>
        }
        renderItem={({ item }) => (
          <Glass style={styles.postCard}>
            <TouchableOpacity
              style={styles.postHeader}
              onPress={() => item.user?.id && router.push(`/profile/${item.user.id}`)}
            >
              <RingAvatar initials={initials(item.user?.username)} size={28} />
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{item.user?.username || 'User'}</Text>
                <Text style={styles.postTime}>
                  {item.user?.department || 'Campus'} · {timeAgo(item.createdAt)}
                </Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={14} color={C.textMute} />
            </TouchableOpacity>
            {item.mediaUrl || item.imageUrl ? (
              <Image
                source={{ uri: mediaUrl(item.mediaUrl || item.imageUrl) || '' }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[...Gradients.banner]}
                style={styles.postMedia}
              >
                <View style={styles.postGlow} />
              </LinearGradient>
            )}
            <View style={styles.postFooter}>
              <Text style={styles.postCaption}>{item.caption}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.action} onPress={() => like(item.id)}>
                  <Ionicons
                    name={item.isLiked ? 'heart' : 'heart-outline'}
                    size={16}
                    color={item.isLiked ? C.g2a : C.textMute}
                  />
                  <Text style={styles.actionCount}>{item.likesCount || 0}</Text>
                </TouchableOpacity>
                <View style={styles.action}>
                  <Ionicons name="chatbubble-outline" size={16} color={C.textMute} />
                  <Text style={styles.actionCount}>
                    {item.commentsCount || item.comments?.length || 0}
                  </Text>
                </View>
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={C.textMute}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              {(item.comments || []).slice(0, 2).map((c: any) => (
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
                  value={commentDrafts[item.id] || ''}
                  onChangeText={(t) =>
                    setCommentDrafts((prev) => ({ ...prev, [item.id]: t }))
                  }
                />
                <TouchableOpacity onPress={() => comment(item.id)}>
                  <Text style={styles.postComment}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Glass>
        )}
      />

      {activeStory ? (
        <View style={styles.storyModal}>
          <TouchableOpacity
            style={styles.storyClose}
            onPress={() => {
              setActiveStory(null);
              setStoryComment('');
              setStoryInsightsOpen(false);
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: mediaUrl(activeStory.mediaUrl || activeStory.imageUrl) || '' }}
            style={styles.storyFull}
            resizeMode="contain"
          />
          <Text style={styles.storyModalUser}>
            {isOwnStory(activeStory) ? 'Your story' : (activeStory.user?.username || 'Story')}
          </Text>
          {activeStory.caption ? (
            <Text style={styles.storyCaption}>{activeStory.caption}</Text>
          ) : null}

          {isOwnStory(activeStory) ? (
            <>
              <TouchableOpacity
                style={styles.storyInsightsBar}
                onPress={() => setStoryInsightsOpen((v) => !v)}
              >
                <Text style={styles.storyInsightsBarText}>
                  ❤️ {storyLikes} likes  ·  💬 {storyComments.length} replies
                </Text>
                <Text style={styles.storyInsightsHint}>
                  {storyInsightsOpen ? 'Hide activity' : 'Tap to see who liked & replied'}
                </Text>
              </TouchableOpacity>

              {storyInsightsOpen ? (
                <View style={styles.storyInsightsPanel}>
                  <Text style={styles.storyInsightsTitle}>Likes</Text>
                  {storyLikers.length === 0 ? (
                    <Text style={styles.storyInsightsEmpty}>No likes yet</Text>
                  ) : (
                    storyLikers.map((liker) => (
                      <View key={`${liker.id}-${liker.likedAt}`} style={styles.storyInsightsRow}>
                        <GradAvatar
                          initials={initials(liker.username)}
                          size={32}
                          uri={mediaUrl(liker.avatar)}
                        />
                        <Text style={styles.storyInsightsName}>{liker.username}</Text>
                      </View>
                    ))
                  )}

                  <Text style={[styles.storyInsightsTitle, { marginTop: 12 }]}>Replies</Text>
                  {storyComments.length === 0 ? (
                    <Text style={styles.storyInsightsEmpty}>No replies yet</Text>
                  ) : (
                    storyComments.map((c) => (
                      <View key={c.id} style={styles.storyInsightsReply}>
                        <Text style={styles.storyInsightsName}>{c.user?.username || 'user'}</Text>
                        <Text style={styles.storyInsightsReplyText}>{c.content}</Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.storyCommentsBox}>
                {storyComments.slice(-4).map((c) => (
                  <Text key={c.id} style={styles.storyCommentLine}>
                    <Text style={styles.storyCommentUser}>{c.user?.username || 'user'} </Text>
                    {c.content}
                  </Text>
                ))}
              </View>

              <View style={styles.storyActions}>
                <TouchableOpacity style={styles.storyLikeBtn} onPress={likeStory}>
                  <Ionicons
                    name={storyLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={storyLiked ? C.g2a : '#fff'}
                  />
                  <Text style={styles.storyLikeText}>{storyLikes}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.storyCommentInput}
                  placeholder="Send message..."
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  value={storyComment}
                  onChangeText={setStoryComment}
                />
                <TouchableOpacity onPress={sendStoryComment}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  stories: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  storyItem: { alignItems: 'center', gap: 5 },
  storyAdd: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.glass,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyDim: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  storyInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: C.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitials: { fontSize: 11, fontWeight: '600', color: C.text },
  storyLabel: { fontSize: 9, color: C.textMute },
  compose: { marginHorizontal: 16, marginBottom: 14 },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composeInput: { flex: 1, fontSize: 11, color: C.text, padding: 0 },
  composePreview: { width: '100%', height: 120, borderRadius: 10, marginTop: 8 },
  composeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  composeAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  composeActionText: { fontSize: 11, color: C.g1a },
  postBtn: {
    backgroundColor: C.g1a,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postBtnText: { color: C.onGrad, fontWeight: '600', fontSize: 12 },
  postCard: { marginBottom: 14, overflow: 'hidden', padding: 0 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: 11, fontWeight: '600', color: C.text },
  postTime: { fontSize: 9, color: C.textMute },
  postMedia: { height: 150, position: 'relative' },
  postImage: { width: '100%', height: 150 },
  postGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.g2a,
    opacity: 0.25,
    top: 20,
    left: 40,
  },
  postFooter: { padding: 10 },
  postCaption: { fontSize: 11, color: C.textDim, marginBottom: 8 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 10, color: C.textMute },
  commentLine: { color: C.textDim, fontSize: 11, marginTop: 6 },
  commentUser: { color: C.text, fontWeight: '700' },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.glassBorder,
    paddingTop: 8,
  },
  commentInput: { flex: 1, color: C.text, fontSize: 12, padding: 0 },
  postComment: { color: C.g1a, fontWeight: '700', fontSize: 12 },
  storyModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  storyClose: { position: 'absolute', top: 50, right: 20, zIndex: 2 },
  storyFull: { width: '100%', height: '70%' },
  storyModalUser: { color: '#fff', marginTop: 12, fontWeight: '700' },
  storyCaption: { color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 13 },
  storyInsightsBar: {
    width: '100%',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  storyInsightsBarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  storyInsightsHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  storyInsightsPanel: {
    width: '100%',
    marginTop: 10,
    maxHeight: 220,
    backgroundColor: 'rgba(20,20,28,0.95)',
    borderRadius: 16,
    padding: 14,
  },
  storyInsightsTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  storyInsightsEmpty: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 8 },
  storyInsightsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  storyInsightsName: { color: '#fff', fontWeight: '600', fontSize: 13 },
  storyInsightsReply: { marginBottom: 10 },
  storyInsightsReplyText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  storyCommentsBox: { width: '100%', marginTop: 10, maxHeight: 90 },
  storyCommentLine: { color: '#fff', fontSize: 12, marginBottom: 4 },
  storyCommentUser: { fontWeight: '700' },
  storyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 14,
  },
  storyLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  storyLikeText: { color: '#fff', fontWeight: '600' },
  storyCommentInput: {
    flex: 1,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  storyCaptionField: {
    marginHorizontal: 16,
    marginBottom: 10,
    color: C.text,
    backgroundColor: C.glass,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  feedEmpty: {
    color: C.textDim,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    paddingHorizontal: 24,
  },
});
