import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

/// Heart burst overlay on double-tap like.
class LikeBurst extends StatefulWidget {
  const LikeBurst({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<LikeBurst> createState() => _LikeBurstState();
}

class _LikeBurstState extends State<LikeBurst> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    HapticFeedback.mediumImpact();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))
      ..forward()
      ..addStatusListener((s) {
        if (s == AnimationStatus.completed) widget.onComplete();
      });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        final t = Curves.easeOutCubic.transform(_c.value);
        return Opacity(
          opacity: 1 - t,
          child: Transform.scale(
            scale: 0.6 + t * 0.8,
            child: child,
          ),
        );
      },
      child: ShaderMask(
        shaderCallback: (b) => AppColors.gradientPrimary.createShader(b),
        child: const Icon(Icons.favorite, color: Colors.white, size: 88),
      ),
    );
  }
}
