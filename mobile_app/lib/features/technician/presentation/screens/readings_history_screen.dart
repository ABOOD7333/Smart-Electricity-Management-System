import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/theme/app_theme.dart';
import '../controllers/technician_controller.dart';

class ReadingsHistoryScreen extends ConsumerStatefulWidget {
  const ReadingsHistoryScreen({super.key});

  @override
  ConsumerState<ReadingsHistoryScreen> createState() => _ReadingsHistoryScreenState();
}

class _ReadingsHistoryScreenState extends ConsumerState<ReadingsHistoryScreen> {
  String _selectedStatusFilter = 'all'; // all, pending, approved

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(readingsHistoryProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'سجل القراءات المرفوعة',
          style: TextStyle(
            color: Colors.white,
            fontFamily: 'Cairo',
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status Filters Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  _buildFilterChip('الكل', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('المعتمدة', 'approved'),
                  const SizedBox(width: 8),
                  _buildFilterChip('قيد المراجعة', 'pending'),
                ],
              ),
            ),

            // History List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => ref.refresh(readingsHistoryProvider.future),
                color: AppTheme.primaryColor,
                backgroundColor: AppTheme.darkCardBg,
                child: historyAsync.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryColor),
                  ),
                  error: (error, stack) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: AppTheme.dangerColor, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          'خطأ أثناء تحميل السجل:\n${error.toString()}',
                          style: const TextStyle(color: Colors.white70, fontFamily: 'Cairo', fontSize: 14),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => ref.refresh(readingsHistoryProvider.future),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                          ),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo')),
                        )
                      ],
                    ),
                  ),
                  data: (readings) {
                    final filteredReadings = readings.where((r) {
                      if (_selectedStatusFilter == 'all') return true;
                      return r['status'] == _selectedStatusFilter;
                    }).toList();

                    if (filteredReadings.isEmpty) {
                      return const Center(
                        child: Text(
                          'لا توجد قراءات في السجل حالياً',
                          style: TextStyle(
                            color: AppTheme.darkTextSecondary,
                            fontFamily: 'Cairo',
                            fontSize: 14,
                          ),
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: filteredReadings.length,
                      itemBuilder: (context, index) {
                        final reading = filteredReadings[index];
                        return _buildHistoryCard(context, reading, index);
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedStatusFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedStatusFilter = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor : AppTheme.darkCardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : Colors.white.withValues(alpha: 0.05),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : AppTheme.darkTextSecondary,
              fontFamily: 'Cairo',
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, Map<String, dynamic> reading, int index) {
    final rawDate = reading['reading_date'] != null
        ? DateTime.parse(reading['reading_date'].toString())
        : DateTime.now();
    final formattedDate = intl.DateFormat('yyyy/MM/dd - hh:mm a').format(rawDate);

    final status = reading['status'] ?? 'pending';
    final isApproved = status == 'approved';

    final baseUrl = 'https://smart-electricity-management-system-production.up.railway.app';
    final imageUrl = reading['reading_image_url'] != null
        ? '$baseUrl${reading['reading_image_url']}'
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
              Expanded(
                child: Text(
                  reading['customer_name'] ?? 'مشترك غير معروف',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isApproved
                      ? AppTheme.successColor.withValues(alpha: 0.1)
                      : AppTheme.warningColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isApproved ? 'معتمدة' : 'قيد المراجعة',
                  style: TextStyle(
                    color: isApproved ? AppTheme.successColor : AppTheme.warningColor,
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'العداد',
                    style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                  ),
                  Text(
                    reading['meter_number'] ?? '-',
                    style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'القراءة الحالية',
                    style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                  ),
                  Text(
                    '${reading['current_reading']} كيلوواط',
                    style: const TextStyle(color: AppTheme.accentColor, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'الاستهلاك',
                    style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                  ),
                  Text(
                    '${reading['consumption']} كيلوواط/ساعة',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                ],
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                formattedDate,
                style: const TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11),
              ),
              if (imageUrl != null)
                IconButton(
                  icon: const Icon(Icons.image_search_rounded, color: AppTheme.primaryColor),
                  onPressed: () => _showMeterPhoto(context, imageUrl),
                )
            ],
          ),
          if (reading['notes'] != null && reading['notes'].toString().trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'ملاحظات: ${reading['notes']}',
                style: const TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'Cairo'),
              ),
            )
          ]
        ],
      ),
    ).animate(delay: (index * 50).ms).fade(duration: 300.ms).slideY(begin: 0.05);
  }

  void _showMeterPhoto(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: AppTheme.darkCardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('صورة العداد المرفقة', style: TextStyle(color: Colors.white, fontFamily: 'Cairo', fontSize: 14)),
              centerTitle: true,
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            ClipRRect(
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
              child: Image.network(
                imageUrl,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(color: AppTheme.primaryColor),
                  );
                },
                errorBuilder: (context, error, stackTrace) => const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Column(
                    children: [
                      Icon(Icons.broken_image_rounded, color: AppTheme.dangerColor, size: 48),
                      SizedBox(height: 8),
                      Text('فشل تحميل الصورة', style: TextStyle(color: Colors.white70, fontFamily: 'Cairo', fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
