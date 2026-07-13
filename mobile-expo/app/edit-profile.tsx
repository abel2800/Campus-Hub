import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { C } from '../src/theme/colors';
import { Screen, Glass, GradButton, RingAvatar } from '../src/components/campus/CampusUI';
import { initials } from '../src/utils/format';
import { mediaUrl } from '../src/utils/media';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDepartment(user.department || '');
      setBio(user.bio || '');
      setAvatarUri(user.avatar ? mediaUrl(user.avatar) : null);
    }
  }, [user]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }
    setSaving(true);
    try {
      if (avatarUri && !avatarUri.startsWith('http')) {
        const form = new FormData();
        form.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
        await api.post('/users/avatar', form);
      }

      await api.put('/users/profile', {
        username: username.trim(),
        department: department.trim(),
        bio: bio.trim(),
      });

      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={C.textDim} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit profile</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.pad}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <RingAvatar initials={initials(username)} size={88} />
            )}
            <Text style={styles.changePhoto}>Change photo</Text>
          </TouchableOpacity>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={C.textMute}
            />
          </Glass>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Computer Science"
              placeholderTextColor={C.textMute}
            />
          </Glass>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bio]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell people about yourself"
              placeholderTextColor={C.textMute}
            />
          </Glass>

          <Text style={styles.emailNote}>Email: {user?.email}</Text>

          {saving ? (
            <ActivityIndicator color={C.g1a} style={{ marginTop: 16 }} />
          ) : (
            <GradButton label="Save changes" onPress={save} style={{ marginTop: 16 }} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  pad: { padding: 16, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  changePhoto: { color: C.g1a, fontSize: 12, marginTop: 8 },
  field: { marginBottom: 10 },
  label: { fontSize: 11, color: C.textMute, marginBottom: 6 },
  input: { fontSize: 14, color: C.text, padding: 0 },
  bio: { minHeight: 72, textAlignVertical: 'top' },
  emailNote: { fontSize: 11, color: C.textMute, marginTop: 4 },
});
