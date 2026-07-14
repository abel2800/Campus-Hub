import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import {
  Screen,
  ScreenTitle,
  SearchBar,
  GradAvatar,
  Glass,
} from '../../src/components/campus/CampusUI';
import { initials, timeAgo } from '../../src/utils/format';

export default function ChatScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/messages/recent');
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(
        `/friends/search/users?query=${encodeURIComponent(q.trim())}`,
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, searchUsers]);

  const openOrRequest = async (u: any) => {
    if (u.friendshipStatus === 'accepted') {
      router.push(`/chat/${u.id}`);
      return;
    }
    if (u.friendshipStatus === 'incoming' && u.requestId) {
      try {
        await api.post(`/friends/requests/${u.requestId}/accept`);
        router.push(`/chat/${u.id}`);
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Could not accept request';
        // Request may already be accepted from a prior partial success
        if (String(msg).toLowerCase().includes('not found') || String(msg).toLowerCase().includes('already')) {
          router.push(`/chat/${u.id}`);
          return;
        }
        Alert.alert('Error', msg);
      }
      return;
    }
    if (u.friendshipStatus === 'none') {
      Alert.alert(
        'Add friend first',
        'You can only message friends. Open their profile to send a request.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View profile', onPress: () => router.push(`/profile/${u.id}`) },
        ],
      );
      return;
    }
    Alert.alert('Pending', 'Friend request already sent. Wait for them to accept.');
  };

  const filteredChats = chats.filter((item) => {
    if (!search.trim() || results.length > 0) return true;
    const other = item.participant || item.otherUser || item.user;
    return (other?.username || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScreenTitle
          title="Messages"
          right={
            <TouchableOpacity onPress={() => router.push('/(tabs)/friends')}>
              <Ionicons name="people-outline" size={18} color={C.g1a} />
            </TouchableOpacity>
          }
        />
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Search users to message"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {search.trim().length > 0 ? (
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.list}
            data={results}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              searching ? (
                <Text style={styles.hint}>Searching…</Text>
              ) : results.length === 0 ? (
                <Text style={styles.hint}>No users found</Text>
              ) : (
                <Text style={styles.hint}>Tap a friend to chat, or open a profile</Text>
              )
            }
            renderItem={({ item }) => (
              <Glass style={styles.resultCard} padding={12}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push(`/profile/${item.id}`)}
                >
                  <GradAvatar initials={initials(item.username)} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.username}</Text>
                    <Text style={styles.preview}>
                      {item.friendshipStatus === 'accepted'
                        ? 'Friend — tap Message'
                        : item.friendshipStatus === 'pending'
                          ? 'Request sent'
                          : item.friendshipStatus === 'incoming'
                            ? 'Accept to message'
                            : 'View profile / add friend'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.msgBtn} onPress={() => openOrRequest(item)}>
                  <Text style={styles.msgText}>
                    {item.friendshipStatus === 'accepted'
                      ? 'Message'
                      : item.friendshipStatus === 'incoming'
                        ? 'Accept'
                        : 'Open'}
                  </Text>
                </TouchableOpacity>
              </Glass>
            )}
          />
        ) : (
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.list}
            data={filteredChats}
            keyExtractor={(item, i) => String(item.chatId || item.id || i)}
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
            ListEmptyComponent={
              <Text style={styles.empty}>
                No messages yet. Search for a user above, or add friends first.
              </Text>
            }
            renderItem={({ item }) => {
              const other = item.participant || item.otherUser || item.user;
              const userId = other?.id || item.participantId;
              const unread = item.unreadCount || 0;
              const preview = item.lastMessage || item.content || 'Tap to open';

              return (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/chat/${userId}`)}
                >
                  <GradAvatar initials={initials(other?.username)} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{other?.username || 'Chat'}</Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                  {unread > 0 ? (
                    <LinearGradient colors={[...Gradients.primary]} style={styles.badge}>
                      <Text style={styles.badgeText}>{unread}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.time}>
                      {timeAgo(item.updatedAt || item.created_at || item.createdAt)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  info: { flex: 1 },
  name: { color: C.text, fontWeight: '700', fontSize: 14 },
  preview: { color: C.textMute, fontSize: 12, marginTop: 2 },
  time: { color: C.textMute, fontSize: 11 },
  empty: { color: C.textMute, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  hint: { color: C.textMute, marginBottom: 10, fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: C.onGrad, fontSize: 11, fontWeight: '700' },
  resultCard: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(34,225,255,0.15)',
  },
  msgText: { color: C.g1a, fontSize: 12, fontWeight: '600' },
});
