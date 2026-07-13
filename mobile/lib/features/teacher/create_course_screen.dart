import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/primary_button.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';

class CreateCourseScreen extends ConsumerStatefulWidget {
  const CreateCourseScreen({super.key});

  @override
  ConsumerState<CreateCourseScreen> createState() => _CreateCourseScreenState();
}

class _CreateCourseScreenState extends ConsumerState<CreateCourseScreen> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      final course = await ref.read(teacherServiceProvider).createCourse(
            title: _title.text.trim(),
            description: _description.text.trim(),
          );
      if (mounted) context.go('/teacher/course/${course.id}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back)),
                  const Expanded(child: SectionHeader(title: 'Create course', subtitle: 'Teacher')),
                ],
              ),
              GlassCard(
                child: Column(
                  children: [
                    TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
                    const SizedBox(height: 12),
                    TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
                    const SizedBox(height: 20),
                    PrimaryButton(label: 'Create course', loading: _saving, onPressed: _submit),
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
