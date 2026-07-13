import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Floating orb with ambient glow for hero / onboarding screens.
class AnimatedOrb extends StatefulWidget {
  const AnimatedOrb({super.key, this.size = 220});

  final double size;

  @override
  State<AnimatedOrb> createState() => _AnimatedOrbState();
}

class _AnimatedOrbState extends State<AnimatedOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value * 2 * math.pi;
        final dy = math.sin(t) * 12;
        final scale = 1 + math.sin(t * 0.5) * 0.04;
        return Transform.translate(
          offset: Offset(0, dy),
          child: Transform.scale(
            scale: scale,
            child: child,
          ),
        );
      },
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              AppColors.electricCyan.withValues(alpha: 0.35),
              AppColors.violet.withValues(alpha: 0.2),
              Colors.transparent,
            ],
            stops: const [0.2, 0.55, 1],
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.electricCyan.withValues(alpha: 0.25),
              blurRadius: 60,
              spreadRadius: 10,
            ),
            BoxShadow(
              color: AppColors.violet.withValues(alpha: 0.2),
              blurRadius: 80,
              spreadRadius: 4,
            ),
          ],
        ),
        child: Center(
          child: Container(
            width: widget.size * 0.55,
            height: widget.size * 0.55,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.electricCyan.withValues(alpha: 0.6),
                  AppColors.violet.withValues(alpha: 0.8),
                ],
              ),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.25),
                width: 1.5,
              ),
            ),
            child: Icon(
              Icons.hub_outlined,
              size: widget.size * 0.22,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
        ),
      ),
    );
  }
}
