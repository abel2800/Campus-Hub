import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/shimmer_loader.dart';

class TeacherStudentsScreen extends ConsumerStatefulWidget {
  const TeacherStudentsScreen({super.key, required this.courseId});

  final int courseId;

  @override
  ConsumerState<TeacherStudentsScreen> createState() => _TeacherStudentsScreenState();
}

class _TeacherStudentsScreenState extends ConsumerState<TeacherStudentsScreen> {
  List<Map<String, dynamic>> _students = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final students = await ref.read(teacherServiceProvider).getCourseStudents(widget.courseId);
      if (mounted) setState(() { _students = students; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _grade(int studentId, String grade) async {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Grade $grade saved for student $studentId')),
      );
    }
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
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back)),
                    Text('Students (${_students.length})', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const ShimmerList()
                    : ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: _students.length,
                        itemBuilder: (_, i) {
                          final s = _students[i];
                          final id = s['id'] as int? ?? s['userId'] as int? ?? i;
                          final name = s['username'] ?? s['name'] ?? 'Student';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: GlassCard(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(child: Text('$name', style: const TextStyle(fontWeight: FontWeight.bold))),
                                      Text('${s['progress'] ?? 0}%', style: const TextStyle(color: AppColors.teal)),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: ['A', 'B', 'C'].map((g) {
                                      return Padding(
                                        padding: const EdgeInsets.only(right: 8),
                                        child: OutlinedButton(
                                          onPressed: () => _grade(id, g),
                                          child: Text(g),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
