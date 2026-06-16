import 'package:isar/isar.dart';

part 'meter_task.g.dart';

@Name("MeterTaskData")
@collection
class MeterTask {
  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true, name: "meter_id_index")
  late String meterId;
  
  late String meterNumber;
  late String customerName;
  late String zoneName;
  late double lastReadingValue;
  late double? latitude;
  late double? longitude;
  late String address;
}
