import 'dart:io';
import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/database/isar_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/meter_task.dart';
import '../models/offline_reading.dart';

final technicianRepositoryProvider = Provider<TechnicianRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final isar = ref.watch(isarProvider);
  return TechnicianRepository(dio, isar);
});

class TechnicianRepository {
  final Dio _dio;
  final Isar _isar;

  TechnicianRepository(this._dio, this._isar);

  // Check if network is connected
  Future<bool> _isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return !connectivityResult.contains(ConnectivityResult.none);
  }

  // Fetch assigned tasks (from API if online, else from local cache)
  Future<List<MeterTask>> getAssignedTasks() async {
    final online = await _isOnline();

    if (online) {
      try {
        final response = await _dio.get(ApiConstants.assignedMeters);
        if (response.statusCode == 200) {
          final List<dynamic> data = response.data;
          final List<MeterTask> tasks = data.map((json) {
            final task = MeterTask()
              ..meterId = json['meter_id'] ?? ''
              ..meterNumber = json['meter_number'] ?? ''
              ..customerName = json['customer_name'] ?? json['customer']?['name'] ?? 'مشترك غير معروف'
              ..zoneName = json['zone_name'] ?? json['zone']?['name'] ?? 'منطقة غير محددة'
              ..lastReadingValue = (json['last_reading_value'] ?? 0.0).toDouble()
              ..latitude = json['latitude'] != null ? (json['latitude'] as num).toDouble() : null
              ..longitude = json['longitude'] != null ? (json['longitude'] as num).toDouble() : null
              ..address = json['address'] ?? json['customer']?['address'] ?? 'بدون عنوان';
            return task;
          }).toList();

          // Update local cache
          await _isar.writeTxn(() async {
            // Clear old tasks
            await _isar.meterTasks.clear();
            // Store new tasks
            await _isar.meterTasks.putAll(tasks);
          });

          return tasks;
        }
      } catch (e) {
        // Fallback to local cache on error
      }
    }

    // Return from local cache
    return await _isar.meterTasks.where().findAll();
  }

  // Submit meter reading (Uploads directly if online, saves offline if offline)
  Future<Map<String, dynamic>> submitReading({
    required String meterId,
    required double readingValue,
    required double latitude,
    required double longitude,
    required String? imagePath,
  }) async {
    final online = await _isOnline();

    if (online) {
      try {
        final Map<String, dynamic> formDataMap = {
          'meter_id': meterId,
          'reading_value': readingValue.toString(),
          'latitude': latitude.toString(),
          'longitude': longitude.toString(),
          'reading_date': DateTime.now().toIso8601String(),
        };

        if (imagePath != null && await File(imagePath).exists()) {
          formDataMap['reading_image'] = await MultipartFile.fromFile(
            imagePath,
            filename: 'meter_${meterId}_${DateTime.now().millisecondsSinceEpoch}.jpg',
          );
        }

        final formData = FormData.fromMap(formDataMap);

        final response = await _dio.post(
          ApiConstants.submitReading,
          data: formData,
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          return {
            'success': true,
            'isOffline': false,
            'data': response.data,
          };
        }
      } on DioException catch (e) {
        final failure = e.toFailure();
        return {
          'success': false,
          'isOffline': false,
          'error': failure.message,
        };
      } catch (e) {
        return {
          'success': false,
          'isOffline': false,
          'error': 'حدث خطأ أثناء التواصل مع السيرفر',
        };
      }
    }

    // Save offline
    try {
      final offlineReading = OfflineReading()
        ..meterId = meterId
        ..readingValue = readingValue
        ..latitude = latitude
        ..longitude = longitude
        ..readingDate = DateTime.now()
        ..imagePath = imagePath
        ..isSynced = false;

      await _isar.writeTxn(() async {
        await _isar.offlineReadings.put(offlineReading);
      });

      return {
        'success': true,
        'isOffline': true,
      };
    } catch (e) {
      return {
        'success': false,
        'isOffline': true,
        'error': 'فشل حفظ القراءة محلياً في قاعدة البيانات',
      };
    }
  }

  // Get pending offline readings
  Future<List<OfflineReading>> getPendingReadings() async {
    return await _isar.offlineReadings.filter().isSyncedEqualTo(false).findAll();
  }

  // Trigger Offline Synchronization
  Future<Map<String, dynamic>> syncOfflineReadings() async {
    final pending = await getPendingReadings();
    if (pending.isEmpty) {
      return {'success': true, 'syncedCount': 0};
    }

    final online = await _isOnline();
    if (!online) {
      return {'success': false, 'error': 'لا يوجد اتصال بالإنترنت لإجراء المزامنة'};
    }

    int syncedCount = 0;
    int failedCount = 0;

    for (final reading in pending) {
      try {
        final Map<String, dynamic> formDataMap = {
          'meter_id': reading.meterId,
          'reading_value': reading.readingValue.toString(),
          'latitude': reading.latitude.toString(),
          'longitude': reading.longitude.toString(),
          'reading_date': reading.readingDate.toIso8601String(),
        };

        if (reading.imagePath != null && await File(reading.imagePath!).exists()) {
          formDataMap['reading_image'] = await MultipartFile.fromFile(
            reading.imagePath!,
            filename: 'meter_${reading.meterId}_${reading.readingDate.millisecondsSinceEpoch}.jpg',
          );
        }

        final formData = FormData.fromMap(formDataMap);

        final response = await _dio.post(
          ApiConstants.submitReading,
          data: formData,
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          // Mark as synced or delete from database
          await _isar.writeTxn(() async {
            await _isar.offlineReadings.delete(reading.id);
          });
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (e) {
        failedCount++;
        // Update error text in local DB
        await _isar.writeTxn(() async {
          reading.syncError = e.toString();
          await _isar.offlineReadings.put(reading);
        });
      }
    }

    return {
      'success': failedCount == 0,
      'syncedCount': syncedCount,
      'failedCount': failedCount,
    };
  }
}
