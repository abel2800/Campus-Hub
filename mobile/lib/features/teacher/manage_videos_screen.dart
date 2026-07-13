import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/primary_button.dart';
import '../../models/course_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/shimmer_loader.dart';

class ManageVideosScreen extends ConsumerStatefulWidget {
  const ManageVideosScreen({super.key, required this.courseId});

  final int courseId;

  @override
  ConsumerState<ManageVideosScreen> createState() => _ManageVideosScreenState();
}

class _ManageVideosScreenState extends ConsumerState<ManageVideosScreen> {
  List<CourseVideoModel> _videos = [];
  bool _loading = true;
  bool _uploading = false;
  double _uploadProgress = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final videos = await ref.read(teacherServiceProvider).getVideos(widget.courseId);
      if (mounted) setState(() { _videos = videos; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _upload() async {
    final picker = ImagePicker();
    final file = await picker.pickVideo(source: ImageSource.gallery);
    if (file == null) return;

    setState(() { _uploading = true; _uploadProgress = 0; });
    try {
      final form = FormData.fromMap({
        'video': await MultipartFile.fromFile(file.path, filename: file.name),
        'title': 'Lecture ${_videos.length + 1}',
      });
      await ref.read(teacherServiceProvider).uploadVideo(widget.courseId, form);
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    } finally {
      if (mounted) setState(() { _uploading = false; _uploadProgress = 0; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back)),
                    const Expanded(child: Text('Lecture videos', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
                  ],
                ),
              ),
              if (_uploading)
                LinearProgressIndicator(
                  value: _uploadProgress > 0 ? _uploadProgress : null,
                  color: AppColors.electricCyan,
                ),
              Expanded(
                child: _loading
                    ? const ShimmerList()
                    : ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: _videos.length,
                        itemBuilder: (_, i) {
                          final v = _videos[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: GlassCard(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  const Icon(Icons.play_circle_outline, color: AppColors.electricCyan),
                                  const SizedBox(width: 12),
                                  Expanded(child: Text(v.title)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: PrimaryButton(
                  label: _uploading ? 'Uploading...' : 'Upload video',
                  loading: _uploading,
                  onPressed: _upload,
                  icon: Icons.upload_file,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
