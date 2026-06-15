import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _profileFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();
  
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _altPhoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = true;
  bool _isSavingProfile = false;
  bool _isChangingPassword = false;
  String? _error;
  
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _altPhoneController.dispose();
    _addressController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/auth/me');
      
      if (response.statusCode == 200) {
        final userData = response.data['data'];
        setState(() {
          _user = userData;
          _emailController.text = userData['email'] ?? '';
          _phoneController.text = userData['phone_number'] ?? '';
          _isLoading = false;
        });

        // Also fetch customer details if linked to get address and alt phone
        if (userData['customer_id'] != null) {
          final custResponse = await dio.get('/customers/${userData['customer_id']}');
          if (custResponse.statusCode == 200) {
            final custData = custResponse.data['data'];
            setState(() {
              _altPhoneController.text = custData['alternate_phone'] ?? '';
              _addressController.text = custData['address'] ?? '';
            });
          }
        }
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.toFailure().message;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateProfile() async {
    if (!_profileFormKey.currentState!.validate()) return;
    
    setState(() {
      _isSavingProfile = true;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.put(
        '/auth/profile',
        data: {
          'email': _emailController.text.trim(),
          'phone_number': _phoneController.text.trim(),
          'alternate_phone': _altPhoneController.text.trim(),
          'address': _addressController.text.trim(),
        },
      );

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم تحديث بيانات ملفك الشخصي بنجاح', style: TextStyle(fontFamily: 'Cairo')),
              backgroundColor: AppTheme.successColor,
            ),
          );
          _fetchProfile(); // Reload
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toFailure().message, style: const TextStyle(fontFamily: 'Cairo')),
            backgroundColor: AppTheme.dangerColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingProfile = false;
        });
      }
    }
  }

  Future<void> _changePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    setState(() {
      _isChangingPassword = true;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.put(
        '/auth/change-password',
        data: {
          'current_password': _currentPasswordController.text,
          'new_password': _newPasswordController.text,
        },
      );

      if (response.statusCode == 200) {
        if (mounted) {
          _currentPasswordController.clear();
          _newPasswordController.clear();
          _confirmPasswordController.clear();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم تغيير كلمة المرور بنجاح!', style: TextStyle(fontFamily: 'Cairo')),
              backgroundColor: AppTheme.successColor,
            ),
          );
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toFailure().message, style: const TextStyle(fontFamily: 'Cairo')),
            backgroundColor: AppTheme.dangerColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isChangingPassword = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => context.go('/customer'),
        ),
        title: const Text(
          'الملف الشخصي والحساب',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
            : _error != null
                ? _buildErrorWidget()
                : _buildProfileContent(),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: AppTheme.dangerColor, size: 60),
            const SizedBox(height: 16),
            Text(
              _error ?? 'حدث خطأ ما',
              style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchProfile,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileContent() {
    final user = _user!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User Avatar & Title
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.primaryColor, width: 2),
                  ),
                  child: const CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.darkCardBg,
                    child: Icon(Icons.person_rounded, size: 50, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user['full_name'] ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 4),
                Text(
                  'اسم المستخدم: @${user['username']}',
                  style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12, fontFamily: 'Cairo'),
                ),
              ],
            ),
          ).animate().fade().scale(),

          const SizedBox(height: 24),

          // Read-only Details Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.darkCardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Column(
              children: [
                _buildReadOnlyRow('الشركة المشغلة', user['company_name'] ?? '—'),
                const Divider(color: Colors.white10),
                _buildReadOnlyRow('المنطقة / الحي', user['zone_name'] ?? '—'),
                const Divider(color: Colors.white10),
                _buildReadOnlyRow('الرقم الوطني / الهوية', user['national_id'] ?? '—'),
              ],
            ),
          ).animate().fade(delay: 100.ms),

          const SizedBox(height: 24),

          // Editable Profile Form
          const Text(
            'تحديث بيانات الاتصال والعنوان',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'Cairo'),
          ).animate().fade(delay: 150.ms),
          const SizedBox(height: 12),
          
          Form(
            key: _profileFormKey,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.darkCardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Phone Number
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('رقم الهاتف الأساسي', Icons.phone_rounded),
                    validator: (val) => val == null || val.isEmpty ? 'رقم الهاتف مطلوب' : null,
                  ),
                  const SizedBox(height: 16),

                  // Alternate Phone Number
                  TextFormField(
                    controller: _altPhoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('رقم هاتف بديل', Icons.phone_iphone_rounded),
                  ),
                  const SizedBox(height: 16),

                  // Email
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('البريد الإلكتروني', Icons.email_rounded),
                  ),
                  const SizedBox(height: 16),

                  // Address
                  TextFormField(
                    controller: _addressController,
                    keyboardType: TextInputType.streetAddress,
                    maxLines: 2,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('العنوان بالتفصيل', Icons.location_on_rounded),
                  ),
                  const SizedBox(height: 20),

                  // Save Profile Button
                  ElevatedButton(
                    onPressed: _isSavingProfile ? null : _updateProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: _isSavingProfile
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            'حفظ تعديلات الملف الشخصي',
                            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
            ),
          ).animate().fade(delay: 200.ms),

          const SizedBox(height: 24),

          // Change Password Section
          const Text(
            'أمان الحساب (تغيير كلمة المرور)',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'Cairo'),
          ).animate().fade(delay: 250.ms),
          const SizedBox(height: 12),

          Form(
            key: _passwordFormKey,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.darkCardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Current Password
                  TextFormField(
                    controller: _currentPasswordController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('كلمة المرور الحالية', Icons.lock_rounded),
                    validator: (val) => val == null || val.isEmpty ? 'هذا الحقل مطلوب' : null,
                  ),
                  const SizedBox(height: 16),

                  // New Password
                  TextFormField(
                    controller: _newPasswordController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('كلمة المرور الجديدة', Icons.lock_open_rounded),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'هذا الحقل مطلوب';
                      if (val.length < 8) return 'كلمة المرور يجب ألا تقل عن 8 خانات';
                      if (!RegExp(r'[A-Z]').hasMatch(val)) return 'يجب إدراج حرف كبير واحد على الأقل';
                      if (!RegExp(r'[0-9]').hasMatch(val)) return 'يجب إدراج رقم واحد على الأقل';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Confirm New Password
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('تأكيد كلمة المرور الجديدة', Icons.lock_reset_rounded),
                    validator: (val) {
                      if (val == null || val.isEmpty) return 'هذا الحقل مطلوب';
                      if (val != _newPasswordController.text) return 'كلمتا المرور غير متطابقتين';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Change Password Button
                  ElevatedButton(
                    onPressed: _isChangingPassword ? null : _changePassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.dangerColor.withValues(alpha: 0.1),
                      foregroundColor: AppTheme.dangerColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: AppTheme.dangerColor, width: 1),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                    ),
                    child: _isChangingPassword
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: AppTheme.dangerColor, strokeWidth: 2),
                          )
                        : const Text(
                            'تحديث كلمة المرور',
                            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
            ),
          ).animate().fade(delay: 300.ms),
          
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildReadOnlyRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 13, fontFamily: 'Cairo')),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
      ],
    );
  }

  InputDecoration _buildInputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 13),
      filled: true,
      fillColor: AppTheme.darkBg,
      prefixIcon: Icon(icon, color: AppTheme.darkTextSecondary, size: 20),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.dangerColor, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.dangerColor, width: 1.5),
      ),
      errorStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 11),
    );
  }
}
