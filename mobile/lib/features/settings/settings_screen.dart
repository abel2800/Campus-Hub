import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsOn = true;

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      backgroundColor: AppColors.deepSpace,
      body: GradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.only(bottom: 40),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textDim),
                    ),
                    Text('Settings', style: AppTypography.screenTitle(context)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _Section(
                children: [
                  _Row(icon: Icons.person_outline, iconColor: AppColors.g1a, label: 'Profile', onTap: () {}),
                  _divider(),
                  _Row(icon: Icons.lock_outline, iconColor: AppColors.g2a, label: 'Account', onTap: () {}),
                ],
              ),
              _Section(
                children: [
                  _Row(
                    icon: Icons.notifications_none_outlined,
                    iconColor: AppColors.g1b,
                    label: 'Notifications',
                    trailing: _GradientSwitch(value: _notificationsOn, onChanged: (v) => setState(() => _notificationsOn = v)),
                  ),
                  _divider(),
                  _Row(icon: Icons.visibility_off_outlined, iconColor: AppColors.g1a, label: 'Privacy', onTap: () {}),
                  _divider(),
                  _Row(
                    icon: Icons.dark_mode_outlined,
                    iconColor: AppColors.g2a,
                    label: 'Appearance',
                    trailing: Text(
                      themeMode == ThemeMode.dark ? 'Dark' : 'Light',
                      style: const TextStyle(fontSize: 10, color: AppColors.textMute),
                    ),
                    onTap: () => ref.read(themeModeProvider.notifier).state =
                        themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GlassCard(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: GestureDetector(
                    onTap: () => ref.read(authProvider.notifier).logout(),
                    child: const Row(
                      children: [
                        Icon(Icons.logout, size: 15, color: AppColors.danger),
                        SizedBox(width: 10),
                        Text('Log out', style: TextStyle(fontSize: 12, color: AppColors.danger)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _divider() => Container(
        height: 0.5,
        margin: const EdgeInsets.symmetric(horizontal: 12),
        color: AppColors.glassBorder,
      );
}

class _Section extends StatelessWidget {
  const _Section({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(children: children),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.icon,
    required this.iconColor,
    required this.label,
    this.onTap,
    this.trailing,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(9),
                color: iconColor.withValues(alpha: 0.12),
              ),
              child: Icon(icon, size: 15, color: iconColor),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 12))),
            trailing ?? const Icon(Icons.chevron_right, size: 14, color: AppColors.textMute),
          ],
        ),
      ),
    );
  }
}

class _GradientSwitch extends StatelessWidget {
  const _GradientSwitch({required this.value, required this.onChanged});
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 32,
        height: 18,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: value ? AppColors.gradientPrimary : null,
          color: value ? null : AppColors.glassFill,
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 200),
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 14,
            height: 14,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.onGradient,
            ),
          ),
        ),
      ),
    );
  }
}
