import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  static TextStyle screenTitle(BuildContext context) {
    return GoogleFonts.spaceGrotesk(
      fontSize: 17,
      fontWeight: FontWeight.w700,
      color: AppColors.textPrimary,
    );
  }

  static TextStyle display(BuildContext context, {double size = 32}) {
    return GoogleFonts.spaceGrotesk(
      fontSize: size,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.3,
      height: 1.15,
      color: AppColors.textPrimary,
    );
  }

  static TextStyle eyebrow(BuildContext context) {
    return GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.06 * 16,
      color: AppColors.textMute,
    );
  }

  static TextStyle body(BuildContext context, {double size = 13}) {
    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: FontWeight.w400,
      height: 1.6,
      color: AppColors.textDim,
    );
  }

  static TextStyle label(BuildContext context, {bool muted = true}) {
    return GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w600,
      color: muted ? AppColors.textDim : AppColors.textPrimary,
    );
  }

  static TextStyle chip(BuildContext context) {
    return GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      color: AppColors.textDim,
    );
  }
}
