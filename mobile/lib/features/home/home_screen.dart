import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';
import '../../shared/widgets/shimmer_loader.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<CourseModel> _enrolled = [];
  List<CourseModel> _catalog = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(courseServiceProvider);
      final enrolled = await svc.getEnrolledCourses();
      final catalog = await svc.getAllCourses();
      if (mounted) setState(() { _enrolled = enrolled; _catalog = catalog; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  CourseModel? get _continueCourse {
    final inProgress = _enrolled.where((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
    if (inProgress.isNotEmpty) return inProgress.first;
    return _enrolled.isNotEmpty ? _enrolled.first : null;
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final unread = ref.watch(unreadNotificationsProvider);
    final continueCourse = _continueCourse;

    return Stack(
      children: [
        const GlowOrb(size: 180, top: -40, right: -40),
        RefreshIndicator(
          onRefresh: _load,
          color: AppColors.g1a,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Scaffold.of(context).openDrawer(),
                        icon: const Icon(Icons.menu_rounded, color: AppColors.textDim, size: 22),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_greeting(), style: AppTypography.eyebrow(context)),
                            Text(
                              user?.username ?? 'Student',
                              style: AppTypography.screenTitle(context),
                            ),
                          ],
                        ),
                      ),
                      CampusIconButton(
                        icon: Icons.notifications_none_rounded,
                        badge: unread > 0,
                        onPressed: () => context.push('/notifications'),
                      ),
                      const SizedBox(width: 10),
                      GestureDetector(
                        onTap: () => context.go('/profile'),
                        child: _GradientRing(
                          child: AvatarImage(url: user?.avatar, name: user?.username, size: 30),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(),
              ),
              if (_loading)
                const SliverFillRemaining(child: ShimmerList())
              else ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          CampusChip(
                            label: '12 day streak',
                            icon: Icons.local_fire_department_outlined,
                          ),
                          const SizedBox(width: 8),
                          CampusChip(
                            label: '${_enrolled.length} courses',
                            icon: Icons.menu_book_outlined,
                            onTap: () => context.push('/my-courses'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (continueCourse != null) ...[
                  const SliverToBoxAdapter(child: CampusSectionLabel('Continue learning')),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: GestureDetector(
                        onTap: () => context.push('/course/${continueCourse.id}'),
                        child: GlassCard(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  gradient: AppColors.gradientAccent,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      continueCourse.title,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      '${continueCourse.teacherName ?? 'Instructor'} · ${continueCourse.progress ?? 0}% done',
                                      style: const TextStyle(fontSize: 10, color: AppColors.textMute),
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: ((continueCourse.progress ?? 0) / 100).clamp(0, 1),
                                        minHeight: 4,
                                        backgroundColor: Colors.white.withValues(alpha: 0.08),
                                        color: AppColors.g1a,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
                SliverToBoxAdapter(
                  child: CampusSectionLabel(
                    'Explore courses',
                    action: 'See all',
                    onAction: () => context.go('/courses'),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 0.82,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        if (i >= _catalog.take(4).length) return null;
                        final c = _catalog[i];
                        final grad = i.isEven ? AppColors.gradientPrimary : AppColors.gradientAccent;
                        return GestureDetector(
                          onTap: () => context.push('/course/${c.id}'),
                          child: GlassCard(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: double.infinity,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    gradient: grad,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  c.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  c.teacherName ?? 'Instructor',
                                  style: const TextStyle(fontSize: 9, color: AppColors.textMute),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      childCount: _catalog.take(4).length,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _GradientRing extends StatelessWidget {
  const _GradientRing({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      padding: const EdgeInsets.all(2),
      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.gradientPrimary),
      child: ClipOval(child: child),
    );
  }
}
