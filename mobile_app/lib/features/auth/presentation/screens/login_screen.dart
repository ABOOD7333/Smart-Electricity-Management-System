import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_theme.dart';
import '../controllers/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _meterController = TextEditingController();
  bool _obscurePassword = true;
  bool _isCustomer = true; // default: subscriber view
  String? _selectedCompanyCode;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _meterController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _toggleUserType(bool isCustomer) {
    if (_isCustomer == isCustomer) return;
    setState(() {
      _isCustomer = isCustomer;
      _formKey.currentState?.reset();
    });
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      FocusScope.of(context).unfocus();
      final success = await ref.read(authProvider.notifier).login(
            _usernameController.text.trim(),
            _passwordController.text,
            companyCode: _selectedCompanyCode,
          );

      if (success && mounted) {
        final authState = ref.read(authProvider);
        if (authState.user != null) {
          if (authState.user!.role == 'customer') {
            context.go('/customer');
          } else {
            context.go('/technician');
          }
        }
      } else if (mounted) {
        final errorMsg =
            ref.read(authProvider).errorMessage ?? AppStrings.loginFailed;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              errorMsg,
              style: const TextStyle(fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            backgroundColor: AppTheme.dangerColor,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  // Reusable styled input field
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
    final authState = ref.watch(authProvider);
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
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 20),

                      // Logo
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryColor.withValues(alpha: 0.12),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryColor.withValues(alpha: 0.25),
                                blurRadius: 35,
                                spreadRadius: 8,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.bolt_rounded,
                            size: 62,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      )
                          .animate()
                          .fade(duration: 700.ms)
                          .scale(delay: 200.ms),

                      const SizedBox(height: 22),

                      // App Name
                      Text(
                        AppStrings.appName,
                        textAlign: TextAlign.center,
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                      ).animate().fade(delay: 300.ms).slideY(begin: 0.2),

                      const SizedBox(height: 6),

                      Text(
                        AppStrings.loginSubtitle,
                        textAlign: TextAlign.center,
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.darkTextSecondary,
                                  fontSize: 13,
                                ),
                      ).animate().fade(delay: 400.ms),

                      const SizedBox(height: 30),

                      // ── User Type Toggle ──────────────────────────────────
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.darkCardBg.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppTheme.primaryColor.withValues(alpha: 0.2),
                          ),
                        ),
                        padding: const EdgeInsets.all(4),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => _toggleUserType(true),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: _isCustomer
                                        ? AppTheme.primaryColor
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: _isCustomer
                                        ? [
                                            BoxShadow(
                                              color: AppTheme.primaryColor
                                                  .withValues(alpha: 0.35),
                                              blurRadius: 10,
                                              spreadRadius: 1,
                                            )
                                          ]
                                        : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.person_outline_rounded,
                                        size: 18,
                                        color: _isCustomer
                                            ? Colors.white
                                            : AppTheme.darkTextSecondary,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'مشترك',
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: _isCustomer
                                              ? Colors.white
                                              : AppTheme.darkTextSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => _toggleUserType(false),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: !_isCustomer
                                        ? AppTheme.primaryColor
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: !_isCustomer
                                        ? [
                                            BoxShadow(
                                              color: AppTheme.primaryColor
                                                  .withValues(alpha: 0.35),
                                              blurRadius: 10,
                                              spreadRadius: 1,
                                            )
                                          ]
                                        : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.badge_outlined,
                                        size: 18,
                                        color: !_isCustomer
                                            ? Colors.white
                                            : AppTheme.darkTextSecondary,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'موظف الشركة',
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: !_isCustomer
                                              ? Colors.white
                                              : AppTheme.darkTextSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fade(delay: 450.ms).slideY(begin: 0.1),

                      const SizedBox(height: 20),

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
                                  iconEnabledColor: AppTheme.primaryColor,
                                  style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'شركة الكهرباء',
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
                      ).animate().fade(delay: 480.ms).slideY(begin: 0.1),


                      // ── Username Field ───────────────────────────────────
                      _buildField(
                        controller: _usernameController,
                        hint: AppStrings.usernameLabel,
                        icon: Icons.person_outline_rounded,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return AppStrings.usernameRequired;
                          }
                          return null;
                        },
                      ).animate().fade(delay: 500.ms).slideX(begin: -0.08),

                      const SizedBox(height: 14),

                      // ── Password Field ──────────────────────────────────
                      _buildField(
                        controller: _passwordController,
                        hint: AppStrings.passwordLabel,
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
                            return AppStrings.passwordRequired;
                          }
                          return null;
                        },
                      ).animate().fade(delay: 560.ms).slideX(begin: 0.08),

                      // ── Meter Field (subscribers only) ──────────────────
                      AnimatedSize(
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeInOut,
                        child: _isCustomer
                            ? Column(
                                children: [
                                  const SizedBox(height: 14),
                                  _buildField(
                                    controller: _meterController,
                                    hint: 'رقم العداد',
                                    icon: Icons.electric_meter_outlined,
                                    keyboardType: TextInputType.number,
                                    validator: (value) {
                                      if (_isCustomer &&
                                          (value == null ||
                                              value.trim().isEmpty)) {
                                        return 'رقم العداد مطلوب للمشتركين';
                                      }
                                      return null;
                                    },
                                  ),
                                ],
                              )
                            : const SizedBox.shrink(),
                      ),

                      // ── Forgot Password ─────────────────────────────────
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.primaryColor,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 4, vertical: 4),
                          ),
                          child: const Text(
                            'نسيت كلمة المرور؟',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      // ── Login Button ────────────────────────────────────
                      ElevatedButton(
                        onPressed: authState.isLoading ? null : _handleLogin,
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
                        child: authState.isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Text(
                                AppStrings.loginButton,
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ).animate().fade(delay: 680.ms).scale(),

                      const SizedBox(height: 16),

                      // ── Divider with text ───────────────────────────────
                      Row(
                        children: [
                          Expanded(
                              child: Divider(
                                  color:
                                      Colors.white.withValues(alpha: 0.1),
                                  thickness: 1)),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              'أو',
                              style: TextStyle(
                                color: AppTheme.darkTextSecondary,
                                fontFamily: 'Cairo',
                                fontSize: 13,
                              ),
                            ),
                          ),
                          Expanded(
                              child: Divider(
                                  color:
                                      Colors.white.withValues(alpha: 0.1),
                                  thickness: 1)),
                        ],
                      ).animate().fade(delay: 720.ms),

                      const SizedBox(height: 14),

                      // ── Register Subscriber Button (subscribers only) ─────
                      AnimatedSize(
                        duration: const Duration(milliseconds: 300),
                        child: _isCustomer
                            ? OutlinedButton.icon(
                                onPressed: () => context.push('/register'),
                                icon: const Icon(
                                  Icons.person_add_alt_1_outlined,
                                  size: 20,
                                ),
                                label: const Text(
                                  'إنشاء حساب مشترك جديد',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.primaryColor,
                                  side: BorderSide(
                                    color:
                                        AppTheme.primaryColor.withValues(alpha: 0.6),
                                    width: 1.5,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                              ).animate().fade(delay: 760.ms).slideY(begin: 0.1)
                            : const SizedBox.shrink(),
                      ),

                      const SizedBox(height: 10),

                      // ── Register Company Button (always visible) ──────────
                      TextButton.icon(
                        onPressed: () => context.push('/register-company'),
                        icon: const Icon(
                          Icons.business_outlined,
                          size: 18,
                          color: AppTheme.darkTextSecondary,
                        ),
                        label: const Text(
                          'تسجيل شركة كهرباء جديدة',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 13,
                            color: AppTheme.darkTextSecondary,
                          ),
                        ),
                      ).animate().fade(delay: 800.ms),

                      const SizedBox(height: 18),

                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
