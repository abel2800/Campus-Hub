import { useState } from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import api from '../src/services/api';
import { Colors } from '../src/theme/colors';

export default function ResetPasswordScreen() {
  const { email: emailParam, otp: otpParam } = useLocalSearchParams<{ email?: string; otp?: string }>();
  const router = useRouter();
  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState(otpParam || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      });
      Alert.alert('Success', data.message || 'Password updated. You can sign in now.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.pad}>
      <Text style={styles.hint}>Enter the OTP from the API terminal and your new password.</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#666" autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="6-digit OTP" placeholderTextColor="#666" keyboardType="number-pad" maxLength={6} />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="New password" placeholderTextColor="#666" />
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Confirm password" placeholderTextColor="#666" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update password</Text>}
      </TouchableOpacity>
      <Link href="/login" style={styles.link}>Back to sign in</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  pad: { padding: 20 },
  hint: { color: Colors.muted, marginBottom: 16 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, color: '#fff', marginBottom: 12 },
  error: { color: Colors.error, marginBottom: 10 },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  link: { color: Colors.cyan, textAlign: 'center', marginTop: 20 },
});
