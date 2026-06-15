import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/theme/app_theme.dart';
import '../../data/models/offline_reading.dart';
import '../controllers/technician_controller.dart';

class OfflineListScreen extends ConsumerStatefulWidget {
  const OfflineListScreen({super.key});

  @override
  ConsumerState<OfflineListScreen> createState() => _OfflineListScreenState();
}

class _OfflineListScreenState extends ConsumerState<OfflineListScreen> {
  @override
  Widget build(BuildContext context) {
    final offlineAsync = ref.watch(offlineReadingsProvider);
    final syncState = ref.watch(syncProvider);

    // Listen to syncState transitions to trigger reload on success
    ref.listen<SyncState>(syncProvider, (previous, next) {
      if (previous?.isSyncing == true && next.isSyncing == false) {
        // Refresh the queue list
        ref.invalidate(offlineReadingsProvider);
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'قراءات الانتظار (بدون إنترنت)',
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
            // Sync status header banner
            if (syncState.isSyncing)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                color: AppTheme.primaryColor.withValues(alpha: 0.15),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(color: AppTheme.primaryColor, strokeWidth: 2),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'جاري مزامنة القراءات مع السيرفر...',
                      style: TextStyle(color: AppTheme.primaryColor, fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              ),

            // Queue List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async => ref.refresh(offlineReadingsProvider.future),
                color: AppTheme.primaryColor,
                backgroundColor: AppTheme.darkCardBg,
                child: offlineAsync.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryColor),
                  ),
                  error: (error, stack) => Center(
                    child: Text(
                      'خطأ في جلب القراءات المحلية: $error',
                      style: const TextStyle(color: Colors.white70, fontFamily: 'Cairo'),
                    ),
                  ),
                  data: (readings) {
                    if (readings.isEmpty) {
                      return ListView(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                          const Icon(Icons.cloud_done_rounded, color: AppTheme.successColor, size: 72),
                          const SizedBox(height: 16),
                          const Text(
                            'كل القراءات متزامنة بنجاح!',
                            style: TextStyle(
                              color: Colors.white,
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'لا توجد قراءات معلقة في قاعدة البيانات المحلية.',
                            style: TextStyle(
                              color: AppTheme.darkTextSecondary,
                              fontFamily: 'Cairo',
                              fontSize: 12,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      );
                    }

                    return Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'إجمالي القراءات المعلقة: ${readings.length}',
                                style: const TextStyle(color: Colors.white70, fontFamily: 'Cairo', fontSize: 13),
                              ),
                              const Icon(Icons.wifi_off_rounded, color: AppTheme.warningColor, size: 20),
                            ],
                          ),
                        ),
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: readings.length,
                            itemBuilder: (context, index) {
                              final reading = readings[index];
                              return _buildOfflineReadingCard(context, reading, index);
                            },
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: SizedBox(
                            width: double.infinity,
                            height: 50,
                            child: ElevatedButton.icon(
                              onPressed: syncState.isSyncing
                                  ? null
                                  : () => ref.read(syncProvider.notifier).sync(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                elevation: 4,
                              ),
                              icon: const Icon(Icons.cloud_upload_rounded),
                              label: Text(
                                syncState.isSyncing ? 'جاري المزامنة الآن...' : 'مزامنة القراءات الآن',
                                style: const TextStyle(fontFamily: 'Cairo', fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ],
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

  Widget _buildOfflineReadingCard(BuildContext context, OfflineReading reading, int index) {
    final formattedDate = intl.DateFormat('yyyy/MM/dd - hh:mm a').format(reading.readingDate);
    final hasError = reading.syncError != null && reading.syncError!.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.darkCardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasError ? AppTheme.dangerColor.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'رقم العداد: ${reading.meterId}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
              if (hasError)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.dangerColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'فشلت المزامنة',
                    style: TextStyle(
                      color: AppTheme.dangerColor,
                      fontSize: 10,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'القراءة المسجلة',
                    style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                  ),
                  Text(
                    '${reading.readingValue} كيلوواط',
                    style: const TextStyle(color: AppTheme.accentColor, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'تاريخ الحفظ محلياً',
                    style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11, fontFamily: 'Cairo'),
                  ),
                  Text(
                    formattedDate,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
              if (reading.imagePath != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(reading.imagePath!),
                    width: 40,
                    height: 40,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.broken_image_rounded,
                      color: AppTheme.darkTextSecondary,
                      size: 24,
                    ),
                  ),
                ),
            ],
          ),
          if (hasError) ...[
            const Divider(color: Colors.white10, height: 20),
            Container(
              padding: const EdgeInsets.all(8),
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTheme.dangerColor.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'السبب: ${reading.syncError}',
                style: const TextStyle(color: AppTheme.dangerColor, fontSize: 10, fontFamily: 'Cairo'),
              ),
            ),
          ],
        ],
      ),
    ).animate(delay: (index * 50).ms).fade(duration: 300.ms).slideY(begin: 0.05);
  }
}
