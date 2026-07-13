import 'package:flutter/material.dart';
import '../../core/theme/app_typography.dart';

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
  });

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (subtitle != null) ...[
                  Text(subtitle!.toUpperCase(), style: AppTypography.eyebrow(context)),
                  const SizedBox(height: 4),
                ],
                Text(title, style: AppTypography.display(context, size: 22)),
              ],
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}
