import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../controllers/auth_controller.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _meterController = TextEditingController();
  String? _selectedCompanyCode;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _meterController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      await dio.post(
        '/auth/forgot-password',
        data: {
          'phone_number': _phoneController.text.trim(),
          'meter_number': _meterController.text.trim(),
          'company_code': _selectedCompanyCode,
        },
      );

      if (mounted) {
        // Navigate to OTP verification screen passing phone, meter and company code
        context.push(
          '/verify-otp',
          extra: {
            'phone': _phoneController.text.trim(),
            'meter_number': _meterController.text.trim(),
            'company_code': _selectedCompanyCode,
          },
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'تعذّر إرسال الرمز، تحقق من البيانات';
      if (mounted) _showError(msg);
    } catch (_) {
      if (mounted) _showError('حدث خطأ غير متوقع، حاول مجدداً');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg,
            style: const TextStyle(fontFamily: 'Cairo'),
            textAlign: TextAlign.center),
        backgroundColor: AppTheme.dangerColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final companiesAsync = ref.watch(companiesProvider);
    return Scaffold(
      body: Stack(
        children: [
          // Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.darkBg, Color(0xFF0F2B3E), Color(0xFF071F2E)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Back button
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back_ios_rounded,
                        color: Colors.white),
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 20),

                          // Icon
                          Center(
                            child: Container(
                              padding: const EdgeInsets.all(22),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFFFFB347).withValues(alpha: 0.12),
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        const Color(0xFFFFB347).withValues(alpha: 0.25),
                                    blurRadius: 30,
                                    spreadRadius: 5,
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.lock_reset_rounded,
                                size: 56,
                                color: Color(0xFFFFB347),
                              ),
                            ),
                          ).animate().fade(duration: 600.ms).scale(delay: 100.ms),

                          const SizedBox(height: 24),

                          Text(
                            'استعادة كلمة المرور',
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                          ).animate().fade(delay: 200.ms),

                          const SizedBox(height: 10),

                          Text(
                            'أدخل رقم جوالك ورقم عدادك المسجل لإرسال رمز التحقق',
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppTheme.darkTextSecondary,
                                  fontSize: 13,
                                  height: 1.5,
                                ),
                          ).animate().fade(delay: 300.ms),

                          const SizedBox(height: 30),

                          // ── Company Dropdown ───────────────────────────────
                          companiesAsync.when(
                            data: (companies) {
                              if (companies.isEmpty) return const SizedBox.shrink();

                              // Set default selection if none chosen
                              if (_selectedCompanyCode == null && companies.isNotEmpty) {
                                final defaultCompany = companies.firstWhere(
                                  (c) => c.companyCode == 'BPOWER',
                                  orElse: () => companies.first,
                                );
                                WidgetsBinding.instance.addPostFrameCallback((_) {
                                  if (_selectedCompanyCode == null && mounted) {
                                    setState(() {
                                      _selectedCompanyCode = defaultCompany.companyCode;
                                    });
                                  }
                                });
                              }

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Theme(
                                    data: Theme.of(context).copyWith(
                                      canvasColor: AppTheme.darkCardBg,
                                    ),
                                    child: DropdownButtonFormField<String>(
                                      value: _selectedCompanyCode,
                                      dropdownColor: AppTheme.darkCardBg,
                                      iconEnabledColor: const Color(0xFFFFB347),
                                      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 14),
                                      decoration: InputDecoration(
                                        labelText: 'شركة الكهرباء',
                                        labelStyle: const TextStyle(
                                            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 14),
                                        hintText: 'اختر شركة الكهرباء',
                                        hintStyle: const TextStyle(
                                            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                                        prefixIcon: const Icon(Icons.business_rounded, color: Color(0xFFFFB347)),
                                        filled: true,
                                        fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          borderSide: BorderSide.none,
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          borderSide: const BorderSide(color: Color(0xFFFFB347), width: 1.5),
                                        ),
                                        errorStyle: const TextStyle(
                                          color: Color(0xFFFF6B6B),
                                          fontFamily: 'Cairo',
                                          fontSize: 12,
                                        ),
                                      ),
                                      items: companies.map((company) {
                                        return DropdownMenuItem<String>(
                                          value: company.companyCode,
                                          child: Text(
                                            company.companyName,
                                            style: const TextStyle(fontFamily: 'Cairo', color: Colors.white),
                                          ),
                                        );
                                      }).toList(),
                                      onChanged: (value) {
                                        setState(() {
                                          _selectedCompanyCode = value;
                                        });
                                      },
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return 'يرجى اختيار شركة الكهرباء';
                                        }
                                        return null;
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                ],
                              );
                            },
                            loading: () => const Column(
                              children: [
                                Center(
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(vertical: 8.0),
                                    child: CircularProgressIndicator(color: Color(0xFFFFB347)),
                                  ),
                                ),
                                SizedBox(height: 14),
                              ],
                            ),
                            error: (err, stack) => const SizedBox.shrink(),
                          ).animate().fade(delay: 350.ms).slideY(begin: 0.1),

                          const SizedBox(height: 10),

                          // Phone field
                          _StyledField(
                            controller: _phoneController,
                            hint: 'رقم الجوال',
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty)
                                return 'رقم الجوال مطلوب';
                              return null;
                            },
                          ).animate().fade(delay: 400.ms).slideX(begin: -0.08),

                          const SizedBox(height: 14),

                          // Meter field
                          _StyledField(
                            controller: _meterController,
                            hint: 'رقم العداد',
                            icon: Icons.electric_meter_outlined,
                            keyboardType: TextInputType.number,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty)
                                return 'رقم العداد مطلوب';
                              return null;
                            },
                          ).animate().fade(delay: 480.ms).slideX(begin: 0.08),

                          const SizedBox(height: 36),

                          // Send OTP Button
                          ElevatedButton.icon(
                            onPressed: _isLoading ? null : _sendOtp,
                            icon: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2.5),
                                  )
                                : const Icon(Icons.send_rounded, size: 20),
                            label: const Text(
                              'إرسال رمز التحقق',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFFB347),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 8,
                              shadowColor:
                                  const Color(0xFFFFB347).withValues(alpha: 0.4),
                            ),
                          ).animate().fade(delay: 560.ms).scale(),

                          const SizedBox(height: 20),

                          // Back to login
                          TextButton(
                            onPressed: () => context.pop(),
                            child: const Text(
                              'العودة لتسجيل الدخول',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                color: AppTheme.darkTextSecondary,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ────────────────────────────────────────────────
// Shared styled text field widget for this screen
// ────────────────────────────────────────────────
class _StyledField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _StyledField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
        prefixIcon: Icon(icon, color: const Color(0xFFFFB347)),
        filled: true,
        fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide:
              const BorderSide(color: Color(0xFFFFB347), width: 1.5),
        ),
        errorStyle: const TextStyle(
          color: Color(0xFFFF6B6B),
          fontFamily: 'Cairo',
          fontSize: 12,
        ),
      ),
      validator: validator,
    );
  }
}
