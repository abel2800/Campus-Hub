import 'package:flutter/material.dart';

/// Tokens from Campus Hub HTML mockups — single source of truth.
class AppColors {
  // Backgrounds
  static const deepSpace = Color(0xFF05070D);
  static const darkBg = Color(0xFF0B0F1A);
  static const darkCard = Color(0xFF12182A);
  static const darkSurface = Color(0xFF1A1F2E);
  static const bannerGradStart = Color(0xFF182035);
  static const bannerGradEnd = Color(0xFF0C1220);

  // Text
  static const textPrimary = Color(0xFFF2F4F8);
  static const textDim = Color(0xFF8E96A8);
  static const textMute = Color(0xFF5B6272);
  static const onGradient = Color(0xFF04101A);

  // Gradients — cyan→violet, emerald→teal
  static const g1a = Color(0xFF22E1FF);
  static const g1b = Color(0xFF8A5CFF);
  static const g2a = Color(0xFF00FFB2);
  static const g2b = Color(0xFF00C2A8);

  // Aliases
  static const electricCyan = g1a;
  static const violet = g1b;
  static const emerald = g2a;
  static const teal = g2b;
  static const cyan = g1a;
  static const indigo = g1b;
  static const purple = g1b;
  static const neonBlue = g1a;

  // Glass
  static const glassFill = Color(0x0EFFFFFF); // ~5.5%
  static const glassBorder = Color(0x1AFFFFFF); // ~10%

  // Semantic
  static const danger = Color(0xFFE24B4A);
  static const lightBg = Color(0xFFF4F6FB);
  static const lightCard = Color(0xFFFFFFFF);

  static const gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [g1a, g1b],
  );

  static const gradientAccent = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [g2a, g2b],
  );

  static const gradientHero = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0D1120), deepSpace],
  );

  static const gradientBanner = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [bannerGradStart, bannerGradEnd],
  );

  static BoxShadow get btnGlow => BoxShadow(
        color: g1a.withValues(alpha: 0.5),
        blurRadius: 24,
        offset: const Offset(0, 8),
        spreadRadius: -6,
      );
}
