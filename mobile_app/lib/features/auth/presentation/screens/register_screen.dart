import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../controllers/auth_controller.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _meterController = TextEditingController();
  
  String? _selectedCompanyCode;
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _meterController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final dio = ref.read(dioProvider);
      
      // Call register API
      final response = await dio.post(
        '/auth/register',
        data: {
          'full_name': _fullNameController.text.trim(),
          'username': _usernameController.text.trim(),
          'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
          'phone_number': _phoneController.text.trim(),
          'password': _passwordController.text,
          'meter_number': _meterController.text.trim(),
          'company_code': _selectedCompanyCode,
        },
      );

      if (!mounted) return;
      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول',
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
      final msg = e.response?.data?['message'] ?? 'فشل إنشاء الحساب، يرجى التحقق من البيانات';
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

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(
            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
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

  @override
  Widget build(BuildContext context) {
    final companiesAsync = ref.watch(companiesProvider);

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
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                      ),
                      const Spacer(),
                      const Text(
                        'حساب مشترك جديد',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(width: 48), // visually balancing the back button
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 10.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 10),
                          
                          // Logo icon
                          Center(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.primaryColor.withValues(alpha: 0.12),
                              ),
                              child: const Icon(
                                Icons.person_add_alt_1_rounded,
                                size: 48,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ).animate().fade(duration: 500.ms).scale(),

                          const SizedBox(height: 24),

                          // ── Company Dropdown ───────────────────────────────
                          companiesAsync.when(
                            data: (companies) {
                              if (companies.isEmpty) return const SizedBox.shrink();

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
                                      iconEnabledColor: AppTheme.primaryColor,
                                      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 14),
                                      decoration: InputDecoration(
                                        labelText: 'شركة الكهرباء الكهربائية',
                                        labelStyle: const TextStyle(
                                            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 14),
                                        hintText: 'اختر شركة الكهرباء',
                                        hintStyle: const TextStyle(
                                            color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                                        prefixIcon: const Icon(Icons.business_rounded, color: AppTheme.primaryColor),
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
                                    child: CircularProgressIndicator(color: AppTheme.primaryColor),
                                  ),
                                ),
                                SizedBox(height: 14),
                              ],
                            ),
                            error: (err, stack) => const SizedBox.shrink(),
                          ).animate().fade(delay: 100.ms).slideY(begin: 0.1),

                          // ── Full Name Field ───────────────────────────────
                          _buildField(
                            controller: _fullNameController,
                            hint: 'الاسم الكامل للمشترك',
                            icon: Icons.person_rounded,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'الاسم الكامل مطلوب';
                              }
                              return null;
                            },
                          ).animate().fade(delay: 150.ms).slideX(begin: -0.05),

                          const SizedBox(height: 14),

                          // ── Username Field ────────────────────────────────
                          _buildField(
                            controller: _usernameController,
                            hint: 'اسم المستخدم للولوج للتطبيق',
                            icon: Icons.alternate_email_rounded,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'اسم المستخدم مطلوب';
                              }
                              return null;
                            },
                          ).animate().fade(delay: 200.ms).slideX(begin: 0.05),

                          const SizedBox(height: 14),

                          // ── Phone Number Field ───────────────────────────
                          _buildField(
                            controller: _phoneController,
                            hint: 'رقم الجوال النشط للتحقق والاتصال',
                            icon: Icons.phone_rounded,
                            keyboardType: TextInputType.phone,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'رقم الجوال مطلوب';
                              }
                              return null;
                            },
                          ).animate().fade(delay: 250.ms).slideX(begin: -0.05),

                          const SizedBox(height: 14),

                          // ── Meter Number Field ────────────────────────────
                          _buildField(
                            controller: _meterController,
                            hint: 'رقم العداد المسجل باسمك',
                            icon: Icons.electric_meter_rounded,
                            keyboardType: TextInputType.number,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'رقم العداد مطلوب لمطابقة حسابك';
                              }
                              return null;
                            },
                          ).animate().fade(delay: 300.ms).slideX(begin: 0.05),

                          const SizedBox(height: 14),

                          // ── Email Field (Optional) ────────────────────────
                          _buildField(
                            controller: _emailController,
                            hint: 'البريد الإلكتروني (اختياري)',
                            icon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                          ).animate().fade(delay: 350.ms).slideX(begin: -0.05),

                          const SizedBox(height: 14),

                          // ── Password Field ────────────────────────────────
                          _buildField(
                            controller: _passwordController,
                            hint: 'كلمة مرور لا تقل عن 8 خانات',
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
                              onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'كلمة المرور مطلوبة';
                              }
                              if (value.length < 8) {
                                return 'يجب ألا تقل كلمة المرور عن 8 أحرف';
                              }
                              return null;
                            },
                          ).animate().fade(delay: 400.ms).slideX(begin: 0.05),

                          const SizedBox(height: 30),

                          // ── Submit Button ─────────────────────────────────
                          ElevatedButton(
                            onPressed: _isLoading ? null : _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor:
                                  AppTheme.primaryColor.withValues(alpha: 0.5),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 8,
                              shadowColor: AppTheme.primaryColor.withValues(alpha: 0.4),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 22,
                                    width: 22,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2.5),
                                  )
                                : const Text(
                                    'تسجيل الحساب وتأكيد العداد',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ).animate().fade(delay: 450.ms).scale(),

                          const SizedBox(height: 20),
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
