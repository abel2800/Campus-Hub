import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors, C } from '../src/theme/colors';
import { Glass, GradButton, Screen } from '../src/components/campus/CampusUI';

const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Arts',
  'Science',
  'Mathematics',
  'Medicine',
  'Law',
  'Education',
];

const TEACHER_EMAIL = /^[^\s@]+@teacher\.edu$/i;

export default function RegisterScreen() {
  const { requestRegisterOtp, verifyRegisterOtp, requestTeacherRegisterOtp, verifyTeacherRegisterOtp } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      setError('Enter a valid email address');
      return false;
    }
    if (role === 'teacher' && !TEACHER_EMAIL.test(normalized)) {
      setError('Teachers must use a @teacher.edu email (e.g. name@teacher.edu)');
      return false;
    }
    if (role === 'student' && TEACHER_EMAIL.test(normalized)) {
      setError('Use a regular university email, or switch to Teacher role');
      return false;
    }
    return true;
  };

  const requestOtp = async () => {
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!validateEmail()) return;

    setLoading(true);
    setError('');
    setInfo('');
    try {
      const payload = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        department,
      };
      const result =
        role === 'teacher'
          ? await requestTeacherRegisterOtp(payload)
          : await requestRegisterOtp(payload);
      setInfo(result.message || 'Code sent. Check the API terminal for your OTP.');
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code from the API terminal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (role === 'teacher') {
        await verifyTeacherRegisterOtp(email.trim(), otp.trim());
      } else {
        await verifyRegisterOtp(email.trim(), otp.trim());
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.hint}>
            Enter the 6-digit code from the API terminal ([OTP] line) for {email.trim().toLowerCase()}
          </Text>
          {info ? <Text style={styles.info}>{info}</Text> : null}
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={C.textMute}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GradButton
            label={loading ? 'Verifying…' : 'Verify & create account'}
            onPress={verifyOtp}
          />
          <TouchableOpacity onPress={() => setStep('form')}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.hint}>Choose Student or Teacher, then verify with a one-time code.</Text>

          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'student' && styles.roleActive]}
              onPress={() => setRole('student')}
            >
              <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'teacher' && styles.roleActive]}
              onPress={() => setRole('teacher')}
            >
              <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Teacher</Text>
            </TouchableOpacity>
          </View>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.inputInner}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="username"
              placeholderTextColor={C.textMute}
            />
          </Glass>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.inputInner}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={role === 'teacher' ? 'name@teacher.edu' : 'name@university.edu'}
              placeholderTextColor={C.textMute}
            />
          </Glass>

          <Text style={styles.label}>{role === 'teacher' ? 'Teaching department' : 'Department'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept}
                style={[styles.deptChip, department === dept && styles.deptChipActive]}
                onPress={() => setDepartment(dept)}
              >
                <Text style={[styles.deptText, department === dept && styles.deptTextActive]}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.inputInner, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="min 6 characters"
                placeholderTextColor={C.textMute}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={12}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={C.textMute}
                />
              </TouchableOpacity>
            </View>
          </Glass>

          <Glass style={styles.field} padding={12}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.inputInner, styles.passwordInput]}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                placeholder="repeat password"
                placeholderTextColor={C.textMute}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={12}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={C.textMute}
                />
              </TouchableOpacity>
            </View>
          </Glass>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradButton
            label={loading ? 'Sending…' : 'Send verification code'}
            onPress={requestOtp}
          />

          <Link href="/login" style={styles.link}>Already have an account? Sign in</Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 20, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  hint: { color: C.textMute, marginBottom: 20, lineHeight: 20 },
  info: { color: C.g1a, marginBottom: 14, lineHeight: 20 },
  label: { color: C.textMute, marginBottom: 6, fontSize: 13 },
  field: { marginBottom: 14 },
  inputInner: { fontSize: 14, color: C.text, padding: 0 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    marginBottom: 14,
    fontSize: 18,
    letterSpacing: 4,
  },
  error: { color: Colors.error, marginBottom: 10 },
  link: { color: C.g1a, textAlign: 'center', marginTop: 20, fontSize: 15 },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    backgroundColor: C.glass,
  },
  roleActive: {
    borderColor: C.g1a,
    backgroundColor: 'rgba(0,212,255,0.12)',
  },
  roleText: { color: C.textMute, fontWeight: '600' },
  roleTextActive: { color: C.g1a },
  deptScroll: { marginBottom: 14, maxHeight: 44 },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginRight: 8,
    backgroundColor: C.glass,
  },
  deptChipActive: {
    borderColor: C.g1a,
    backgroundColor: 'rgba(0,212,255,0.12)',
  },
  deptText: { color: C.textMute, fontSize: 12 },
  deptTextActive: { color: C.g1a, fontWeight: '600' },
});
