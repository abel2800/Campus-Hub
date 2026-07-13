import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/primary_button.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/shimmer_loader.dart';

class EditCourseScreen extends ConsumerStatefulWidget {
  const EditCourseScreen({super.key, required this.courseId});

  final int courseId;

  @override
  ConsumerState<EditCourseScreen> createState() => _EditCourseScreenState();
}

class _EditCourseScreenState extends ConsumerState<EditCourseScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final course = await ref.read(courseServiceProvider).getCourse(widget.courseId);
      _title.text = course.title;
      _description.text = course.description;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(teacherServiceProvider).updateCourse(widget.courseId, {
        'title': _title.text.trim(),
        'description': _description.text.trim(),
      });
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
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
                        const Text('Edit course', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    GlassCard(
                      child: Column(
                        children: [
                          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
                          const SizedBox(height: 12),
                          TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
                          const SizedBox(height: 20),
                          PrimaryButton(label: 'Save changes', loading: _saving, onPressed: _save),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
