import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';
import '../../shared/widgets/shimmer_loader.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key, this.teacherMode = false});
  final bool teacherMode;

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  List<CourseModel> _courses = [];
  bool _loading = true;
  String _filter = 'All';
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final service = ref.read(courseServiceProvider);
      final list = widget.teacherMode
          ? await service.getTeacherCourses()
          : await service.getAllCourses();
      if (mounted) setState(() { _courses = list; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _enroll(int id) async {
    await ref.read(courseServiceProvider).enroll(id);
    _load();
  }

  List<CourseModel> get _filtered {
    var list = _courses;
    final q = _search.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      list = list.where((c) => c.title.toLowerCase().contains(q)).toList();
    }
    if (_filter == 'Enrolled') {
      // client-side: would need enrolled ids; show all with progress if any
      list = list.where((c) => (c.progress ?? 0) > 0).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CampusScreenTitle('Courses'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: CampusSearchBar(hint: 'Search courses', controller: _search, onChanged: (_) => setState(() {})),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              CampusChip(label: 'All', selected: _filter == 'All', onTap: () => setState(() => _filter = 'All')),
              const SizedBox(width: 8),
              CampusChip(label: 'Enrolled', selected: _filter == 'Enrolled', onTap: () => setState(() => _filter = 'Enrolled')),
              const SizedBox(width: 8),
              const CampusChip(label: 'Saved'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Expanded(
          child: _loading
              ? const ShimmerList()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.g1a,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final c = _filtered[i];
                      final progress = c.progress ?? 0;
                      final enrolled = progress > 0;
                      final grad = i % 3 == 0
                          ? AppColors.gradientPrimary
                          : i % 3 == 1
                              ? AppColors.gradientAccent
                              : const LinearGradient(colors: [AppColors.g1b, AppColors.g1a]);

                      return GestureDetector(
                        onTap: () => context.push('/course/${c.id}'),
                        child: GlassCard(
                          padding: const EdgeInsets.all(10),
                          child: Row(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  gradient: grad,
                                ),
                                child: enrolled
                                    ? Center(
                                        child: SizedBox(
                                          width: 38,
                                          height: 38,
                                          child: CircularProgressIndicator(
                                            value: progress / 100,
                                            strokeWidth: 3,
                                            backgroundColor: Colors.white.withValues(alpha: 0.15),
                                            color: AppColors.g2a,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c.title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                    Text(
                                      c.teacherName ?? 'Instructor',
                                      style: const TextStyle(fontSize: 9, color: AppColors.textMute),
                                    ),
                                    const SizedBox(height: 4),
                                    if (enrolled)
                                      Text('$progress% complete', style: const TextStyle(fontSize: 9, color: AppColors.g2a))
                                    else
                                      GestureDetector(
                                        onTap: () => _enroll(c.id),
                                        child: const CampusChip(label: 'Enroll', accent: true),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}
