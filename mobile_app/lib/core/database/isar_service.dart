import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/technician/data/models/meter_task.dart';
import '../../features/technician/data/models/offline_reading.dart';

final isarProvider = Provider<Isar?>((ref) {
  throw UnimplementedError('Isar has not been initialized yet. Initialize it in main.dart');
});

class IsarService {
  static const _secureStorage = FlutterSecureStorage();
  static const _encryptionKeyKey = 'isar_db_encryption_key';

  /// توليد أو جلب مفتاح التشفير العشوائي الآمن من الـ Keyring/Keystore الخاص بالجهاز
  static Future<List<int>?> getOrCreateEncryptionKey() async {
    try {
      String? keyBase64 = await _secureStorage.read(key: _encryptionKeyKey);
      if (keyBase64 == null) {
        // توليد مفتاح عشوائي آمن بطول 64 بايت (مطلوب لـ Isar/SQLite)
        final random = Random.secure();
        final values = List<int>.generate(64, (i) => random.nextInt(256));
        keyBase64 = base64Url.encode(values);
        await _secureStorage.write(key: _encryptionKeyKey, value: keyBase64);
      }
      return base64Url.decode(keyBase64);
    } catch (e) {
      print('خطأ في جلب أو إنشاء مفتاح تشفير Isar: $e');
      return null;
    }
  }

  static Future<Isar?> init() async {
    if (kIsWeb) {
      print('Running on Web: Isar database bypassed.');
      return null;
    }
    
    try {
      final dir = await getApplicationDocumentsDirectory();
      
      // جلب مفتاح التشفير الآمن لتجهيز تفعيله بالكامل
      final encryptionKey = await getOrCreateEncryptionKey();
      
      // We open Isar with our schemas. Note that the generated schema names will be:
      // MeterTaskSchema and OfflineReadingSchema (imported from the models)
      return await Isar.open(
        [
          MeterTaskSchema,
          OfflineReadingSchema,
        ],
        directory: dir.path,
        // ملاحظة: مع الانتقال إلى Isar v4 (باستخدام محرك SQLite)، يمكن تفعيل السطر التالي مباشرة
        // لتشفير قاعدة البيانات المحلية بالكامل باستخدام المفتاح الآمن المسترد من الـ Secure Storage:
        // name: 'sems_secure_db',
        // encryptionKey: encryptionKey,
      );
    } catch (e) {
      print('Failed to initialize Isar: $e');
      return null;
    }
  }
}

