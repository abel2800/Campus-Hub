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
  TouchableWithoutFeedback,
} from 'react-native';
import type { TextInput as TextInputRef } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { getApiUrl } from '../src/config/api';
import { C } from '../src/theme/colors';
import { Glass, GradButton } from '../src/components/campus/CampusUI';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputRef>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Email (or username) and password are required');
      return;
    }
    setLoading(true);
    setError('');
    Keyboard.dismiss();
    try {
      await login(email.trim(), password);
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.card}>
                <Text style={styles.brand}>Campus Hub</Text>
                <Text style={styles.sub}>Sign in to continue</Text>

                <Glass style={styles.field} padding={12}>
                  <Text style={styles.label}>Email or username</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    placeholder="you@university.edu"
                    placeholderTextColor={C.textMute}
                  />
                </Glass>

                <Glass style={styles.field} padding={12}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    placeholder="••••••••"
                    placeholderTextColor={C.textMute}
                  />
                </Glass>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <GradButton
                  label={loading ? 'Signing in…' : 'Log in'}
                  onPress={submit}
                />
                {loading ? (
                  <ActivityIndicator color={C.g1a} style={{ marginTop: 10 }} />
                ) : null}

                <Text style={styles.footer}>
                  New here?{' '}
                  <Link href="/register" style={styles.link}>
                    Create account
                  </Link>
                </Text>
                <Link href="/forgot-password" style={styles.forgot}>
                  Forgot password?
                </Link>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
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
  error: { color: C.danger, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: C.textMute,
    marginTop: 18,
  },
  link: { color: C.g1a },
  forgot: {
    color: C.g1a,
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});
