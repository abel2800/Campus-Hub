import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/primary_button.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/shimmer_loader.dart';

class MyCoursesScreen extends ConsumerStatefulWidget {
  const MyCoursesScreen({super.key});

  @override
  ConsumerState<MyCoursesScreen> createState() => _MyCoursesScreenState();
}

class _MyCoursesScreenState extends ConsumerState<MyCoursesScreen> {
  List<CourseModel> _courses = [];
  bool _loading = true;
  int _segment = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final courses = await ref.read(courseServiceProvider).getEnrolledCourses();
      if (mounted) setState(() { _courses = courses; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<CourseModel> get _visible {
    switch (_segment) {
      case 1:
        return _courses.where((c) => (c.progress ?? 0) >= 100).toList();
      case 2:
        return _courses;
      default:
        return _courses.where((c) => (c.progress ?? 0) < 100).toList();
    }
  }

  Future<void> _unenroll(int id) async {
    await ref.read(courseServiceProvider).unenroll(id);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
                child: Row(
                  children: [
                    IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back_rounded)),
                    Text('My Courses', style: AppTypography.display(context, size: 24)),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Row(
                    children: ['In Progress', 'Completed', 'All'].asMap().entries.map((e) {
                      final selected = _segment == e.key;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _segment = e.key),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 280),
                            curve: Curves.easeOutCubic,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              gradient: selected ? AppColors.gradientPrimary : null,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              e.value,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: selected ? Colors.white : Colors.white54,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              Expanded(
                child: _loading
                    ? const ShimmerList()
                    : _visible.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.school_outlined, size: 56, color: Colors.white.withValues(alpha: 0.15)),
                                const SizedBox(height: 12),
                                Text('No courses here yet', style: TextStyle(color: Colors.white.withValues(alpha: 0.5))),
                                const SizedBox(height: 16),
                                PrimaryButton(
                                  label: 'Browse catalog',
                                  compact: true,
                                  onPressed: () => context.push('/courses'),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: AppColors.electricCyan,
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                              itemCount: _visible.length,
                              itemBuilder: (_, i) {
                                final c = _visible[i];
                                final done = (c.progress ?? 0) >= 100;
                                return _CourseRow(
                                  course: c,
                                  completed: done,
                                  onTap: () => context.push('/course/${c.id}'),
                                  onUnenroll: () => _unenroll(c.id),
                                ).animate(delay: (i * 50).ms).fadeIn().slideX(begin: 0.04);
                              },
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CourseRow extends StatelessWidget {
  const _CourseRow({
    required this.course,
    required this.completed,
    required this.onTap,
    required this.onUnenroll,
  });

  final CourseModel course;
  final bool completed;
  final VoidCallback onTap;
  final VoidCallback onUnenroll;

  @override
  Widget build(BuildContext context) {
    final img = ApiConfig.mediaUrl(course.cover);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [
              Colors.white.withValues(alpha: 0.09),
              Colors.white.withValues(alpha: 0.03),
            ],
          ),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Stack(
                  children: [
                    img.isNotEmpty
                        ? Image.network(img, width: 72, height: 72, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _ph())
                        : _ph(),
                    if (completed)
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: AppColors.gradientAccent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('Done', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(course.title, style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 2),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (course.progress ?? 0) / 100,
                        minHeight: 5,
                        backgroundColor: Colors.white12,
                        color: AppColors.electricCyan,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text('${course.progress ?? 0}%', style: const TextStyle(fontSize: 11, color: AppColors.teal)),
                  ],
                ),
              ),
              PopupMenuButton(
                icon: const Icon(Icons.more_vert, size: 20),
                itemBuilder: (_) => [
                  PopupMenuItem(onTap: onUnenroll, child: const Text('Unenroll')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _ph() => Container(
        width: 72,
        height: 72,
        decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
        child: const Icon(Icons.school, color: Colors.white38),
      );
}
