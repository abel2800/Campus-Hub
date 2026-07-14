import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { C } from '../src/theme/colors';
import { Screen, Glass, ScreenTitle } from '../src/components/campus/CampusUI';
import { timeAgo } from '../src/utils/format';

type NotifItem = {
  id: string;
  type: 'notification' | 'friend_request';
  title: string;
  body: string;
  time?: string;
  read?: boolean;
  requestId?: number;
  senderId?: number;
  entityId?: number;
  notifType?: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [notifRes, reqRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/friends/requests/pending'),
      ]);

      const notifs = Array.isArray(notifRes.data) ? notifRes.data : [];
      const requests = Array.isArray(reqRes.data) ? reqRes.data : [];

      const merged: NotifItem[] = [
        ...requests.map((r: any) => ({
          id: `req-${r.id}`,
          type: 'friend_request' as const,
          title: r.sender?.username || 'Friend request',
          body: 'Sent you a friend request',
          time: r.createdAt,
          requestId: r.id,
          senderId: r.senderId || r.sender?.id,
        })),
        ...notifs.map((n: any) => ({
          id: `n-${n.id}`,
          type: 'notification' as const,
          title: n.type?.replace(/_/g, ' ') || 'Notification',
          body: n.content || n.message || '',
          time: n.createdAt,
          read: n.read,
          notifType: n.type,
          entityId: n.entityId,
          senderId: n.senderId,
        })),
      ];

      merged.sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return tb - ta;
      });

      setItems(merged);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (requestId: number) => {
    try {
      await api.post(`/friends/requests/${requestId}/accept`);
    } catch {
      /* already accepted / stale request — still refresh UI */
    }
    load();
  };

  const reject = async (requestId: number) => {
    try {
      await api.post(`/friends/requests/${requestId}/reject`);
    } catch {
      /* ignore */
    }
    load();
  };

  const openItem = async (item: NotifItem) => {
    if (item.type === 'friend_request' && item.senderId) {
      router.push(`/profile/${item.senderId}`);
      return;
    }
    if (item.notifType === 'course_enroll' && item.entityId) {
      router.push(`/course/${item.entityId}`);
    } else if (item.notifType === 'message' && item.senderId) {
      router.push(`/chat/${item.senderId}`);
    }
    if (item.id.startsWith('n-')) {
      const nid = item.id.replace('n-', '');
      try {
        await api.put(`/notifications/${nid}/read`);
      } catch {
        /* ignore */
      }
      load();
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color={C.textDim} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.back} />
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
            <Text style={styles.empty}>No notifications yet</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => openItem(item)}>
              <Glass style={styles.card} padding={12}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
                {item.time ? (
                  <Text style={styles.cardTime}>{timeAgo(item.time)}</Text>
                ) : null}
                {item.type === 'friend_request' && item.requestId ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.accept}
                      onPress={() => accept(item.requestId!)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reject}
                      onPress={() => reject(item.requestId!)}
                    >
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </Glass>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { width: 28 },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { color: C.textDim, textAlign: 'center', marginTop: 60, fontSize: 13 },
  card: { marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
  cardBody: { fontSize: 12, color: C.textDim, marginTop: 4 },
  cardTime: { fontSize: 10, color: C.textMute, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  accept: {
    backgroundColor: C.g1a,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptText: { color: C.onGrad, fontWeight: '600', fontSize: 12 },
  reject: {
    backgroundColor: C.avatarMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectText: { color: C.text, fontWeight: '600', fontSize: 12 },
});
