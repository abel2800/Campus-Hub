import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/mock_flags.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loader.dart';

class TeacherAnalyticsScreen extends ConsumerStatefulWidget {
  const TeacherAnalyticsScreen({super.key});

  @override
  ConsumerState<TeacherAnalyticsScreen> createState() => _TeacherAnalyticsScreenState();
}

class _TeacherAnalyticsScreenState extends ConsumerState<TeacherAnalyticsScreen> {
  Map<String, dynamic> _data = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ref.read(teacherServiceProvider).getAnalytics();
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (_) {
      if (mounted) {
        setState(() {
          _data = MockFlags.dashboardAnalytics
              ? {'totalStudents': 128, 'activeCourses': 6, 'completionRate': 74, 'engagement': [40, 55, 48, 70, 62, 80, 75]}
              : {};
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final engagement = (_data['engagement'] as List?)?.cast<num>() ?? [30, 45, 60, 55, 70, 65, 72];

    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: _loading
              ? const ShimmerList()
              : ListView(
                  padding: const EdgeInsets.only(bottom: 40),
                  children: [
                    const SectionHeader(title: 'Teacher analytics', subtitle: 'Engagement'),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          Expanded(child: _Tile(label: 'Students', value: '${_data['totalStudents'] ?? 0}')),
                          const SizedBox(width: 12),
                          Expanded(child: _Tile(label: 'Courses', value: '${_data['activeCourses'] ?? 0}')),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Completion rate: ${_data['completionRate'] ?? 0}%', style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 16),
                            SizedBox(
                              height: 100,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: engagement.map((v) {
                                  return Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 3),
                                      child: Container(
                                        height: v.toDouble().clamp(8, 90),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(6),
                                          gradient: AppColors.gradientPrimary,
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
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

class _Tile extends StatelessWidget {
  const _Tile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5))),
        ],
      ),
    );
  }
}
