import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class RegisterCompanyScreen extends ConsumerStatefulWidget {
  const RegisterCompanyScreen({super.key});

  @override
  ConsumerState<RegisterCompanyScreen> createState() =>
      _RegisterCompanyScreenState();
}

class _RegisterCompanyScreenState
    extends ConsumerState<RegisterCompanyScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0; // 0 = Company Info, 1 = Admin Account

  // Company fields
  final _companyNameController = TextEditingController();
  final _companyCodeController = TextEditingController();
  final _companyEmailController = TextEditingController();
  final _companyPhoneController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _licenseNumberController = TextEditingController();

  // Admin fields
  final _adminNameController = TextEditingController();
  final _adminUsernameController = TextEditingController();
  final _adminPasswordController = TextEditingController();
  final _adminPasswordConfirmController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _companyNameController.dispose();
    _companyCodeController.dispose();
    _companyEmailController.dispose();
    _companyPhoneController.dispose();
    _companyAddressController.dispose();
    _licenseNumberController.dispose();
    _adminNameController.dispose();
    _adminUsernameController.dispose();
    _adminPasswordController.dispose();
    _adminPasswordConfirmController.dispose();
    super.dispose();
  }

  // Auto-generate company code from name
  void _onCompanyNameChanged(String value) {
    if (value.isNotEmpty && _companyCodeController.text.isEmpty) {
      final code = value
          .trim()
          .toUpperCase()
          .replaceAll(RegExp(r'[^A-Z0-9\u0600-\u06FF ]'), '')
          .split(' ')
          .where((w) => w.isNotEmpty)
          .take(3)
          .map((w) => w.replaceAll(RegExp(r'[^\x00-\x7F]'), '').substring(0, w.length.clamp(0, 4)))
          .join('_');
      if (code.isNotEmpty && RegExp(r'^[A-Z0-9_]+$').hasMatch(code)) {
        setState(() {
          _companyCodeController.text = code;
        });
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        '/auth/register-company',
        data: {
          'company_name': _companyNameController.text.trim(),
          'company_code': _companyCodeController.text.trim().toUpperCase(),
          'email': _companyEmailController.text.trim().isEmpty
              ? null
              : _companyEmailController.text.trim(),
          'phone_number': _companyPhoneController.text.trim(),
          'address': _companyAddressController.text.trim().isEmpty
              ? null
              : _companyAddressController.text.trim(),
          'license_number': _licenseNumberController.text.trim().isEmpty
              ? null
              : _licenseNumberController.text.trim(),
          'admin_full_name': _adminNameController.text.trim(),
          'admin_username': _adminUsernameController.text.trim(),
          'admin_password': _adminPasswordController.text,
        },
      );

      if (!mounted) return;
      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSuccessDialog(
          response.data['data']['company']['company_name'] ?? '',
          _adminUsernameController.text.trim(),
          response.data['data']['company']['company_code'] ?? '',
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ??
          'فشل تسجيل الشركة، يرجى التحقق من البيانات';
      if (mounted) _showError(msg);
    } catch (_) {
      if (mounted) _showError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSuccessDialog(
      String companyName, String adminUsername, String companyCode) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.verified_rounded,
                  color: AppTheme.successColor, size: 52),
            ),
            const SizedBox(height: 20),
            Text(
              'تم تسجيل الشركة بنجاح!',
              style: TextStyle(
                color: AppTheme.successColor,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.darkBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _infoRow(Icons.business_rounded, 'الشركة', companyName),
                  const SizedBox(height: 8),
                  _infoRow(Icons.code_rounded, 'رمز الشركة', companyCode),
                  const SizedBox(height: 8),
                  _infoRow(Icons.manage_accounts_rounded, 'حساب المشرف',
                      adminUsername),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'احتفظ ببيانات حساب المشرف في مكان آمن',
              style: TextStyle(
                  color: AppTheme.darkTextSecondary,
                  fontSize: 12,
                  fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/login');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 13),
              ),
              child: const Text('الانتقال لتسجيل الدخول',
                  style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primaryColor, size: 18),
        const SizedBox(width: 8),
        Text('$label: ',
            style: const TextStyle(
                color: AppTheme.darkTextSecondary,
                fontFamily: 'Cairo',
                fontSize: 13)),
        Expanded(
          child: Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis),
        ),
      ],
    );
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
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    void Function(String)? onChanged,
    bool readOnly = false,
    int? maxLines,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      onChanged: onChanged,
      readOnly: readOnly,
      maxLines: maxLines ?? 1,
      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle:
            const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
        prefixIcon: Icon(icon, color: AppTheme.primaryColor),
        suffixIcon: suffix,
        filled: true,
        fillColor: AppTheme.darkCardBg.withValues(alpha: 0.6),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
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

  // ── Step 0: Company Info Fields ─────────────────────────────
  Widget _buildCompanyStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildField(
          controller: _companyNameController,
          hint: 'الاسم الرسمي لشركة الكهرباء',
          icon: Icons.business_rounded,
          onChanged: _onCompanyNameChanged,
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'اسم الشركة مطلوب'
              : null,
        ).animate().fade(delay: 100.ms).slideX(begin: -0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _companyCodeController,
          hint: 'رمز الشركة (مثال: KPOWER)',
          icon: Icons.code_rounded,
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'رمز الشركة مطلوب';
            final code = v.trim().toUpperCase();
            if (!RegExp(r'^[A-Z0-9_]{3,20}$').hasMatch(code)) {
              return 'الرمز يجب أن يكون حروف إنجليزية وأرقام (3-20 خانة)';
            }
            return null;
          },
        ).animate().fade(delay: 150.ms).slideX(begin: 0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _companyPhoneController,
          hint: 'رقم هاتف الشركة الرسمي',
          icon: Icons.phone_rounded,
          keyboardType: TextInputType.phone,
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'رقم الهاتف مطلوب'
              : null,
        ).animate().fade(delay: 200.ms).slideX(begin: -0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _companyEmailController,
          hint: 'البريد الإلكتروني للشركة (اختياري)',
          icon: Icons.mail_outline_rounded,
          keyboardType: TextInputType.emailAddress,
        ).animate().fade(delay: 250.ms).slideX(begin: 0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _licenseNumberController,
          hint: 'رقم الترخيص التجاري (اختياري)',
          icon: Icons.article_outlined,
        ).animate().fade(delay: 300.ms).slideX(begin: -0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _companyAddressController,
          hint: 'عنوان الشركة (اختياري)',
          icon: Icons.location_on_outlined,
          maxLines: 2,
          keyboardType: TextInputType.streetAddress,
        ).animate().fade(delay: 350.ms).slideX(begin: 0.05),
        const SizedBox(height: 28),
        ElevatedButton.icon(
          onPressed: () {
            // Validate company fields only
            if (_companyNameController.text.trim().isEmpty) {
              _showError('يرجى إدخال اسم الشركة');
              return;
            }
            if (_companyPhoneController.text.trim().isEmpty) {
              _showError('يرجى إدخال رقم الهاتف');
              return;
            }
            final code = _companyCodeController.text.trim().toUpperCase();
            if (!RegExp(r'^[A-Z0-9_]{3,20}$').hasMatch(code)) {
              _showError('رمز الشركة يجب أن يكون حروف إنجليزية وأرقام (3-20 خانة)');
              return;
            }
            setState(() => _currentStep = 1);
          },
          icon: const Icon(Icons.arrow_forward_rounded, size: 20),
          label: const Text(
            'التالي: بيانات حساب المشرف',
            style: TextStyle(fontFamily: 'Cairo', fontSize: 15, fontWeight: FontWeight.bold),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 8,
            shadowColor: AppTheme.primaryColor.withValues(alpha: 0.4),
          ),
        ).animate().fade(delay: 400.ms).scale(),
      ],
    );
  }

  // ── Step 1: Admin Account Fields ────────────────────────────
  Widget _buildAdminStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: AppTheme.primaryColor.withValues(alpha: 0.25), width: 1),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline_rounded,
                  color: AppTheme.primaryColor, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'سيتم إنشاء حساب مشرف يملك صلاحيات كاملة لإدارة شركة ${_companyNameController.text.trim()}',
                  style: const TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontFamily: 'Cairo',
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ).animate().fade(delay: 50.ms),
        const SizedBox(height: 18),
        _buildField(
          controller: _adminNameController,
          hint: 'الاسم الكامل لمشرف الشركة',
          icon: Icons.manage_accounts_rounded,
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'اسم المشرف مطلوب'
              : null,
        ).animate().fade(delay: 100.ms).slideX(begin: -0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _adminUsernameController,
          hint: 'اسم المستخدم لتسجيل الدخول',
          icon: Icons.alternate_email_rounded,
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'اسم المستخدم للمشرف مطلوب'
              : null,
        ).animate().fade(delay: 150.ms).slideX(begin: 0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _adminPasswordController,
          hint: 'كلمة مرور قوية (8 خانات+)',
          icon: Icons.lock_outline_rounded,
          obscure: _obscurePassword,
          suffix: IconButton(
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: AppTheme.darkTextSecondary,
              size: 20,
            ),
            onPressed: () =>
                setState(() => _obscurePassword = !_obscurePassword),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'كلمة المرور مطلوبة';
            if (v.length < 8) return 'يجب أن لا تقل عن 8 أحرف';
            return null;
          },
        ).animate().fade(delay: 200.ms).slideX(begin: -0.05),
        const SizedBox(height: 14),
        _buildField(
          controller: _adminPasswordConfirmController,
          hint: 'تأكيد كلمة المرور',
          icon: Icons.lock_person_rounded,
          obscure: _obscureConfirm,
          suffix: IconButton(
            icon: Icon(
              _obscureConfirm
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: AppTheme.darkTextSecondary,
              size: 20,
            ),
            onPressed: () =>
                setState(() => _obscureConfirm = !_obscureConfirm),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'تأكيد كلمة المرور مطلوب';
            if (v != _adminPasswordController.text) {
              return 'كلمتا المرور غير متطابقتين';
            }
            return null;
          },
        ).animate().fade(delay: 250.ms).slideX(begin: 0.05),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleSubmit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.successColor,
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppTheme.successColor.withValues(alpha: 0.5),
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 8,
            shadowColor: AppTheme.successColor.withValues(alpha: 0.4),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.verified_rounded, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'تسجيل الشركة الآن',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
        ).animate().fade(delay: 300.ms).scale(),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: _isLoading ? null : () => setState(() => _currentStep = 0),
          icon: const Icon(Icons.arrow_back_rounded, size: 18),
          label: const Text('العودة لبيانات الشركة',
              style: TextStyle(fontFamily: 'Cairo', fontSize: 14)),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.darkTextSecondary,
            side: BorderSide(
                color: AppTheme.darkTextSecondary.withValues(alpha: 0.4)),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ).animate().fade(delay: 350.ms),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF0A1628),
                  Color(0xFF0D2340),
                  Color(0xFF061525),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),

          // Decorative glow circles
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryColor.withValues(alpha: 0.07),
              ),
            ),
          ),
          Positioned(
            bottom: 100,
            left: -80,
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.successColor.withValues(alpha: 0.05),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // ── Header ───────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16.0, vertical: 10.0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded,
                            color: Colors.white),
                      ),
                      const Spacer(),
                      Column(
                        children: [
                          const Text(
                            'تسجيل شركة كهرباء',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          Text(
                            _currentStep == 0
                                ? 'الخطوة 1 من 2 · بيانات الشركة'
                                : 'الخطوة 2 من 2 · حساب المشرف',
                            style: const TextStyle(
                              color: AppTheme.darkTextSecondary,
                              fontSize: 12,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      const SizedBox(width: 48),
                    ],
                  ),
                ),

                // ── Step Indicator ────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          height: 4,
                          decoration: BoxDecoration(
                            color: _currentStep >= 1
                                ? AppTheme.successColor
                                : AppTheme.darkCardBg,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 6),

                // ── Company Icon ──────────────────────────────────
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (_currentStep == 0
                              ? AppTheme.primaryColor
                              : AppTheme.successColor)
                          .withValues(alpha: 0.12),
                    ),
                    child: Icon(
                      _currentStep == 0
                          ? Icons.business_rounded
                          : Icons.admin_panel_settings_rounded,
                      size: 44,
                      color: _currentStep == 0
                          ? AppTheme.primaryColor
                          : AppTheme.successColor,
                    ),
                  ),
                ).animate().scale(duration: 400.ms),

                const SizedBox(height: 10),

                // ── Form ──────────────────────────────────────────
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 28.0, vertical: 10.0),
                    child: Form(
                      key: _formKey,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        transitionBuilder: (child, anim) => FadeTransition(
                          opacity: anim,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0.05, 0),
                              end: Offset.zero,
                            ).animate(anim),
                            child: child,
                          ),
                        ),
                        child: _currentStep == 0
                            ? _buildCompanyStep()
                            : _buildAdminStep(),
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
