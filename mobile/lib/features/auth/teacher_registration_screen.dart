import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/mock_flags.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../providers/app_providers.dart';

class TeacherRegistrationScreen extends ConsumerStatefulWidget {
  const TeacherRegistrationScreen({super.key});

  @override
  ConsumerState<TeacherRegistrationScreen> createState() => _TeacherRegistrationScreenState();
}

class _TeacherRegistrationScreenState extends ConsumerState<TeacherRegistrationScreen> {
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _teacherId = TextEditingController();
  final _specialization = TextEditingController();
  final _qualification = TextEditingController();
  final _bio = TextEditingController();

  Future<void> _submit() async {
    final ok = await ref.read(authProvider.notifier).registerTeacher(
          username: _username.text.trim(),
          email: _email.text.trim(),
          password: _password.text,
          teacherId: _teacherId.text.trim(),
          specialization: _specialization.text.trim(),
          qualification: _qualification.text.trim(),
          bio: _bio.text.trim().isEmpty ? null : _bio.text.trim(),
        );
    if (!mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ref.read(authProvider).error ?? 'Registration failed')),
      );
    }
  }

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _teacherId.dispose();
    _specialization.dispose();
    _qualification.dispose();
    _bio.dispose();
    super.dispose();
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
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                Text('Teacher portal', style: AppTypography.display(context, size: 30)),
                const SizedBox(height: 8),
                Text(
                  'Register as an instructor to create and manage courses.',
                  style: AppTypography.body(context),
                ),
                if (MockFlags.teacherRegister) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Demo mode: teacher account is stored locally until backend OTP flow supports teachers.',
                    style: AppTypography.body(context, size: 13).copyWith(
                      color: Colors.amber.withValues(alpha: 0.9),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                GlassCard(
                  child: Column(
                    children: [
                      TextField(controller: _username, decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person_outline))),
                      const SizedBox(height: 12),
                      TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
                      const SizedBox(height: 12),
                      TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
                      const SizedBox(height: 12),
                      TextField(controller: _teacherId, decoration: const InputDecoration(labelText: 'Teacher ID', prefixIcon: Icon(Icons.badge_outlined))),
                      const SizedBox(height: 12),
                      TextField(controller: _specialization, decoration: const InputDecoration(labelText: 'Specialization', prefixIcon: Icon(Icons.science_outlined))),
                      const SizedBox(height: 12),
                      TextField(controller: _qualification, decoration: const InputDecoration(labelText: 'Qualification', prefixIcon: Icon(Icons.school_outlined))),
                      const SizedBox(height: 12),
                      TextField(controller: _bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio (optional)', prefixIcon: Icon(Icons.notes_outlined))),
                      const SizedBox(height: 24),
                      PrimaryButton(label: 'Create teacher account', loading: auth.loading, onPressed: _submit),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
