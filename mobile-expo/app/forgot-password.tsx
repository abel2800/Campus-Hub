import { useState } from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import api from '../src/services/api';
import { Colors } from '../src/theme/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setMessage(data.message || 'Reset code sent. Check the API terminal for your OTP.');
      setTimeout(() => {
        router.push({ pathname: '/reset-password', params: { email: email.trim().toLowerCase() } });
      }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.pad}>
      <Text style={styles.hint}>Enter your account email. The 6-digit code will appear in the API terminal.</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#666"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send reset code</Text>}
      </TouchableOpacity>
      <Link href="/login" style={styles.link}>Back to sign in</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  pad: { padding: 20 },
  hint: { color: Colors.muted, marginBottom: 16, lineHeight: 20 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, color: '#fff', marginBottom: 12 },
  error: { color: Colors.error, marginBottom: 10 },
  ok: { color: Colors.cyan, marginBottom: 10, lineHeight: 20 },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { color: Colors.cyan, textAlign: 'center', marginTop: 20 },
});
