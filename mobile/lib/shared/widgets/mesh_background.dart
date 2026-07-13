import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Animated ambient gradient mesh for hero / auth screens.
class MeshBackground extends StatefulWidget {
  const MeshBackground({super.key, this.child});

  final Widget? child;

  @override
  State<MeshBackground> createState() => _MeshBackgroundState();
}

class _MeshBackgroundState extends State<MeshBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 12))
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, child) {
        final t = _ctrl.value * 2 * math.pi;
        return Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(gradient: AppColors.gradientHero),
            ),
            _Orb(top: 0.08 + math.sin(t) * 0.04, left: 0.65, color: AppColors.violet, size: 320),
            _Orb(top: 0.55 + math.cos(t * 0.7) * 0.05, left: -0.15, color: AppColors.electricCyan, size: 280),
            _Orb(top: 0.72 + math.sin(t * 0.5) * 0.03, left: 0.5, color: AppColors.emerald, size: 200),
            if (child != null) child,
          ],
        );
      },
      child: widget.child,
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({
    required this.top,
    required this.left,
    required this.color,
    required this.size,
  });

  final double top;
  final double left;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.sizeOf(context).height * top,
      left: MediaQuery.sizeOf(context).width * left,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withValues(alpha: 0.28), Colors.transparent],
          ),
        ),
      ),
    );
  }
}
