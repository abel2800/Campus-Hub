import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { C, Gradients } from '../../src/theme/colors';
import { Glass, GradAvatar } from '../../src/components/campus/CampusUI';
import { initials } from '../../src/utils/format';
import { checkSensitiveContent } from '../../src/utils/contentModeration';

export default function ChatThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [peerName, setPeerName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const loadPeer = async () => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      if (data?.username) setPeerName(data.username);
    } catch {
      /* ignore */
    }
  };

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMessages([]);
      setError(e?.response?.data?.message || 'Could not load messages');
    }
  };

  useEffect(() => {
    loadPeer();
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [userId]);

  const send = async () => {
    if (!text.trim()) return;
    const check = checkSensitiveContent(text);
    if (check.blocked) {
      setError(check.message || 'Sensitive content is not allowed.');
      return;
    }
    try {
      setError('');
      await api.post('/messages/send', {
        participantId: Number(userId),
        content: text.trim(),
      });
      setText('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not send message');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={C.textDim} />
          </TouchableOpacity>
          <GradAvatar initials={initials(peerName)} size={34} />
          <View>
            <Text style={styles.peerName}>{peerName || 'Chat'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.pad}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error || 'No messages yet. Say hello!'}
            </Text>
          }
          renderItem={({ item }) => {
            const mine =
              item.sender_id === user?.id || item.senderId === user?.id;
            if (mine) {
              return (
                <LinearGradient
                  colors={[...Gradients.primary]}
                  style={styles.mine}
                >
                  <Text style={styles.mineText}>{item.content}</Text>
                </LinearGradient>
              );
            }
            return (
              <Glass style={styles.theirs} padding={9}>
                <Text style={styles.msgText}>{item.content}</Text>
              </Glass>
            );
          }}
        />

        {error && messages.length > 0 ? (
          <Text style={styles.errorBar}>{error}</Text>
        ) : null}

        <View style={styles.inputRow}>
          <Glass style={styles.inputGlass} padding={10}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Message…"
              placeholderTextColor={C.textMute}
            />
          </Glass>
          <TouchableOpacity onPress={send} activeOpacity={0.9}>
            <LinearGradient colors={[...Gradients.primary]} style={styles.sendBtn}>
              <Ionicons name="arrow-up" size={16} color={C.onGrad} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  peerName: { fontSize: 12, fontWeight: '600', color: C.text },
  list: { flex: 1 },
  pad: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  empty: {
    color: C.textDim,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    paddingHorizontal: 20,
  },
  theirs: {
    alignSelf: 'flex-start',
    maxWidth: '70%',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginBottom: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    marginBottom: 8,
  },
  msgText: { fontSize: 11, color: C.text },
  mineText: { fontSize: 11, color: C.onGrad, fontWeight: '500' },
  errorBar: {
    color: C.danger,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 24,
  },
  inputGlass: { flex: 1 },
  input: { fontSize: 11, color: C.text, padding: 0 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
