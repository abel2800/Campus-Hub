import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/shimmer_loader.dart';

class TeacherCourseDetailScreen extends ConsumerStatefulWidget {
  const TeacherCourseDetailScreen({super.key, required this.courseId});

  final int courseId;

  @override
  ConsumerState<TeacherCourseDetailScreen> createState() => _TeacherCourseDetailScreenState();
}

class _TeacherCourseDetailScreenState extends ConsumerState<TeacherCourseDetailScreen> {
  CourseModel? _course;
  List<Map<String, dynamic>> _students = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final course = await ref.read(courseServiceProvider).getCourse(widget.courseId);
      final students = await ref.read(teacherServiceProvider).getCourseStudents(widget.courseId);
      if (mounted) setState(() { _course = course; _students = students; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: _loading
              ? const ShimmerList()
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Row(
                      children: [
                        IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)),
                        Expanded(
                          child: Text(_course?.title ?? 'Course', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                        ),
                        IconButton(
                          onPressed: () => context.push('/teacher/course/${widget.courseId}/edit'),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                      ],
                    ),
                    Text(_course?.description ?? '', style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: GlassCard(
                            onTap: () => context.push('/teacher/course/${widget.courseId}/videos'),
                            padding: const EdgeInsets.all(16),
                            child: const Column(
                              children: [
                                Icon(Icons.video_library_outlined, color: AppColors.electricCyan),
                                SizedBox(height: 8),
                                Text('Manage videos'),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GlassCard(
                            onTap: () => context.push('/teacher/course/${widget.courseId}/students'),
                            padding: const EdgeInsets.all(16),
                            child: const Column(
                              children: [
                                Icon(Icons.people_outline, color: AppColors.emerald),
                                SizedBox(height: 8),
                                Text('Students'),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text('Enrolled (${_students.length})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 12),
                    ..._students.take(8).map((s) {
                      final name = s['username'] ?? s['name'] ?? 'Student';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GlassCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              const CircleAvatar(child: Icon(Icons.person, size: 18)),
                              const SizedBox(width: 12),
                              Expanded(child: Text('$name')),
                              Text('${s['progress'] ?? 0}%', style: const TextStyle(color: AppColors.teal)),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
        ),
      ),
    );
  }
}
