import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../providers/app_providers.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _step = 0;
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _department = TextEditingController();
  final _otp = TextEditingController();

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _department.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final ok = await ref.read(authProvider.notifier).requestRegisterOtp(
          email: _email.text.trim(),
          password: _password.text,
          username: _username.text.trim(),
          department: _department.text.trim().isEmpty ? null : _department.text.trim(),
          firstName: _firstName.text.trim(),
          lastName: _lastName.text.trim(),
        );
    if (!mounted) return;
    if (ok) {
      setState(() => _step = 1);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('OTP sent. Check the API terminal for your 6-digit code.'),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ref.read(authProvider).error ?? 'Could not send OTP')),
      );
    }
  }

  Future<void> _verifyOtp() async {
    final ok = await ref.read(authProvider.notifier).verifyRegisterOtp(
          _email.text.trim(),
          _otp.text.trim(),
        );
    if (!mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ref.read(authProvider).error ?? 'Verification failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => _step == 1 ? setState(() => _step = 0) : context.pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                Text(
                  _step == 0 ? 'Create account' : 'Verify email',
                  style: AppTypography.display(context, size: 32),
                ),
                const SizedBox(height: 8),
                Text(
                  _step == 0
                      ? 'Join as a student. OTP is logged in the API terminal only.'
                      : 'Enter the 6-digit code from the API terminal.',
                  style: AppTypography.body(context),
                ),
                const SizedBox(height: 28),
                GlassCard(
                  child: _step == 0 ? _buildStepOne(auth) : _buildStepTwo(auth),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.push('/login'),
                    child: const Text('Already have an account? Sign in'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepOne(AuthState auth) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name'))),
            const SizedBox(width: 12),
            Expanded(child: TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name'))),
          ],
        ),
        const SizedBox(height: 12),
        TextField(controller: _username, decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person_outline))),
        const SizedBox(height: 12),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
        const SizedBox(height: 12),
        TextField(controller: _department, decoration: const InputDecoration(labelText: 'Department', prefixIcon: Icon(Icons.school_outlined))),
        const SizedBox(height: 12),
        TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
        const SizedBox(height: 24),
        PrimaryButton(label: 'Send verification code', loading: auth.loading, onPressed: _requestOtp),
      ],
    );
  }

  Widget _buildStepTwo(AuthState auth) {
    return Column(
      children: [
        TextField(
          controller: _otp,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(
            labelText: '6-digit OTP',
            prefixIcon: Icon(Icons.verified_outlined),
            counterText: '',
          ),
        ),
        const SizedBox(height: 24),
        PrimaryButton(label: 'Verify & create account', loading: auth.loading, onPressed: _verifyOtp),
      ],
    );
  }
}
