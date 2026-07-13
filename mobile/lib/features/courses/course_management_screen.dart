import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/mock_flags.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';

class CourseManagementScreen extends ConsumerStatefulWidget {
  const CourseManagementScreen({super.key});

  @override
  ConsumerState<CourseManagementScreen> createState() => _CourseManagementScreenState();
}

class _CourseManagementScreenState extends ConsumerState<CourseManagementScreen> {
  List<CourseModel> _courses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final courses = MockFlags.courseManagement
          ? await ref.read(courseServiceProvider).getAllCourses()
          : await ref.read(teacherServiceProvider).getCourses();
      if (mounted) setState(() { _courses = courses; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.only(bottom: 40),
        children: [
          SectionHeader(
            title: 'Course management',
            subtitle: 'Admin tools',
            action: IconButton(
              onPressed: () => context.push('/teacher/create-course'),
              icon: const Icon(Icons.add_circle_outline, color: AppColors.electricCyan),
            ),
          ),
          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else if (_courses.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No courses')))
          else
            ..._courses.map((c) => Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: GlassCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('${c.enrollmentCount ?? 0} students', style: const TextStyle(color: AppColors.teal, fontSize: 12)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => context.push('/teacher/course/${c.id}'),
                                child: const Text('Manage'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: PrimaryButton(
                                label: 'Videos',
                                onPressed: () => context.push('/teacher/course/${c.id}/videos'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )),
        ],
      ),
    );
  }
}
