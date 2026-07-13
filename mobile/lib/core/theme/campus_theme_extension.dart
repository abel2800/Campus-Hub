import 'package:flutter/material.dart';

/// Design tokens for Campus 2090 — access via `Theme.of(context).extension<CampusTheme>()`.
class CampusTheme extends ThemeExtension<CampusTheme> {
  const CampusTheme({
    required this.glassBorder,
    required this.glassFill,
    required this.glowCyan,
    required this.glowViolet,
    required this.eyebrowColor,
    required this.mutedText,
  });

  final Color glassBorder;
  final List<Color> glassFill;
  final Color glowCyan;
  final Color glowViolet;
  final Color eyebrowColor;
  final Color mutedText;

  static const dark = CampusTheme(
    glassBorder: Color(0x33FFFFFF),
    glassFill: [Color(0x1AFFFFFF), Color(0x08FFFFFF)],
    glowCyan: Color(0x4000E5FF),
    glowViolet: Color(0x408B5CF6),
    eyebrowColor: Color(0x9900E5FF),
    mutedText: Color(0x99FFFFFF),
  );

  static const light = CampusTheme(
    glassBorder: Color(0x66FFFFFF),
    glassFill: [Color(0xE6FFFFFF), Color(0xB3FFFFFF)],
    glowCyan: Color(0x3300E5FF),
    glowViolet: Color(0x338B5CF6),
    eyebrowColor: Color(0xFF6366F1),
    mutedText: Color(0x99000000),
  );

  @override
  CampusTheme copyWith({
    Color? glassBorder,
    List<Color>? glassFill,
    Color? glowCyan,
    Color? glowViolet,
    Color? eyebrowColor,
    Color? mutedText,
  }) {
    return CampusTheme(
      glassBorder: glassBorder ?? this.glassBorder,
      glassFill: glassFill ?? this.glassFill,
      glowCyan: glowCyan ?? this.glowCyan,
      glowViolet: glowViolet ?? this.glowViolet,
      eyebrowColor: eyebrowColor ?? this.eyebrowColor,
      mutedText: mutedText ?? this.mutedText,
    );
  }

  @override
  CampusTheme lerp(ThemeExtension<CampusTheme>? other, double t) {
    if (other is! CampusTheme) return this;
    return CampusTheme(
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      glassFill: glassFill,
      glowCyan: Color.lerp(glowCyan, other.glowCyan, t)!,
      glowViolet: Color.lerp(glowViolet, other.glowViolet, t)!,
      eyebrowColor: Color.lerp(eyebrowColor, other.eyebrowColor, t)!,
      mutedText: Color.lerp(mutedText, other.mutedText, t)!,
    );
  }
}

extension CampusThemeContext on BuildContext {
  CampusTheme get campus => Theme.of(this).extension<CampusTheme>() ?? CampusTheme.dark;
}
