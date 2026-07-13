import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { C } from '../src/theme/colors';
import { Screen, Glass, ScreenTitle } from '../src/components/campus/CampusUI';

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  right,
  onPress,
  border,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  border?: boolean;
}) {
  const content = (
    <View style={[styles.row, border && styles.rowBorder]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {right || <Ionicons name="chevron-forward" size={14} color={C.textMute} />}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/privacy');
        setIsPrivate(Boolean(data.isPrivate));
        setShowFriendsList(data.privacySettings?.showFriendsList !== false);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const savePrivacy = async (patch: { isPrivate?: boolean; showFriendsList?: boolean }) => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/privacy', patch);
      setIsPrivate(Boolean(data.isPrivate));
      if (data.privacySettings?.showFriendsList !== undefined) {
        setShowFriendsList(Boolean(data.privacySettings.showFriendsList));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not update privacy');
      // reload
      try {
        const { data } = await api.get('/users/privacy');
        setIsPrivate(Boolean(data.isPrivate));
        setShowFriendsList(data.privacySettings?.showFriendsList !== false);
      } catch {
        /* ignore */
      }
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScreenTitle title="Settings" />
        <ScrollView contentContainerStyle={styles.pad}>
          <Glass style={styles.section} padding={0}>
            <SettingRow
              icon="person-outline"
              iconColor={C.g1a}
              iconBg="rgba(34,225,255,0.12)"
              label="Edit profile"
              onPress={() => router.push('/edit-profile')}
            />
            <SettingRow
              icon="people-outline"
              iconColor={C.g2a}
              iconBg="rgba(0,255,178,0.12)"
              label="Friends"
              border
              onPress={() => router.push('/(tabs)/friends')}
            />
            <SettingRow
              icon="notifications-outline"
              iconColor="#8A5CFF"
              iconBg="rgba(138,92,255,0.15)"
              label="Notifications"
              border
              onPress={() => router.push('/notifications')}
            />
            <SettingRow
              icon="lock-closed-outline"
              iconColor={C.g2a}
              iconBg="rgba(0,255,178,0.12)"
              label="Change password"
              onPress={() => router.push('/forgot-password')}
            />
          </Glass>

          <Text style={styles.sectionLabel}>Privacy</Text>
          <Glass style={styles.section} padding={0}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34,225,255,0.12)' }]}>
                <Ionicons name="eye-off-outline" size={15} color={C.g1a} />
              </View>
              <View style={styles.privacyText}>
                <Text style={styles.rowLabel}>Private account</Text>
                <Text style={styles.privacyHint}>
                  Like Instagram: strangers only see your photo and bio. Friends see posts.
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={(v) => {
                  setIsPrivate(v);
                  savePrivacy({ isPrivate: v });
                }}
                disabled={saving}
                trackColor={{ false: C.avatarMuted, true: C.g1a }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.row, styles.rowBorder]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0,255,178,0.12)' }]}>
                <Ionicons name="people-outline" size={15} color={C.g2a} />
              </View>
              <View style={styles.privacyText}>
                <Text style={styles.rowLabel}>Show friends list</Text>
                <Text style={styles.privacyHint}>
                  Public: others can see your friends. Off: only you see the list.
                </Text>
              </View>
              <Switch
                value={showFriendsList}
                onValueChange={(v) => {
                  setShowFriendsList(v);
                  savePrivacy({ showFriendsList: v });
                }}
                disabled={saving}
                trackColor={{ false: C.avatarMuted, true: C.g1a }}
                thumbColor="#fff"
              />
            </View>
          </Glass>

          <Glass style={styles.section} padding={0}>
            <SettingRow
              icon="book-outline"
              iconColor={C.g1a}
              iconBg="rgba(34,225,255,0.12)"
              label="My courses"
              onPress={() => router.push('/(tabs)/courses')}
            />
            <SettingRow
              icon="chatbubble-outline"
              iconColor={C.g2a}
              iconBg="rgba(0,255,178,0.12)"
              label="Messages"
              border
              onPress={() => router.push('/(tabs)/chat')}
            />
            <SettingRow
              icon="moon-outline"
              iconColor={C.g2a}
              iconBg="rgba(0,255,178,0.12)"
              label="Appearance"
              right={<Text style={styles.appearance}>Dark</Text>}
            />
          </Glass>

          <TouchableOpacity onPress={signOut} activeOpacity={0.85}>
            <Glass style={styles.logout} padding={12}>
              <Ionicons name="log-out-outline" size={15} color={C.danger} />
              <Text style={styles.logoutText}>Log out</Text>
            </Glass>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionLabel: {
    color: C.textMute,
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  section: { marginBottom: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  rowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: C.glassBorder,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 12, color: C.text },
  privacyText: { flex: 1 },
  privacyHint: { fontSize: 10, color: C.textMute, marginTop: 2, lineHeight: 14 },
  appearance: { fontSize: 10, color: C.textMute },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: 'rgba(226,75,74,0.3)',
  },
  logoutText: { fontSize: 12, color: C.danger },
});
