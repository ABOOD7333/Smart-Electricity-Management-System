import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../controllers/customer_controller.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final String? billId;
  final double? initialAmount;

  const PaymentScreen({
    super.key,
    this.billId,
    this.initialAmount,
  });

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _cardNameController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardExpiryController = TextEditingController();
  final _cardCvvController = TextEditingController();
  
  String _selectedMethod = 'visa'; // visa, kuraimi, wallet
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialAmount != null) {
      _amountController.text = widget.initialAmount!.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _cardNameController.dispose();
    _cardNumberController.dispose();
    _cardExpiryController.dispose();
    _cardCvvController.dispose();
    super.dispose();
  }

  Future<void> _processPayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final dio = ref.read(dioProvider);
      
      // إذا لم يكن هناك معرف فاتورة محدد، نمرر 'all' أو نسحب أقدم فاتورة غير مدفوعة
      final targetId = widget.billId ?? 'all';
      
      final response = await dio.post(
        '/bills/$targetId/pay',
        data: {
          'amount_paid': double.parse(_amountController.text),
          'payment_method': _selectedMethod == 'visa' ? 'online' : (_selectedMethod == 'kuraimi' ? 'kuraimi_bank' : 'electronic_wallet'),
          'reference_number': 'MOB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
          'notes': 'دفع إلكتروني عبر تطبيق الجوال - بطاقة ${_cardNameController.text}',
        },
      );

      if (response.statusCode == 200) {
        // تحديث حالة لوحة التحكم للمشترك
        ref.read(customerProvider.notifier).loadDashboard();
        
        if (mounted) {
          _showSuccessDialog();
        }
      }
    } on DioException catch (e) {
      final failure = e.toFailure();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(failure.message, style: const TextStyle(fontFamily: 'Cairo')),
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

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          backgroundColor: AppTheme.darkCardBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_outline_rounded,
                    color: AppTheme.successColor,
                    size: 64,
                  ),
                ).animate().scale(duration: 400.ms, curve: Curves.bounceOut),
                const SizedBox(height: 24),
                const Text(
                  'تمت العملية بنجاح!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'تم سداد مبلغ ${_amountController.text} ر.ي بنجاح وتحديث حسابك المالي.',
                  style: const TextStyle(
                    color: AppTheme.darkTextSecondary,
                    fontSize: 13,
                    fontFamily: 'Cairo',
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close dialog
                    context.go('/customer'); // Back to dashboard
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    'العودة للرئيسية',
                    style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
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
          'الدفع الإلكتروني الآمن',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Interactive Card Preview
                if (_selectedMethod == 'visa')
                  _buildCreditCardPreview()
                      .animate()
                      .fade(duration: 350.ms)
                      .slideY(begin: -0.05),
                const SizedBox(height: 24),

                // Method Selectors
                Row(
                  children: [
                    _buildMethodButton('visa', 'بطاقة فيزا/ماستر', Icons.credit_card_rounded),
                    const SizedBox(width: 8),
                    _buildMethodButton('kuraimi', 'الكريمي', Icons.account_balance_rounded),
                    const SizedBox(width: 8),
                    _buildMethodButton('wallet', 'محفظة جوال', Icons.account_balance_wallet_rounded),
                  ],
                ).animate().fade(delay: 100.ms),
                const SizedBox(height: 24),

                // Amount Field
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'مبلغ السداد (ر.ي)',
                    labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                    filled: true,
                    fillColor: AppTheme.darkCardBg,
                    prefixIcon: const Icon(Icons.payments_rounded, color: AppTheme.primaryColor),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: AppTheme.primaryColor),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'يرجى إدخال المبلغ';
                    final val = double.tryParse(value);
                    if (val == null || val <= 0) return 'الرجاء إدخال مبلغ صحيح';
                    return null;
                  },
                  onChanged: (val) => setState(() {}),
                ).animate().fade(delay: 150.ms),
                const SizedBox(height: 16),

                // Visa specific inputs
                if (_selectedMethod == 'visa') ...[
                  // Card Number
                  TextFormField(
                    controller: _cardNumberController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(16),
                      _CardNumberFormatter(),
                    ],
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('رقم البطاقة', Icons.credit_card_rounded),
                    validator: (val) => val == null || val.length < 19 ? 'رقم بطاقة غير صالح' : null,
                    onChanged: (val) => setState(() {}),
                  ).animate().fade(delay: 200.ms),
                  const SizedBox(height: 16),

                  // Cardholder Name
                  TextFormField(
                    controller: _cardNameController,
                    keyboardType: TextInputType.name,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('اسم حامل البطاقة', Icons.person_rounded),
                    validator: (val) => val == null || val.isEmpty ? 'اسم الحامل مطلوب' : null,
                    onChanged: (val) => setState(() {}),
                  ).animate().fade(delay: 250.ms),
                  const SizedBox(height: 16),

                  // Expiry and CVV Row
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _cardExpiryController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(4),
                            _CardExpiryFormatter(),
                          ],
                          style: const TextStyle(color: Colors.white),
                          decoration: _buildInputDecoration('تاريخ الانتهاء (MM/YY)', Icons.calendar_today_rounded),
                          validator: (val) => val == null || val.length < 5 ? 'غير صالح' : null,
                          onChanged: (val) => setState(() {}),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _cardCvvController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(3),
                          ],
                          style: const TextStyle(color: Colors.white),
                          decoration: _buildInputDecoration('رمز الأمان (CVV)', Icons.lock_outline_rounded),
                          validator: (val) => val == null || val.length < 3 ? 'غير صالح' : null,
                          onChanged: (val) => setState(() {}),
                        ),
                      ),
                    ],
                  ).animate().fade(delay: 300.ms),
                ] else if (_selectedMethod == 'kuraimi') ...[
                  // الكريمي بنك
                  _buildInfoBox('لسداد الفاتورة عبر حسابك في بنك الكريمي، يرجى تزويدنا برقم حسابك لتوليد طلب الخصم المباشر عبر بوابة إم الكريمي.').animate().fade(),
                  const SizedBox(height: 16),
                  TextFormField(
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('رقم حساب الكريمي', Icons.account_balance_rounded),
                    validator: (val) => val == null || val.isEmpty ? 'الحقل مطلوب' : null,
                  ).animate().fade(),
                ] else ...[
                  // محفظة جوال
                  _buildInfoBox('سيتم إرسال طلب دفع إلى محفظة الجوال الخاصة بك (فلوسك، جوالي، أو كاش). يرجى إدخال رقم الهاتف المرتبط بالمحفظة.').animate().fade(),
                  const SizedBox(height: 16),
                  TextFormField(
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: Colors.white),
                    decoration: _buildInputDecoration('رقم الهاتف المرتبط بالمحفظة', Icons.phone_android_rounded),
                    validator: (val) => val == null || val.isEmpty ? 'رقم الهاتف مطلوب' : null,
                  ).animate().fade(),
                ],

                const SizedBox(height: 32),

                // Submit Button
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _processPayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 8,
                    shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : const Text(
                          'تأكيد وإجراء الدفع الآمن',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ).animate().fade(delay: 350.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMethodButton(String method, String label, IconData icon) {
    final isSelected = _selectedMethod == method;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedMethod = method),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor.withValues(alpha: 0.15) : AppTheme.darkCardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : Colors.white.withValues(alpha: 0.05),
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? AppTheme.primaryColor : AppTheme.darkTextSecondary, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppTheme.darkTextSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCreditCardPreview() {
    final cardNumber = _cardNumberController.text.isEmpty ? '•••• •••• •••• ••••' : _cardNumberController.text;
    final cardName = _cardNameController.text.isEmpty ? 'اسم حامل البطاقة' : _cardNameController.text;
    final cardExpiry = _cardExpiryController.text.isEmpty ? 'MM/YY' : _cardExpiryController.text;

    return Container(
      height: 200,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'الرصيد المراد شحنه/سداده',
                style: TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'Cairo'),
              ),
              Icon(Icons.payment_rounded, color: AppTheme.accentColor.withValues(alpha: 0.8), size: 28),
            ],
          ),
          Text(
            '${_amountController.text.isEmpty ? '0.00' : _amountController.text} ر.ي',
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 12),
          Text(
            cardNumber,
            style: const TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 2, fontWeight: FontWeight.w600),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                cardName.toUpperCase(),
                style: const TextStyle(color: Colors.white70, fontSize: 12, overflow: TextOverflow.ellipsis),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('الانتهاء', style: TextStyle(color: Colors.white38, fontSize: 8, fontFamily: 'Cairo')),
                  Text(cardExpiry, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBox(String text) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: AppTheme.primaryColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12, height: 1.5, fontFamily: 'Cairo'),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _buildInputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo', fontSize: 13),
      filled: true,
      fillColor: AppTheme.darkCardBg,
      prefixIcon: Icon(icon, color: AppTheme.darkTextSecondary, size: 20),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.primaryColor),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.dangerColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.dangerColor),
      ),
      errorStyle: const TextStyle(fontFamily: 'Cairo', fontSize: 11),
    );
  }
}

// Format credit card number with spaces every 4 digits
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text;
    if (newValue.selection.baseOffset == 0) return newValue;
    
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      int nonSpaceLength = i + 1;
      if (nonSpaceLength % 4 == 0 && nonSpaceLength != text.length) {
        buffer.write(' ');
      }
    }
    
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

// Format expiry date with slash (MM/YY)
class _CardExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text;
    if (newValue.selection.baseOffset == 0) return newValue;
    
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      if (i == 1 && text.length > 2) {
        buffer.write('/');
      }
    }
    
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
