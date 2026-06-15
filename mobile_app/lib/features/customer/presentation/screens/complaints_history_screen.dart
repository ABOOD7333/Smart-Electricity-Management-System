import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' as intl;
import 'package:dio/dio.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class ComplaintsHistoryScreen extends ConsumerStatefulWidget {
  const ComplaintsHistoryScreen({super.key});

  @override
  ConsumerState<ComplaintsHistoryScreen> createState() => _ComplaintsHistoryScreenState();
}

class _ComplaintsHistoryScreenState extends ConsumerState<ComplaintsHistoryScreen> {
  List<dynamic> _complaints = [];
  bool _isLoading = true;
  String? _error;

  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _descController = TextEditingController();
  String _selectedCategory = 'billing';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchComplaints();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _fetchComplaints() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/complaints');
      
      if (response.statusCode == 200) {
        setState(() {
          _complaints = response.data['data'] ?? [];
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      setState(() {
        _error = e.toFailure().message;
        _isLoading = false;
      });
    }
  }

  Future<void> _submitComplaint() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post(
        '/complaints',
        data: {
          'subject': _subjectController.text.trim(),
          'description': _descController.text.trim(),
          'category': _selectedCategory,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          Navigator.of(context).pop(); // Close bottom sheet
          _subjectController.clear();
          _descController.clear();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('تم تقديم البلاغ بنجاح وسنتحقق منه قريباً', style: TextStyle(fontFamily: 'Cairo')),
              backgroundColor: AppTheme.successColor,
            ),
          );
          _fetchComplaints(); // Refresh list
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
          _isSubmitting = false;
        });
      }
    }
  }

  void _showNewComplaintBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkCardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 24,
                left: 24,
                right: 24,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'تقديم بلاغ / شكوى جديدة',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.white60),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    
                    // Category selector
                    const Text('نوع البلاغ', style: TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 12)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      dropdownColor: AppTheme.darkCardBg,
                      style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 13),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppTheme.darkBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'billing', child: Text('اعتراض على الفواتير / الرسوم')),
                        DropdownMenuItem(value: 'meter', child: Text('مشكلة فنية في العداد')),
                        DropdownMenuItem(value: 'power_cut', child: Text('انقطاع التيار الكهربائي')),
                        DropdownMenuItem(value: 'leakage', child: Text('شكوك حول تلاعب / سرقة تيار')),
                        DropdownMenuItem(value: 'service', child: Text('سوء الخدمة أو سلوك الفني')),
                        DropdownMenuItem(value: 'other', child: Text('بلاغات أخرى')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setModalState(() {
                            _selectedCategory = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Subject
                    TextFormField(
                      controller: _subjectController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'عنوان البلاغ',
                        labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 13),
                        filled: true,
                        fillColor: AppTheme.darkBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'هذا الحقل مطلوب' : null,
                    ),
                    const SizedBox(height: 16),

                    // Description
                    TextFormField(
                      controller: _descController,
                      maxLines: 4,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'تفاصيل البلاغ أو الشكوى بالتفصيل',
                        labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 13),
                        filled: true,
                        fillColor: AppTheme.darkBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'هذا الحقل مطلوب' : null,
                    ),
                    const SizedBox(height: 24),

                    // Submit button
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitComplaint,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text(
                              'إرسال البلاغ الآن',
                              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                            ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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
          'سجل البلاغات والشكاوى',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_comment_rounded),
        onPressed: _showNewComplaintBottomSheet,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
            : _error != null
                ? _buildErrorWidget()
                : _complaints.isEmpty
                    ? _buildEmptyState()
                    : _buildComplaintsList(),
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
              _error ?? 'حدث خطأ في الشبكة',
              style: const TextStyle(color: Colors.white, fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchComplaints,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.speaker_notes_off_rounded, color: AppTheme.darkTextSecondary.withValues(alpha: 0.3), size: 80),
            const SizedBox(height: 20),
            const Text(
              'سجل البلاغات فارغ',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
            const SizedBox(height: 8),
            const Text(
              'إذا واجهتك أي مشاكل بالخدمة، أو الفوترة، أو العداد، يمكنك تقديم بلاغ جديد فوراً وسنقوم بمتابعته.',
              style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12, fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showNewComplaintBottomSheet,
              icon: const Icon(Icons.campaign_rounded),
              label: const Text('تقديم بلاغ الآن', style: TextStyle(fontFamily: 'Cairo')),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ).animate().fade(),
    );
  }

  Widget _buildComplaintsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _complaints.length,
      itemBuilder: (context, index) {
        final comp = _complaints[index];
        final date = comp['created_at'] != null
            ? intl.DateFormat('yyyy/MM/dd HH:mm').format(DateTime.parse(comp['created_at']))
            : 'غير محدد';
            
        final String status = comp['status'] ?? 'open';
        final String category = comp['category'] ?? 'other';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppTheme.darkCardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildCategoryBadge(category),
                  _buildStatusBadge(status),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                comp['subject'] ?? 'بدون عنوان',
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
              ),
              const SizedBox(height: 6),
              Text(
                comp['description'] ?? '',
                style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12, height: 1.5, fontFamily: 'Cairo'),
              ),
              
              if (comp['resolution_notes'] != null && comp['resolution_notes'].toString().trim().isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: Colors.white10),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.successColor.withValues(alpha: 0.1)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.check_circle_rounded, color: AppTheme.successColor, size: 16),
                          SizedBox(width: 6),
                          Text('ملاحظات الحل والمعالجة:', style: TextStyle(color: AppTheme.successColor, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        comp['resolution_notes'],
                        style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, height: 1.4, fontFamily: 'Cairo'),
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'تاريخ التقديم: $date',
                    style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 10, fontFamily: 'Cairo'),
                  ),
                  if (comp['assigned_to_name'] != null)
                    Text(
                      'المتابع: ${comp['assigned_to_name']}',
                      style: const TextStyle(color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                    ),
                ],
              ),
            ],
          ),
        ).animate(delay: (index * 50).ms).fade(duration: 250.ms).slideY(begin: 0.05);
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = AppTheme.warningColor;
    String text = 'جديد';
    
    if (status == 'in_progress') {
      color = AppTheme.primaryColor;
      text = 'قيد المعالجة';
    } else if (status == 'resolved') {
      color = AppTheme.successColor;
      text = 'محلول';
    } else if (status == 'closed') {
      color = AppTheme.darkTextSecondary;
      text = 'مغلق';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
      ),
    );
  }

  Widget _buildCategoryBadge(String cat) {
    String text = 'بلاغات أخرى';
    IconData icon = Icons.info_outline_rounded;
    
    if (cat == 'billing') {
      text = 'اعتراض مالي';
      icon = Icons.receipt_long_rounded;
    } else if (cat == 'meter') {
      text = 'فني العداد';
      icon = Icons.shutter_speed_rounded;
    } else if (cat == 'power_cut') {
      text = 'انقطاع تيار';
      icon = Icons.power_off_rounded;
    } else if (cat == 'leakage') {
      text = 'شكوك تلاعب';
      icon = Icons.report_problem_rounded;
    } else if (cat == 'service') {
      text = 'سوء الخدمة';
      icon = Icons.support_agent_rounded;
    }
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppTheme.primaryColor, size: 14),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
        ),
      ],
    );
  }
}
