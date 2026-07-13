import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/primary_button.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';

class CourseDetailScreen extends ConsumerStatefulWidget {
  const CourseDetailScreen({super.key, required this.courseId});
  final int courseId;

  @override
  ConsumerState<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends ConsumerState<CourseDetailScreen> {
  CourseModel? _course;
  List<CourseVideoModel> _videos = [];
  bool _loading = true;
  bool _enrolled = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final service = ref.read(courseServiceProvider);
    try {
      final course = await service.getCourse(widget.courseId);
      final videos = await service.getVideos(widget.courseId);
      List<CourseModel> enrolled = [];
      try {
        enrolled = await service.getEnrolledCourses();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _course = course;
          _videos = videos;
          _enrolled = enrolled.any((c) => c.id == widget.courseId);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleEnroll() async {
    final service = ref.read(courseServiceProvider);
    try {
      if (_enrolled) {
        await service.unenroll(widget.courseId);
      } else {
        await service.enroll(widget.courseId);
      }
      setState(() => _enrolled = !_enrolled);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final course = _course;
    if (course == null) {
      return const Scaffold(body: Center(child: Text('Course not found')));
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(course.title, style: const TextStyle(fontSize: 16)),
              background: _courseHeader(course),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(course.description,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                  const SizedBox(height: 20),
                  PrimaryButton(
                    label: _enrolled ? 'Unenroll' : 'Enroll Now',
                    onPressed: _toggleEnroll,
                    icon: _enrolled ? Icons.check_circle : Icons.add,
                  ),
                  const SizedBox(height: 28),
                  const Text('Lessons', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._videos.map((v) => _VideoTile(video: v, courseId: widget.courseId)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _courseHeader(CourseModel course) {
    final img = ApiConfig.mediaUrl(course.cover);
    if (img.isEmpty) {
      return Container(decoration: const BoxDecoration(gradient: AppColors.gradientPrimary));
    }
    return CachedNetworkImage(imageUrl: img, fit: BoxFit.cover);
  }
}

class _VideoTile extends StatelessWidget {
  const _VideoTile({required this.video, required this.courseId});
  final CourseVideoModel video;
  final int courseId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.play_arrow_rounded, color: Colors.white),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(video.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('Lesson ${video.order}',
                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}
