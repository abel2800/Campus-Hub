import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/glass_card.dart';

class CampusChip extends StatelessWidget {
  const CampusChip({
    super.key,
    required this.label,
    this.icon,
    this.selected = false,
    this.accent = false,
    this.onTap,
  });

  final String label;
  final IconData? icon;
  final bool selected;
  final bool accent;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final child = Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        gradient: selected ? AppColors.gradientPrimary : null,
        color: selected
            ? null
            : accent
                ? AppColors.g1a.withValues(alpha: 0.12)
                : AppColors.glassFill,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: accent
              ? AppColors.g1a.withValues(alpha: 0.3)
              : selected
                  ? Colors.transparent
                  : AppColors.glassBorder,
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 14,
              color: accent
                  ? AppColors.g1a
                  : selected
                      ? AppColors.onGradient
                      : icon == Icons.local_fire_department_outlined
                          ? AppColors.g2a
                          : AppColors.g1a,
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: AppTypography.chip(context).copyWith(
              color: selected
                  ? AppColors.onGradient
                  : accent
                      ? AppColors.g1a
                      : AppColors.textDim,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return child;
    return GestureDetector(onTap: onTap, child: child);
  }
}

class CampusSearchBar extends StatelessWidget {
  const CampusSearchBar({
    super.key,
    required this.hint,
    this.controller,
    this.onChanged,
  });

  final String hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          const Icon(Icons.search, size: 15, color: AppColors.textMute),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: const TextStyle(fontSize: 11, color: AppColors.textPrimary),
              decoration: InputDecoration(
                isDense: true,
                hintText: hint,
                hintStyle: const TextStyle(fontSize: 11, color: AppColors.textMute),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CampusIconButton extends StatelessWidget {
  const CampusIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.badge = false,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final bool badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: GlassCard(
        padding: EdgeInsets.zero,
        borderRadius: 12,
        child: SizedBox(
          width: 34,
          height: 34,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(icon, size: 16, color: AppColors.textDim),
              if (badge)
                Positioned(
                  top: 8,
                  right: 9,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.g2a,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class CampusScreenTitle extends StatelessWidget {
  const CampusScreenTitle(this.title, {super.key, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
      child: Row(
        children: [
          Expanded(child: Text(title, style: AppTypography.screenTitle(context))),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class CampusSectionLabel extends StatelessWidget {
  const CampusSectionLabel(this.text, {super.key, this.action, this.onAction});

  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Row(
        children: [
          Text(text, style: AppTypography.label(context)),
          const Spacer(),
          if (action != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                action!,
                style: AppTypography.label(context, muted: false).copyWith(color: AppColors.g1a),
              ),
            ),
        ],
      ),
    );
  }
}

class GlowOrb extends StatelessWidget {
  const GlowOrb({super.key, this.size = 180, this.color = AppColors.g1a, this.top, this.right});

  final double size;
  final Color color;
  final double? top;
  final double? right;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      right: right,
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 50, sigmaY: 50),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: 0.55),
          ),
        ),
      ),
    );
  }
}
