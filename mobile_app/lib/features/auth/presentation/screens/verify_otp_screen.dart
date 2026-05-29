import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class VerifyOtpScreen extends ConsumerStatefulWidget {
  final String phone;
  final String meterNumber;
  final String? companyCode;

  const VerifyOtpScreen({
    super.key,
    required this.phone,
    required this.meterNumber,
    this.companyCode,
  });

  @override
  ConsumerState<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends ConsumerState<VerifyOtpScreen> {
  final _otpFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();
  
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _otpVerified = false;
  bool _obscurePassword = true;
  String? _resetToken;

  @override
  void dispose() {
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    if (!_otpFormKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        '/auth/verify-otp',
        data: {
          'phone_number': widget.phone,
          'otp_code': _otpController.text.trim(),
          'company_code': widget.companyCode,
        },
      );

      if (mounted && response.statusCode == 200) {
        setState(() {
          _otpVerified = true;
          _resetToken = response.data['resetToken'];
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم التحقق من الرمز بنجاح! أدخل كلمة المرور الجديدة',
              style: TextStyle(fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            backgroundColor: AppTheme.primaryColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'الرمز المدخل غير صحيح أو منتهي الصلاحية';
      if (mounted) _showError(msg);
    } catch (_) {
      if (mounted) _showError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        '/auth/reset-password',
        data: {
          'company_code': widget.companyCode,
          'reset_token': _resetToken,
          'new_password': _passwordController.text,
        },
      );

      if (mounted && response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول مجدداً',
              style: TextStyle(fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            backgroundColor: AppTheme.primaryColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        context.go('/login');
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'حدث خطأ أثناء إعادة تعيين كلمة المرور';
      if (mounted) _showError(msg);
    } catch (_) {
      if (mounted) _showError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
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
    final themeColor = const Color(0xFFFFB347); // Orange theme for password recovery

    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.darkBg,
                  Color(0xFF0F2B3E),
                  Color(0xFF071F2E),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header with back button
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28.0),
                    child: AnimatedCrossFade(
                      firstChild: _buildOtpStep(themeColor),
                      secondChild: _buildPasswordStep(themeColor),
                      crossFadeState: _otpVerified
                          ? CrossFadeState.showSecond
                          : CrossFadeState.showFirst,
                      duration: const Duration(milliseconds: 500),
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

  Widget _buildOtpStep(Color themeColor) {
    return Form(
      key: _otpFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: themeColor.withValues(alpha: 0.12),
                boxShadow: [
                  BoxShadow(
                    color: themeColor.withValues(alpha: 0.25),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Icon(
                Icons.sms_rounded,
                size: 56,
                color: themeColor,
              ),
            ),
          ).animate().fade(duration: 500.ms).scale(),

          const SizedBox(height: 24),

          const Text(
            'أدخل رمز التحقق (OTP)',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),

          const SizedBox(height: 10),

          Text(
            'تم إرسال رمز تحقق لجوالك رقم ${widget.phone}. يرجى كتابته هنا للمتابعة.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppTheme.darkTextSecondary,
              fontSize: 13,
              fontFamily: 'Cairo',
              height: 1.5,
            ),
          ),

          const SizedBox(height: 40),

          // OTP field
          TextFormField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontFamily: 'Cairo',
              fontSize: 24,
              letterSpacing: 8,
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              counterText: '',
              hintText: '000000',
              hintStyle: const TextStyle(
                color: AppTheme.darkTextSecondary,
                fontFamily: 'Cairo',
                letterSpacing: 8,
              ),
              prefixIcon: Icon(Icons.security, color: themeColor),
              filled: true,
              fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: themeColor, width: 1.5),
              ),
              errorStyle: const TextStyle(
                color: Color(0xFFFF6B6B),
                fontFamily: 'Cairo',
                fontSize: 12,
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'يرجى إدخال رمز التحقق';
              if (v.trim().length < 6) return 'يجب إدخال الرمز المكون من 6 أرقام';
              return null;
            },
          ).animate().fade(delay: 150.ms),

          const SizedBox(height: 36),

          ElevatedButton(
            onPressed: _isLoading ? null : _verifyOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: themeColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 8,
              shadowColor: themeColor.withValues(alpha: 0.4),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text(
                    'التحقق من الرمز',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ).animate().fade(delay: 200.ms).scale(),
        ],
      ),
    );
  }

  Widget _buildPasswordStep(Color themeColor) {
    return Form(
      key: _passwordFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: themeColor.withValues(alpha: 0.12),
                boxShadow: [
                  BoxShadow(
                    color: themeColor.withValues(alpha: 0.25),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Icon(
                Icons.vpn_key_rounded,
                size: 56,
                color: themeColor,
              ),
            ),
          ),

          const SizedBox(height: 24),

          const Text(
            'تعيين كلمة مرور جديدة',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),

          const SizedBox(height: 10),

          const Text(
            'الرجاء إدخال كلمة مرور جديدة قوية تتذكرها للدخول لحسابك لاحقاً',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.darkTextSecondary,
              fontSize: 13,
              fontFamily: 'Cairo',
              height: 1.5,
            ),
          ),

          const SizedBox(height: 40),

          // New Password field
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
            decoration: InputDecoration(
              hintText: 'كلمة المرور الجديدة',
              hintStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
              prefixIcon: Icon(Icons.lock_outline_rounded, color: themeColor),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: AppTheme.darkTextSecondary,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              filled: true,
              fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: themeColor, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'كلمة المرور الجديدة مطلوبة';
              if (v.length < 8) return 'يجب ألا تقل عن 8 أحرف';
              return null;
            },
          ),

          const SizedBox(height: 14),

          // Confirm Password field
          TextFormField(
            controller: _confirmPasswordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
            decoration: InputDecoration(
              hintText: 'تأكيد كلمة المرور',
              hintStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
              prefixIcon: Icon(Icons.lock_reset_rounded, color: themeColor),
              filled: true,
              fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: themeColor, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'تأكيد كلمة المرور مطلوب';
              if (v != _passwordController.text) return 'كلمتا المرور غير متطابقتين';
              return null;
            },
          ),

          const SizedBox(height: 36),

          ElevatedButton(
            onPressed: _isLoading ? null : _resetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: themeColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 8,
              shadowColor: themeColor.withValues(alpha: 0.4),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text(
                    'تعديل كلمة المرور ودخول',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
