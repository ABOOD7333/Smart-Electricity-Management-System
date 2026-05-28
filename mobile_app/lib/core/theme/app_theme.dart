import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors
  static const Color primaryColor = Color(0xFF00ADB5); // Deep Turquoise / Teal
  static const Color secondaryColor = Color(0xFF393E46); // Cool Dark Gray
  static const Color accentColor = Color(0xFFFFD369); // Warm Gold Accent (Premium)

  // Light Theme Colors
  static const Color lightBg = Color(0xFFF7F9FC);
  static const Color lightCardBg = Colors.white;
  static const Color lightTextPrimary = Color(0xFF222831);
  static const Color lightTextSecondary = Color(0xFF626875);

  // Dark Theme Colors (Banking Level Slate/Navy Dark)
  static const Color darkBg = Color(0xFF0B141B); // Navy-Black
  static const Color darkCardBg = Color(0xFF152A38); // Dark Teal-Slate Card
  static const Color darkTextPrimary = Color(0xFFEEEEEE);
  static const Color darkTextSecondary = Color(0xFFB0BAC3);
  
  // Status Colors
  static const Color successColor = Color(0xFF2EC4B6);
  static const Color dangerColor = Color(0xFFE71D36);
  static const Color warningColor = Color(0xFFFF9F1C);
  static const Color infoColor = Color(0xFF011627);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: lightBg,
      cardTheme: CardTheme(
        color: lightCardBg,
        elevation: 2,
        shadowColor: Colors.black.withOpacity(0.05),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      textTheme: GoogleFonts.cairoTextTheme().copyWith(
        titleLarge: GoogleFonts.cairo(
          color: lightTextPrimary,
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
        titleMedium: GoogleFonts.cairo(
          color: lightTextPrimary,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        bodyLarge: GoogleFonts.cairo(
          color: lightTextPrimary,
          fontSize: 14,
        ),
        bodyMedium: GoogleFonts.cairo(
          color: lightTextSecondary,
          fontSize: 12,
        ),
      ),
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: lightCardBg,
        error: dangerColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightBg,
        elevation: 0,
        iconTheme: IconThemeData(color: lightTextPrimary),
        centerTitle: true,
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
        elevation: 4,
        shadowColor: Colors.black.withOpacity(0.2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
    );
  }
}
