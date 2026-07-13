import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../shared/widgets/animated_orb.dart';
import '../../shared/widgets/campus_ui.dart';
import '../../shared/widgets/mesh_background.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final _email = TextEditingController(text: 'abel@university.edu');

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.deepSpace,
      body: Stack(
        children: [
          const MeshBackground(),
          const GlowOrb(size: 220, top: -60, right: -40),
          const GlowOrb(size: 180, color: AppColors.g1b, top: 380, right: -50),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 34),
                  CampusChip(
                    label: 'Built for 2090 campus life',
                    icon: Icons.auto_awesome,
                    accent: true,
                  ).animate().fadeIn().slideY(begin: 0.15),
                  const SizedBox(height: 20),
                  RichText(
                    text: TextSpan(
                      style: AppTypography.display(context, size: 32),
                      children: [
                        const TextSpan(text: 'Your campus,\n'),
                        TextSpan(
                          text: 'fully connected.',
                          style: AppTypography.display(context, size: 32).copyWith(
                            foreground: Paint()
                              ..shader = AppColors.gradientPrimary.createShader(
                                const Rect.fromLTWH(0, 0, 280, 40),
                              ),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 120.ms).slideY(begin: 0.12),
                  const SizedBox(height: 10),
                  Text(
                    'Courses, friends and chat — one app, one signal.',
                    style: AppTypography.body(context, size: 13),
                  ).animate().fadeIn(delay: 220.ms),
                  const Spacer(),
                  const Center(child: AnimatedOrb(size: 150))
                      .animate()
                      .fadeIn(delay: 300.ms)
                      .scale(begin: const Offset(0.9, 0.9)),
                  const Spacer(),
                  GlassCard(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Email', style: AppTypography.eyebrow(context)),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _email,
                          style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                            isDense: true,
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 400.ms),
                  const SizedBox(height: 10),
                  PrimaryButton(
                    label: 'Enter Campus Hub',
                    onPressed: () => context.push('/login'),
                  ).animate().fadeIn(delay: 480.ms),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () => context.push('/register'),
                    child: Text.rich(
                      TextSpan(
                        text: 'New here? ',
                        style: AppTypography.body(context, size: 11).copyWith(color: AppColors.textMute),
                        children: [
                          TextSpan(
                            text: 'Create account',
                            style: TextStyle(color: AppColors.g1a, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
