import 'package:isar/isar.dart';

part 'offline_reading.g.dart';

@Name("OfflineReadingData")
@collection
class OfflineReading {
  Id id = Isar.autoIncrement;

  late String meterId;
  late double readingValue;
  late double latitude;
  late double longitude;
  late DateTime readingDate;
  late String? imagePath;
  late bool isSynced;
  late String? syncError;
}
