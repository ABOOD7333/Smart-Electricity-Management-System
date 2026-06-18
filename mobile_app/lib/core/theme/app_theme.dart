import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Premium Space Dark from Web)
  static const Color accentCyan = Color(0xFF00F2FE); // Neon Cyan
  static const Color accentBlue = Color(0xFF4FACFE); // Bright Blue
  static const Color primaryColor = accentCyan;
  static const Color secondaryColor = Color(0xFF161A29); // Web bg-tertiary
  
  static const Color successColor = Color(0xFF10B981);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color dangerColor = Color(0xFFEF4444);

  // Dark Theme Colors (Matching Web)
  static const Color darkBg = Color(0xFF080A10); // Web bg-primary
  static const Color darkCardBg = Color(0xFF0F121D); // Web bg-secondary
  static const Color darkTextPrimary = Color(0xFFF3F4F6); // Web text-primary
  static const Color darkTextSecondary = Color(0xFF9CA3AF); // Web text-secondary

  static ThemeData get lightTheme {
    // We force dark mode mostly, but keeping light theme fallback updated just in case
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: const Color(0xFFF7F9FC),
      textTheme: GoogleFonts.cairoTextTheme().copyWith(
        titleLarge: GoogleFonts.cairo(color: const Color(0xFF111827), fontWeight: FontWeight.bold, fontSize: 20),
        titleMedium: GoogleFonts.cairo(color: const Color(0xFF111827), fontWeight: FontWeight.w600, fontSize: 16),
        bodyLarge: GoogleFonts.cairo(color: const Color(0xFF111827), fontSize: 14),
        bodyMedium: GoogleFonts.cairo(color: const Color(0xFF4B5563), fontSize: 12),
      ),
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: Colors.white,
        error: dangerColor,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: darkBg,
      cardTheme: CardTheme(
        color: darkCardBg,
        elevation: 8,
        shadowColor: Colors.black.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: Color(0x0AFFFFFF), width: 1), // subtle glass border
        ),
      ),
      textTheme: GoogleFonts.cairoTextTheme().copyWith(
        titleLarge: GoogleFonts.cairo(
          color: darkTextPrimary,
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
        titleMedium: GoogleFonts.cairo(
          color: darkTextPrimary,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        bodyLarge: GoogleFonts.cairo(
          color: darkTextPrimary,
          fontSize: 14,
        ),
        bodyMedium: GoogleFonts.cairo(
          color: darkTextSecondary,
          fontSize: 12,
        ),
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: darkCardBg,
        error: dangerColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        iconTheme: IconThemeData(color: darkTextPrimary),
        centerTitle: true,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor, // fallback
          foregroundColor: const Color(0xFF05070A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

