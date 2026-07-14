import { useEffect, useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { C } from '../../src/theme/colors';
import {
  Screen,
  ScreenTitle,
  SearchBar,
  Glass,
  GradButton,
} from '../../src/components/campus/CampusUI';
import { initials } from '../../src/utils/format';

type Tab = 'friends' | 'requests' | 'search';

function actionLabel(status?: string) {
  if (status === 'accepted') return 'Friends';
  if (status === 'pending') return 'Request sent';
  if (status === 'incoming') return 'Accept';
  return 'Add friend';
}

export default function FriendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        api.get('/friends/list'),
        api.get('/friends/requests/pending'),
      ]);
      setFriends(Array.isArray(fRes.data) ? fRes.data : []);
      setRequests(Array.isArray(rRes.data) ? rRes.data : []);
    } catch {
      setFriends([]);
      setRequests([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const search = useCallback(async (q: string) => {
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
    if (tab !== 'search') return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, tab, search]);

  const sendRequest = async (receiverId: number) => {
    try {
      await api.post('/friends/request', { receiverId });
      Alert.alert('Sent', 'Friend request sent');
      search(query);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not send request');
    }
  };

  const accept = async (id: number) => {
    try {
      await api.post(`/friends/requests/${id}/accept`);
      load();
      if (tab === 'search') search(query);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not accept';
      // Stale UI after a partial accept — refresh lists so the request disappears
      if (String(msg).toLowerCase().includes('not found')) {
        load();
        if (tab === 'search') search(query);
        return;
      }
      Alert.alert('Error', msg);
    }
  };

  const reject = async (id: number) => {
    try {
      await api.post(`/friends/requests/${id}/reject`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not reject');
    }
  };

  const handleUserAction = (u: any) => {
    if (u.friendshipStatus === 'accepted') {
      router.push(`/chat/${u.id}`);
      return;
    }
    if (u.friendshipStatus === 'incoming' && u.requestId) {
      accept(u.requestId);
      return;
    }
    if (u.friendshipStatus === 'none') {
      sendRequest(u.id);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScreenTitle title="Friends" />
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
          <View style={styles.tabs}>
            {(['friends', 'requests', 'search'] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === 'friends'
                    ? `Friends (${friends.length})`
                    : t === 'requests'
                      ? `Requests (${requests.length})`
                      : 'Find'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'friends' && (
            friends.length === 0 ? (
              <Text style={styles.empty}>No friends yet. Search by username to connect.</Text>
            ) : (
              friends.map((f) => {
                const friend = f.friend || f;
                return (
                  <Glass key={f.id} style={styles.card} padding={12}>
                    <TouchableOpacity
                      style={styles.cardRow}
                      onPress={() => friend.id && router.push(`/profile/${friend.id}`)}
                    >
                      <View style={styles.cardInfo}>
                        <Text style={styles.name}>{friend.username || 'User'}</Text>
                        <Text style={styles.muted}>{friend.department || ''}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.msgBtn}
                        onPress={() => friend.id && router.push(`/chat/${friend.id}`)}
                      >
                        <Text style={styles.msgText}>Message</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Glass>
                );
              })
            )
          )}

          {tab === 'requests' && (
            requests.length === 0 ? (
              <Text style={styles.empty}>No pending friend requests</Text>
            ) : (
              requests.map((r) => (
                <Glass key={r.id} style={styles.card} padding={12}>
                  <TouchableOpacity onPress={() => r.sender?.id && router.push(`/profile/${r.sender.id}`)}>
                    <Text style={styles.name}>{r.sender?.username || 'User'}</Text>
                    {!!r.sender?.bio && <Text style={styles.muted}>{r.sender.bio}</Text>}
                  </TouchableOpacity>
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.accept} onPress={() => accept(r.id)}>
                      <Text style={styles.btnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reject} onPress={() => reject(r.id)}>
                      <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </Glass>
              ))
            )
          )}

          {tab === 'search' && (
            <>
              <SearchBar
                placeholder="Search by username"
                value={query}
                onChangeText={setQuery}
              />
              {searching && <Text style={styles.muted}>Searching…</Text>}
              {!searching && query.trim() && results.length === 0 && (
                <Text style={styles.empty}>No users found for "{query}"</Text>
              )}
              {results.map((u) => (
                <Glass key={u.id} style={styles.card} padding={12}>
                  <View style={styles.cardRow}>
                    <TouchableOpacity
                      style={styles.cardInfo}
                      onPress={() => router.push(`/profile/${u.id}`)}
                    >
                      <Text style={styles.name}>{u.username}</Text>
                      <Text style={styles.muted}>{u.department || u.bio || ''}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        (u.friendshipStatus === 'accepted' || u.friendshipStatus === 'pending') &&
                          styles.actionDisabled,
                      ]}
                      disabled={u.friendshipStatus === 'pending'}
                      onPress={() => handleUserAction(u)}
                    >
                      <Text style={styles.actionText}>{actionLabel(u.friendshipStatus)}</Text>
                    </TouchableOpacity>
                  </View>
                </Glass>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingBottom: 100 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'rgba(34,225,255,0.15)', borderColor: C.g1a },
  tabText: { color: C.textMute, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: C.g1a },
  empty: { color: C.textDim, textAlign: 'center', marginTop: 24, fontSize: 13 },
  card: { marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  name: { color: C.text, fontWeight: '600', fontSize: 14 },
  muted: { color: C.textMute, marginTop: 4, fontSize: 11 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  accept: {
    backgroundColor: C.g1a,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reject: {
    backgroundColor: C.avatarMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { color: C.onGrad, fontWeight: '600', fontSize: 12 },
  msgBtn: {
    backgroundColor: 'rgba(34,225,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  msgText: { color: C.g1a, fontSize: 11, fontWeight: '600' },
  actionBtn: {
    backgroundColor: C.g1a,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: C.onGrad, fontSize: 11, fontWeight: '600' },
});
