import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/course_model.dart';

class CourseGlassCard extends StatefulWidget {
  const CourseGlassCard({
    super.key,
    required this.course,
    required this.onTap,
    this.onEnroll,
    this.compact = false,
    this.enrolling = false,
  });

  final CourseModel course;
  final VoidCallback onTap;
  final VoidCallback? onEnroll;
  final bool compact;
  final bool enrolling;

  @override
  State<CourseGlassCard> createState() => _CourseGlassCardState();
}

class _CourseGlassCardState extends State<CourseGlassCard> {
  double _tiltX = 0;
  double _tiltY = 0;

  @override
  Widget build(BuildContext context) {
    final img = ApiConfig.mediaUrl(widget.course.cover);
    final progress = widget.course.progress ?? 0;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap();
      },
      onPanUpdate: (d) {
        setState(() {
          _tiltX = (d.delta.dy / 40).clamp(-0.08, 0.08);
          _tiltY = (-d.delta.dx / 40).clamp(-0.08, 0.08);
        });
      },
      onPanEnd: (_) => setState(() { _tiltX = 0; _tiltY = 0; }),
      child: Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()
          ..setEntry(3, 2, 0.001)
          ..rotateX(_tiltX)
          ..rotateY(_tiltY),
        child: GlassCard(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
                    child: AspectRatio(
                      aspectRatio: widget.compact ? 1.4 : 16 / 10,
                      child: img.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: img,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => _thumbPlaceholder(),
                              errorWidget: (_, __, ___) => _thumbPlaceholder(),
                            )
                          : _thumbPlaceholder(),
                    ),
                  ),
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            AppColors.deepSpace.withValues(alpha: 0.85),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (progress > 0)
                    Positioned(
                      left: 12,
                      right: 12,
                      bottom: 12,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: progress / 100,
                          minHeight: 4,
                          backgroundColor: Colors.white24,
                          color: AppColors.electricCyan,
                        ),
                      ),
                    ),
                  if (widget.course.department != null)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: _TagChip(widget.course.department!),
                    ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.course.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.display(context, size: widget.compact ? 14 : 16),
                    ),
                    const SizedBox(height: 8),
                    if (!widget.compact)
                      Text(
                        widget.course.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.body(context, size: 12).copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                      ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        AvatarImage(
                          name: widget.course.teacherName ?? 'T',
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.course.teacherName ?? 'Instructor',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.white.withValues(alpha: 0.6),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (widget.onEnroll != null)
                          _EnrollButton(
                            enrolling: widget.enrolling,
                            onTap: widget.onEnroll!,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.06, curve: Curves.easeOutCubic);
  }

  Widget _thumbPlaceholder() => Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientPrimary),
        child: const Center(
          child: Icon(Icons.school_outlined, size: 40, color: Colors.white38),
        ),
      );
}

class _TagChip extends StatelessWidget {
  const _TagChip(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}

class _EnrollButton extends StatelessWidget {
  const _EnrollButton({required this.onTap, required this.enrolling});
  final VoidCallback onTap;
  final bool enrolling;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enrolling ? null : () {
        HapticFeedback.mediumImpact();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: enrolling ? null : AppColors.gradientPrimary,
          color: enrolling ? Colors.white12 : null,
          borderRadius: BorderRadius.circular(20),
          boxShadow: enrolling
              ? null
              : [
                  BoxShadow(
                    color: AppColors.electricCyan.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: enrolling
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.electricCyan),
              )
            : const Text('Enroll', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
      ),
    );
  }
}
