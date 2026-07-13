import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/mock_flags.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loader.dart';

class CourseAnalyticsScreen extends ConsumerStatefulWidget {
  const CourseAnalyticsScreen({super.key, required this.courseId});

  final int courseId;

  @override
  ConsumerState<CourseAnalyticsScreen> createState() => _CourseAnalyticsScreenState();
}

class _CourseAnalyticsScreenState extends ConsumerState<CourseAnalyticsScreen> {
  Map<String, dynamic> _data = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (MockFlags.courseAnalytics) {
      await Future.delayed(const Duration(milliseconds: 400));
      if (mounted) {
        setState(() {
          _data = {
            'progress': 68,
            'videosWatched': 12,
            'totalVideos': 18,
            'studyHours': 14,
            'weekly': [20, 35, 50, 45, 60, 72, 68],
          };
          _loading = false;
        });
      }
      return;
    }
    try {
      final course = await ref.read(courseServiceProvider).getCourse(widget.courseId);
      if (mounted) {
        setState(() {
          _data = {'progress': course.progress ?? 0};
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final weekly = (_data['weekly'] as List?)?.cast<num>() ?? [10, 20, 30, 40, 50, 55, 60];

    return Scaffold(
      body: _loading
          ? const ShimmerList()
          : ListView(
              padding: const EdgeInsets.only(bottom: 40),
              children: [
                const SectionHeader(title: 'Course analytics', subtitle: 'Progress'),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Expanded(child: _Metric(label: 'Progress', value: '${_data['progress'] ?? 0}%')),
                      const SizedBox(width: 12),
                      Expanded(child: _Metric(label: 'Videos', value: '${_data['videosWatched'] ?? 0}/${_data['totalVideos'] ?? 0}')),
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
                        const Text('Weekly activity', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 120,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: List.generate(weekly.length, (i) {
                              final v = weekly[i].toDouble();
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 3),
                                  child: Container(
                                    height: v.clamp(8, 100),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(6),
                                      gradient: AppColors.gradientAccent,
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5))),
        ],
      ),
    );
  }
}
