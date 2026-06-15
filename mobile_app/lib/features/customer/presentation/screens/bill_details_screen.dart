import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' as intl;
import 'package:dio/dio.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';

class BillDetailsScreen extends ConsumerStatefulWidget {
  final String billId;

  const BillDetailsScreen({
    super.key,
    required this.billId,
  });

  @override
  ConsumerState<BillDetailsScreen> createState() => _BillDetailsScreenState();
}

class _BillDetailsScreenState extends ConsumerState<BillDetailsScreen> {
  Map<String, dynamic>? _bill;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchBillDetails();
  }

  Future<void> _fetchBillDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/bills/${widget.billId}');
      
      if (response.statusCode == 200) {
        setState(() {
          _bill = response.data['data'];
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
          'تفاصيل الفاتورة',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
        actions: [
          if (_bill != null)
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              onPressed: _fetchBillDetails,
            ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
            : _error != null
                ? _buildErrorWidget()
                : _bill == null
                    ? const Center(child: Text('لم يتم العثور على الفاتورة', style: TextStyle(color: Colors.white, fontFamily: 'Cairo')))
                    : _buildInvoiceBody(),
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
              style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchBillDetails,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceBody() {
    final bill = _bill!;
    final isPaid = bill['status'] == 'paid';
    final totalAmount = double.parse(bill['total_amount'].toString());
    final amountPaid = double.parse(bill['amount_paid'].toString());
    final balanceDue = totalAmount - amountPaid;
    
    final issueDate = bill['issue_date'] != null
        ? intl.DateFormat('yyyy/MM/dd').format(DateTime.parse(bill['issue_date']))
        : 'غير محدد';
    final dueDate = bill['due_date'] != null
        ? intl.DateFormat('yyyy/MM/dd').format(DateTime.parse(bill['due_date']))
        : 'غير محدد';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Status Banner
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            decoration: BoxDecoration(
              color: isPaid ? AppTheme.successColor.withValues(alpha: 0.1) : AppTheme.dangerColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isPaid ? AppTheme.successColor : AppTheme.dangerColor,
                width: 1.5,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'حالة الفاتورة: ${isPaid ? "مدفوعة ومسددة" : "غير مسددة"}',
                      style: TextStyle(
                        color: isPaid ? AppTheme.successColor : AppTheme.dangerColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isPaid ? 'نشكرك على سدادك في الوقت المحدد' : 'يرجى المسارعة بالسداد لتجنب فصل الخدمة',
                      style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                    ),
                  ],
                ),
                Icon(
                  isPaid ? Icons.verified_rounded : Icons.pending_actions_rounded,
                  color: isPaid ? AppTheme.successColor : AppTheme.dangerColor,
                  size: 32,
                ),
              ],
            ),
          ).animate().fade().slideY(begin: -0.1),

          const SizedBox(height: 24),

          // Main Invoice Sheet
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.darkCardBg,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header (Invoice Number)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SEMS - فاتورة كهرباء',
                          style: TextStyle(color: AppTheme.primaryColor, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'رقم الفاتورة: ${bill['invoice_number']}',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Icon(Icons.bolt_rounded, color: AppTheme.accentColor, size: 36),
                  ],
                ),
                
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: Colors.white10),
                ),

                // Customer & Meter info
                _buildInfoRow('اسم المشترك', bill['full_name'] ?? 'غير محدد'),
                _buildInfoRow('رقم المشترك', (bill['customer_number'] ?? '—').toString()),
                _buildInfoRow('رقم العداد', bill['meter_number'] ?? '—'),
                _buildInfoRow('تاريخ الإصدار', issueDate),
                _buildInfoRow('تاريخ الاستحقاق', dueDate),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: Colors.white10),
                ),

                // Consumption Info
                const Text(
                  'تفاصيل الاستهلاك',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildConsumptionBox('القراءة السابقة', (bill['previous_reading'] ?? 0).toString(), 'ك.و.س'),
                    _buildConsumptionBox('القراءة الحالية', (bill['current_reading'] ?? 0).toString(), 'ك.و.س'),
                    _buildConsumptionBox('الاستهلاك الفعلي', (bill['consumption_kwh'] ?? 0).toString(), 'ك.و.س', isHighlight: true),
                  ],
                ),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: Colors.white10),
                ),

                // Fees Breakdown
                const Text(
                  'التكلفة والرسوم المضافة',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 12),
                _buildPriceRow('قيمة الاستهلاك الفعلي', double.parse((bill['consumption_value'] ?? 0).toString())),
                _buildPriceRow('رسوم خدمات الصيانة والشبكة', double.parse((bill['services_fees'] ?? 0).toString())),
                _buildPriceRow('متأخرات مستحقة سابقة', double.parse((bill['arrears'] ?? 0).toString())),
                if (double.parse((bill['discount'] ?? 0).toString()) > 0)
                  _buildPriceRow('الخصم الممنوح', -double.parse((bill['discount'] ?? 0).toString()), isDiscount: true),

                const Divider(color: Colors.white10, height: 24),

                // Total Summary
                _buildPriceRow('المبلغ الإجمالي المستحق', totalAmount, isTotal: true),
                _buildPriceRow('المبلغ المسدد', amountPaid, isPaidText: true),
                _buildPriceRow('الرصيد المتبقي المطلوب', balanceDue, isHighlight: true, isTotal: true),
                
                if (bill['amount_in_words'] != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    'فقط وقدره: ${bill['amount_in_words']}',
                    style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo', fontStyle: FontStyle.italic),
                  ),
                ]
              ],
            ),
          ).animate().fade(delay: 100.ms).slideY(begin: 0.05),

          const SizedBox(height: 24),

          // Pay Button if unpaid
          if (!isPaid)
            ElevatedButton(
              onPressed: () {
                context.go('/customer/payment', extra: {
                  'bill_id': bill['bill_id'],
                  'amount': balanceDue,
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
                shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.payment_rounded),
                  SizedBox(width: 12),
                  Text(
                    'سداد الفاتورة الآن',
                    style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ],
              ),
            ).animate().fade(delay: 200.ms),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 13, fontFamily: 'Cairo')),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildConsumptionBox(String label, String value, String unit, {bool isHighlight = false}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isHighlight ? AppTheme.primaryColor.withValues(alpha: 0.1) : AppTheme.darkBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isHighlight ? AppTheme.primaryColor : Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(color: isHighlight ? AppTheme.primaryColor : AppTheme.darkTextSecondary, fontSize: 10, fontFamily: 'Cairo')),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              fontFamily: isHighlight ? 'Cairo' : null,
            ),
          ),
          Text(unit, style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 9, fontFamily: 'Cairo')),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isTotal = false, bool isHighlight = false, bool isDiscount = false, bool isPaidText = false}) {
    Color textColor = Colors.white;
    double fontSize = 13;
    FontWeight fontWeight = FontWeight.normal;

    if (isHighlight) {
      textColor = AppTheme.primaryColor;
      fontWeight = FontWeight.bold;
      fontSize = 15;
    } else if (isTotal) {
      fontWeight = FontWeight.bold;
      fontSize = 14;
    } else if (isDiscount) {
      textColor = AppTheme.successColor;
    } else if (isPaidText) {
      textColor = AppTheme.darkTextSecondary;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isHighlight ? textColor : (isTotal ? Colors.white70 : AppTheme.darkTextSecondary),
              fontSize: fontSize,
              fontWeight: fontWeight,
              fontFamily: 'Cairo',
            ),
          ),
          Text(
            '${amount.toStringAsFixed(2)} ر.ي',
            style: TextStyle(
              color: textColor,
              fontSize: fontSize,
              fontWeight: isTotal || isHighlight ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
