import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import type { TextInput as TextInputRef } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { getApiUrl } from '../src/config/api';
import { C, Gradients } from '../src/theme/colors';
import { Glass } from '../src/components/campus/CampusUI';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputRef>(null);

  const submit = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setError('Email (or username) and password are required');
      return;
    }
    setLoading(true);
    setError('');
    Keyboard.dismiss();
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Sign in failed';
      const hint = !e?.response
        ? `\n\nCannot reach ${getApiUrl()}. Is the API running? (npm start)`
        : '';
      setError(msg + hint);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.card}>
              <Text style={styles.brand}>Campus Hub</Text>
              <Text style={styles.sub}>Sign in as student or teacher</Text>

              <Glass style={styles.field} padding={12}>
                <Text style={styles.label}>Email or username</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  keyboardType="default"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="you@university.edu or username"
                  placeholderTextColor={C.textMute}
                  editable={!loading}
                />
              </Glass>

              <Glass style={styles.field} padding={12}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    placeholder="••••••••"
                    placeholderTextColor={C.textMute}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={C.textMute}
                    />
                  </TouchableOpacity>
                </View>
              </Glass>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                onPress={submit}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.loginBtnWrap}
              >
                <LinearGradient
                  colors={[...Gradients.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                >
                  <Text style={styles.loginBtnText}>
                    {loading ? 'Signing in…' : 'Log in'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator color={C.g1a} style={{ marginTop: 10 }} />
              ) : null}

              <Text style={styles.footer}>
                New here?{' '}
                <Link href="/register" style={styles.link}>
                  Create account
                </Link>
              </Text>
              <Text style={styles.teacherHint}>
                Teachers: use your @teacher.edu email or username
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                style={styles.forgot}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  glow1: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.g1a,
    opacity: 0.15,
  },
  glow2: {
    position: 'absolute',
    bottom: -40,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.g1b,
    opacity: 0.15,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    color: C.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 11, color: C.textMute, marginBottom: 6 },
  input: { fontSize: 15, color: C.text, padding: 0, minHeight: 22 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: { flex: 1 },
  error: { color: C.danger, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  loginBtnWrap: { marginTop: 4 },
  loginBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: C.onGrad, fontWeight: '800', fontSize: 15 },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMute,
    marginTop: 18,
  },
  teacherHint: {
    textAlign: 'center',
    fontSize: 11,
    color: C.textMute,
    marginTop: 8,
  },
  link: { color: C.g1a },
  forgot: { marginTop: 14, alignItems: 'center' },
  forgotText: { color: C.g1a, fontSize: 13 },
});
