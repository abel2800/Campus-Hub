import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/mock_flags.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loader.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  List<CourseModel> _enrolled = [];
  bool _loading = true;
  int _studyMinutes = 0;
  int _completed = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final courses = await ref.read(courseServiceProvider).getEnrolledCourses();
      final completed = courses.where((c) => (c.progress ?? 0) >= 100).length;
      if (mounted) {
        setState(() {
          _enrolled = courses;
          _completed = completed;
          _studyMinutes = MockFlags.dashboardAnalytics
              ? courses.length * 45 + 120
              : courses.fold(0, (s, c) => s + ((c.progress ?? 0) ~/ 2));
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final active = _enrolled.where((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;

    return Scaffold(
      body: _loading
          ? const ShimmerList()
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.electricCyan,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  const SliverToBoxAdapter(child: SectionHeader(title: 'Dashboard', subtitle: 'Overview')),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.35,
                      ),
                      delegate: SliverChildListDelegate([
                        _StatTile(label: 'Total courses', value: '${_enrolled.length}', icon: Icons.school_outlined),
                        _StatTile(label: 'Active', value: '$active', icon: Icons.play_circle_outline),
                        _StatTile(label: 'Completed', value: '$_completed', icon: Icons.verified_outlined),
                        _StatTile(label: 'Study time', value: '${_studyMinutes}m', icon: Icons.schedule),
                      ]),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                      child: Text('Continue learning', style: Theme.of(context).textTheme.titleLarge),
                    ),
                  ),
                  if (_enrolled.isEmpty)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Center(child: Text('Enroll in a course to see progress here')),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) {
                          final c = _enrolled[i];
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                            child: GlassCard(
                              onTap: () => context.push('/course/${c.id}'),
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 8),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: LinearProgressIndicator(
                                      value: (c.progress ?? 0) / 100,
                                      minHeight: 6,
                                      backgroundColor: Colors.white12,
                                      color: AppColors.electricCyan,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${c.progress ?? 0}% complete', style: const TextStyle(fontSize: 12, color: AppColors.teal)),
                                ],
                              ),
                            ),
                          );
                        },
                        childCount: _enrolled.length.clamp(0, 5),
                      ),
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.electricCyan, size: 22),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
        ],
      ),
    );
  }
}
