import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';
import { Colors } from '../../src/theme/colors';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, vRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/courses/${id}/videos`).catch(() => ({ data: [] })),
        ]);
        setCourse(cRes.data);
        setVideos(Array.isArray(vRes.data) ? vRes.data : vRes.data?.videos || []);
      } catch {
        Alert.alert('Error', 'Could not load course');
        router.back();
      }
    })();
  }, [id]);

  const enroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      Alert.alert('Enrolled', 'You joined this course!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not enroll');
    }
  };

  if (!course) return <View style={styles.flex}><Text style={styles.muted}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.desc}>{course.description}</Text>
      <TouchableOpacity style={styles.enrollBtn} onPress={enroll}>
        <Text style={styles.enrollText}>Enroll in this course</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Course videos ({videos.length})</Text>
      {videos.map((v) => (
        <View key={v.id} style={styles.videoCard}>
          <Text style={styles.videoTitle}>{v.title || `Video ${v.id}`}</Text>
          {v.description ? <Text style={styles.muted}>{v.description}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  pad: { padding: 16, paddingBottom: 32 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  desc: { color: Colors.muted, marginTop: 10, lineHeight: 22 },
  enrollBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  enrollText: { color: '#fff', fontWeight: '700' },
  section: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 24, marginBottom: 10 },
  videoCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8 },
  videoTitle: { color: '#fff', fontWeight: '600' },
  muted: { color: Colors.muted, marginTop: 4 },
});
