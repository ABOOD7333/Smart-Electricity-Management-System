import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:isar/isar.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/database/isar_service.dart';
import '../controllers/technician_controller.dart';
import '../../data/repositories/technician_repository.dart';
import '../../data/models/meter_task.dart';

class MeterReadingScreen extends ConsumerStatefulWidget {
  final String meterId;
  final String customerName;

  const MeterReadingScreen({
    super.key,
    required this.meterId,
    required this.customerName,
  });

  @override
  ConsumerState<MeterReadingScreen> createState() => _MeterReadingScreenState();
}

class _MeterReadingScreenState extends ConsumerState<MeterReadingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _readingController = TextEditingController();
  
  MeterTask? _meterTask;
  bool _isLoadingMeter = true;

  // GPS State
  double? _latitude;
  double? _longitude;
  bool _isLocating = false;

  // Image State
  String? _capturedImagePath;

  @override
  void initState() {
    super.initState();
    _loadMeterDetails();
    _captureLocation();
  }

  @override
  void dispose() {
    _readingController.dispose();
    super.dispose();
  }

  Future<void> _loadMeterDetails() async {
    try {
      final isar = ref.read(isarProvider);
      if (isar != null) {
        final task = await isar.meterTasks.filter().meterIdEqualTo(widget.meterId).findFirst();
        setState(() {
          _meterTask = task;
          _isLoadingMeter = false;
        });
      } else {
        setState(() {
          _isLoadingMeter = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingMeter = false;
      });
    }
  }

  Future<void> _captureLocation() async {
    setState(() {
      _isLocating = true;
    });

    try {
      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 5),
        );
        setState(() {
          _latitude = position.latitude;
          _longitude = position.longitude;
          _isLocating = false;
        });
      } else {
        // Mock fallback if denied
        _setMockLocation();
      }
    } catch (e) {
      // Mock fallback if service disabled or timeout
      _setMockLocation();
    }
  }

  void _setMockLocation() {
    setState(() {
      // Default center of Sana'a, Yemen
      _latitude = 15.3694;
      _longitude = 44.1910;
      _isLocating = false;
    });
  }

  void _simulateCameraCapture() {
    setState(() {
      // We simulate a local file path
      _capturedImagePath = '/mock/path/meter_${widget.meterId}.jpg';
    });
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_capturedImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('الرجاء التقاط صورة للعداد أولاً للتحقق من صحة القراءة', style: TextStyle(fontFamily: 'Cairo')),
          backgroundColor: AppTheme.dangerColor,
        ),
      );
      return;
    }

    ref.read(readingSubmissionProvider.notifier).state = true;

    final repo = ref.read(technicianRepositoryProvider);
    final readingVal = double.parse(_readingController.text.trim());

    final response = await repo.submitReading(
      meterId: widget.meterId,
      readingValue: readingVal,
      latitude: _latitude ?? 15.3694,
      longitude: _longitude ?? 44.1910,
      imagePath: _capturedImagePath,
    );

    ref.read(readingSubmissionProvider.notifier).state = false;

    if (response['success'] == true) {
      final isOffline = response['isOffline'] as bool;
      if (mounted) {
        if (isOffline) {
          // Saved offline
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(AppStrings.readingSavedOffline, style: TextStyle(fontFamily: 'Cairo')),
              backgroundColor: AppTheme.warningColor,
            ),
          );
          // Reload tasks
          ref.read(assignedTasksProvider.notifier).loadTasks();
          context.go('/technician');
        } else {
          // Synced online, check if backend calculated bill details
          final data = response['data'];
          _showInvoiceDialog(data);
        }
      }
    } else {
      if (mounted) {
        final error = response['error'] ?? 'حدث خطأ غير متوقع أثناء الحفظ';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error, style: const TextStyle(fontFamily: 'Cairo')),
            backgroundColor: AppTheme.dangerColor,
          ),
        );
      }
    }
  }

  void _showInvoiceDialog(dynamic responseData) {
    // Show invoice details returned from backend
    final bill = responseData?['bill'] ?? responseData?['data']?['bill'];
    final consumption = responseData?['consumption'] ?? responseData?['data']?['consumption'] ?? 0.0;
    
    final billNo = bill?['bill_number'] ?? 'غير محدد';
    final totalAmount = bill?['total_amount'] ?? 0.0;
    final tariffRate = bill?['tariff_rate'] ?? 0.0;
    final previousArrears = bill?['previous_arrears'] ?? 0.0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.darkCardBg,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppTheme.successColor,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            const Text(
              'تفاصيل الفاتورة المحسوبة',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _invoiceRow('رقم الفاتورة:', billNo),
            _invoiceRow('الاستهلاك:', '$consumption ${AppStrings.kwhSuffix}'),
            _invoiceRow('سعر الكيلو:', '$tariffRate ${AppStrings.riyalSuffix}'),
            _invoiceRow('مستحقات سابقة:', '$previousArrears ${AppStrings.riyalSuffix}'),
            const Divider(color: Colors.white10),
            _invoiceRow('المبلغ الإجمالي:', '$totalAmount ${AppStrings.riyalSuffix}', isBold: true, valueColor: AppTheme.accentColor),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Reload tasks list
              ref.read(assignedTasksProvider.notifier).loadTasks();
              context.go('/technician');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('حسناً', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  Widget _invoiceRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontFamily: 'Cairo', color: AppTheme.darkTextSecondary, fontSize: 13)),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Cairo',
              color: valueColor ?? Colors.white,
              fontSize: isBold ? 15 : 13,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(readingSubmissionProvider);

    if (_isLoadingMeter) {
      return const Scaffold(
        backgroundColor: AppTheme.darkBg,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
      );
    }

    if (_meterTask == null) {
      return Scaffold(
        backgroundColor: AppTheme.darkBg,
        appBar: AppBar(title: const Text('تسجيل قراءة')),
        body: const Center(
          child: Text('عذراً، لم يتم العثور على تفاصيل العداد محلياً', style: TextStyle(fontFamily: 'Cairo', color: Colors.white)),
        ),
      );
    }

    final prevReading = _meterTask!.lastReadingValue;

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text(
          AppStrings.submitReadingTitle,
          style: TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => context.go('/technician'),
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
                // Meter Task Detail Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.darkCardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.customerName,
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${AppStrings.activeMeter} ${_meterTask!.meterNumber}',
                        style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 12, fontFamily: 'Cairo'),
                      ),
                      Text(
                        '${AppStrings.lastReading} $prevReading ${AppStrings.kwhSuffix}',
                        style: const TextStyle(color: AppTheme.accentColor, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Location GPS Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: _latitude != null ? AppTheme.successColor.withValues(alpha: 0.1) : AppTheme.warningColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _latitude != null ? AppTheme.successColor.withValues(alpha: 0.3) : AppTheme.warningColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _latitude != null ? Icons.gps_fixed_rounded : Icons.gps_off_rounded,
                        color: _latitude != null ? AppTheme.successColor : AppTheme.warningColor,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _latitude != null ? AppStrings.gpsCaptured : AppStrings.locationRequired,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _latitude != null ? AppTheme.successColor : AppTheme.warningColor,
                              ),
                            ),
                            if (_latitude != null)
                              Text(
                                'خط العرض: ${_latitude!.toStringAsFixed(5)} | خط الطول: ${_longitude!.toStringAsFixed(5)}',
                                style: const TextStyle(color: Colors.white70, fontSize: 10),
                              ),
                          ],
                        ),
                      ),
                      if (_isLocating)
                        const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryColor),
                        )
                      else if (_latitude == null)
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded, color: AppTheme.warningColor),
                          onPressed: _captureLocation,
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Current Reading Input
                TextFormField(
                  controller: _readingController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: AppStrings.currentReadingField,
                    labelStyle: const TextStyle(color: AppTheme.darkTextSecondary, fontFamily: 'Cairo'),
                    filled: true,
                    fillColor: AppTheme.darkCardBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'الرجاء إدخال قيمة القراءة';
                    }
                    final currentVal = double.tryParse(value.trim());
                    if (currentVal == null) {
                      return 'الرجاء إدخال رقم صحيح';
                    }
                    if (currentVal < prevReading) {
                      return AppStrings.validationReadingLess;
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Image Capture Placeholder
                GestureDetector(
                  onTap: _simulateCameraCapture,
                  child: Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: AppTheme.darkCardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _capturedImagePath != null ? AppTheme.successColor : Colors.white.withValues(alpha: 0.1),
                        width: 1.5,
                      ),
                    ),
                    child: _capturedImagePath != null
                        ? Stack(
                            children: [
                              // Interactive Mock Photo Display
                              ClipRRect(
                                borderRadius: BorderRadius.circular(15),
                                child: Container(
                                  width: double.infinity,
                                  color: const Color(0xFF1B3244),
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.image_search_rounded, size: 48, color: AppTheme.primaryColor),
                                        const SizedBox(height: 8),
                                        const Text(
                                          '[صورة عداد افتراضية للتحقق]',
                                          style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 13),
                                        ),
                                        Text(
                                          'اسم الملف: meter_${widget.meterId}.jpg',
                                          style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.successColor,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'تم الإلتقاط',
                                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 11),
                                  ),
                                ),
                              ),
                            ],
                          )
                        : const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_rounded, size: 40, color: AppTheme.primaryColor),
                              SizedBox(height: 12),
                              Text(
                                AppStrings.captureImage,
                                style: TextStyle(fontFamily: 'Cairo', color: AppTheme.darkTextSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 48),

                // Submit Button
                ElevatedButton(
                  onPressed: isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 6,
                    shadowColor: AppTheme.primaryColor.withValues(alpha: 0.3),
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          AppStrings.readingSubmitButton,
                          style: TextStyle(fontFamily: 'Cairo', fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
