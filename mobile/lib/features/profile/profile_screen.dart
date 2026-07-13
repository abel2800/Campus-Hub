import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final initials = (user?.username ?? 'U').length >= 2
        ? user!.username.substring(0, 2).toUpperCase()
        : 'AB';

    return Stack(
      children: [
        Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 110,
                  width: double.infinity,
                  decoration: const BoxDecoration(gradient: AppColors.gradientBanner),
                ),
                const GlowOrb(size: 120, top: -30, right: -20),
              ],
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                children: [
                  Transform.translate(
                    offset: const Offset(0, -40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 76,
                          height: 76,
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.gradientPrimary,
                          ),
                          child: ClipOval(
                            child: user?.avatar != null
                                ? AvatarImage(url: user!.avatar, name: user.username, size: 72)
                                : Container(
                                    color: AppColors.darkSurface,
                                    alignment: Alignment.center,
                                    child: Text(initials, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(user?.username ?? 'Student', style: AppTypography.screenTitle(context).copyWith(fontSize: 16)),
                        Text(
                          '@${user?.username ?? 'user'} · ${user?.department ?? 'Campus'}',
                          style: const TextStyle(fontSize: 10, color: AppColors.textMute),
                        ),
                        if (user?.bio != null && user!.bio!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 6, bottom: 12),
                            child: Text(user.bio!, style: AppTypography.body(context, size: 10)),
                          )
                        else
                          const Padding(
                            padding: EdgeInsets.only(top: 6, bottom: 12),
                            child: Text(
                              'Building your campus presence.',
                              style: TextStyle(fontSize: 10, color: AppColors.textDim, height: 1.5),
                            ),
                          ),
                        Row(
                          children: [
                            Expanded(
                              child: PrimaryButton(
                                label: 'Edit profile',
                                compact: true,
                                onPressed: () => context.push('/settings'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GlassCard(
                              padding: EdgeInsets.zero,
                              borderRadius: 12,
                              child: SizedBox(
                                width: 36,
                                height: 36,
                                child: IconButton(
                                  onPressed: () {},
                                  icon: const Icon(Icons.share_outlined, size: 15),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        GlassCard(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            children: [
                              _Stat(value: '42', label: 'Posts'),
                              _divider(),
                              _Stat(value: '${user?.isTeacher == true ? '—' : '5'}', label: 'Courses'),
                              _divider(),
                              const _Stat(value: '210', label: 'Friends'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        TabBar(
                          controller: _tabs,
                          indicatorColor: AppColors.g1a,
                          indicatorWeight: 2,
                          labelColor: AppColors.textPrimary,
                          unselectedLabelColor: AppColors.textMute,
                          labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                          unselectedLabelStyle: const TextStyle(fontSize: 11),
                          tabs: const [
                            Tab(text: 'Posts'),
                            Tab(text: 'Courses'),
                            Tab(text: 'Friends'),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 200,
                          child: TabBarView(
                            controller: _tabs,
                            children: [
                              _PostGrid(),
                              Center(child: Text('Courses', style: TextStyle(color: AppColors.textMute, fontSize: 11))),
                              Center(child: Text('Friends', style: TextStyle(color: AppColors.textMute, fontSize: 11))),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        PrimaryButton(
                          label: 'Sign out',
                          onPressed: () => ref.read(authProvider.notifier).logout(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _divider() => Container(
        width: 0.5,
        height: 28,
        color: AppColors.glassBorder,
      );
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          Text(label, style: const TextStyle(fontSize: 9, color: AppColors.textMute)),
        ],
      ),
    );
  }
}

class _PostGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final grads = [
      AppColors.gradientPrimary,
      AppColors.gradientAccent,
      const LinearGradient(colors: [AppColors.g1b, AppColors.g1a]),
      null,
      null,
      null,
    ];
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: 6,
      itemBuilder: (_, i) {
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(6),
            gradient: grads[i],
            color: grads[i] == null ? AppColors.darkSurface : null,
          ),
        );
      },
    );
  }
}
