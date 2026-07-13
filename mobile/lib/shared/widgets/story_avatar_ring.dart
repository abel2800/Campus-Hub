import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/avatar_image.dart';

/// Animated gradient story ring — pulses for unseen stories.
class StoryAvatarRing extends StatefulWidget {
  const StoryAvatarRing({
    super.key,
    required this.name,
    this.avatarUrl,
    this.size = 68,
    this.seen = false,
    this.isOwn = false,
    this.onTap,
    this.onAdd,
  });

  final String name;
  final String? avatarUrl;
  final double size;
  final bool seen;
  final bool isOwn;
  final VoidCallback? onTap;
  final VoidCallback? onAdd;

  @override
  State<StoryAvatarRing> createState() => _StoryAvatarRingState();
}

class _StoryAvatarRingState extends State<StoryAvatarRing>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inner = widget.size - 6;
    final ring = widget.seen
        ? Border.all(color: Colors.white.withValues(alpha: 0.2), width: 2.5)
        : null;

    Widget avatar = AvatarImage(
      url: widget.avatarUrl,
      name: widget.name,
      size: inner - 4,
    );

    if (widget.isOwn) {
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          Positioned(
            bottom: 0,
            right: 0,
            child: GestureDetector(
              onTap: widget.onAdd,
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.gradientPrimary,
                ),
                child: const Icon(Icons.add, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      );
    }

    return GestureDetector(
      onTap: widget.onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulse,
            builder: (context, child) {
              final scale = widget.seen ? 1.0 : 1.0 + _pulse.value * 0.04;
              return Transform.scale(
                scale: scale,
                child: Container(
                  width: widget.size,
                  height: widget.size,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: widget.seen ? null : AppColors.gradientPrimary,
                    border: ring,
                    boxShadow: widget.seen
                        ? null
                        : [
                            BoxShadow(
                              color: AppColors.electricCyan.withValues(
                                alpha: 0.25 + _pulse.value * 0.15,
                              ),
                              blurRadius: 16 + _pulse.value * 8,
                            ),
                          ],
                  ),
                  child: child,
                ),
              );
            },
            child: ClipOval(child: avatar),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: widget.size + 8,
            child: Text(
              widget.isOwn ? 'Your story' : widget.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Colors.white.withValues(alpha: 0.75),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
