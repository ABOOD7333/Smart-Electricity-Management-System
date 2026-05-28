// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'meter_task.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetMeterTaskCollection on Isar {
  IsarCollection<MeterTask> get meterTasks => this.collection();
}

const MeterTaskSchema = CollectionSchema(
  name: r'MeterTask',
  id: 9028738997379520678,
  properties: {
    r'address': PropertySchema(
      id: 0,
      name: r'address',
      type: IsarType.string,
    ),
    r'customerName': PropertySchema(
      id: 1,
      name: r'customerName',
      type: IsarType.string,
    ),
    r'lastReadingValue': PropertySchema(
      id: 2,
      name: r'lastReadingValue',
      type: IsarType.double,
    ),
    r'latitude': PropertySchema(
      id: 3,
      name: r'latitude',
      type: IsarType.double,
    ),
    r'longitude': PropertySchema(
      id: 4,
      name: r'longitude',
      type: IsarType.double,
    ),
    r'meterId': PropertySchema(
      id: 5,
      name: r'meterId',
      type: IsarType.string,
    ),
    r'meterNumber': PropertySchema(
      id: 6,
      name: r'meterNumber',
      type: IsarType.string,
    ),
    r'zoneName': PropertySchema(
      id: 7,
      name: r'zoneName',
      type: IsarType.string,
    )
  },
  estimateSize: _meterTaskEstimateSize,
  serialize: _meterTaskSerialize,
  deserialize: _meterTaskDeserialize,
  deserializeProp: _meterTaskDeserializeProp,
  idName: r'id',
  indexes: {
    r'meterId': IndexSchema(
      id: -1596511903527871468,
      name: r'meterId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'meterId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _meterTaskGetId,
  getLinks: _meterTaskGetLinks,
  attach: _meterTaskAttach,
  version: '3.1.0+1',
);

int _meterTaskEstimateSize(
  MeterTask object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.address.length * 3;
  bytesCount += 3 + object.customerName.length * 3;
  bytesCount += 3 + object.meterId.length * 3;
  bytesCount += 3 + object.meterNumber.length * 3;
  bytesCount += 3 + object.zoneName.length * 3;
  return bytesCount;
}

void _meterTaskSerialize(
  MeterTask object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.address);
  writer.writeString(offsets[1], object.customerName);
  writer.writeDouble(offsets[2], object.lastReadingValue);
  writer.writeDouble(offsets[3], object.latitude);
  writer.writeDouble(offsets[4], object.longitude);
  writer.writeString(offsets[5], object.meterId);
  writer.writeString(offsets[6], object.meterNumber);
  writer.writeString(offsets[7], object.zoneName);
}

MeterTask _meterTaskDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = MeterTask();
  object.address = reader.readString(offsets[0]);
  object.customerName = reader.readString(offsets[1]);
  object.id = id;
  object.lastReadingValue = reader.readDouble(offsets[2]);
  object.latitude = reader.readDoubleOrNull(offsets[3]);
  object.longitude = reader.readDoubleOrNull(offsets[4]);
  object.meterId = reader.readString(offsets[5]);
  object.meterNumber = reader.readString(offsets[6]);
  object.zoneName = reader.readString(offsets[7]);
  return object;
}

P _meterTaskDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readDouble(offset)) as P;
    case 3:
      return (reader.readDoubleOrNull(offset)) as P;
    case 4:
      return (reader.readDoubleOrNull(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _meterTaskGetId(MeterTask object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _meterTaskGetLinks(MeterTask object) {
  return [];
}

void _meterTaskAttach(IsarCollection<dynamic> col, Id id, MeterTask object) {
  object.id = id;
}

extension MeterTaskByIndex on IsarCollection<MeterTask> {
  Future<MeterTask?> getByMeterId(String meterId) {
    return getByIndex(r'meterId', [meterId]);
  }

  MeterTask? getByMeterIdSync(String meterId) {
    return getByIndexSync(r'meterId', [meterId]);
  }

  Future<bool> deleteByMeterId(String meterId) {
    return deleteByIndex(r'meterId', [meterId]);
  }

  bool deleteByMeterIdSync(String meterId) {
    return deleteByIndexSync(r'meterId', [meterId]);
  }

  Future<List<MeterTask?>> getAllByMeterId(List<String> meterIdValues) {
    final values = meterIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'meterId', values);
  }

  List<MeterTask?> getAllByMeterIdSync(List<String> meterIdValues) {
    final values = meterIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'meterId', values);
  }

  Future<int> deleteAllByMeterId(List<String> meterIdValues) {
    final values = meterIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'meterId', values);
  }

  int deleteAllByMeterIdSync(List<String> meterIdValues) {
    final values = meterIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'meterId', values);
  }

  Future<Id> putByMeterId(MeterTask object) {
    return putByIndex(r'meterId', object);
  }

  Id putByMeterIdSync(MeterTask object, {bool saveLinks = true}) {
    return putByIndexSync(r'meterId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByMeterId(List<MeterTask> objects) {
    return putAllByIndex(r'meterId', objects);
  }

  List<Id> putAllByMeterIdSync(List<MeterTask> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'meterId', objects, saveLinks: saveLinks);
  }
}

extension MeterTaskQueryWhereSort
    on QueryBuilder<MeterTask, MeterTask, QWhere> {
  QueryBuilder<MeterTask, MeterTask, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension MeterTaskQueryWhere
    on QueryBuilder<MeterTask, MeterTask, QWhereClause> {
  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> idNotEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> meterIdEqualTo(
      String meterId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'meterId',
        value: [meterId],
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterWhereClause> meterIdNotEqualTo(
      String meterId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'meterId',
              lower: [],
              upper: [meterId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'meterId',
              lower: [meterId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'meterId',
              lower: [meterId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'meterId',
              lower: [],
              upper: [meterId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension MeterTaskQueryFilter
    on QueryBuilder<MeterTask, MeterTask, QFilterCondition> {
  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'address',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'address',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'address',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> addressIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'address',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      addressIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'address',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> customerNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> customerNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'customerName',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'customerName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> customerNameMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'customerName',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'customerName',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      customerNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'customerName',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      lastReadingValueEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastReadingValue',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      lastReadingValueGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastReadingValue',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      lastReadingValueLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastReadingValue',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      lastReadingValueBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastReadingValue',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> latitudeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'latitude',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      latitudeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'latitude',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> latitudeEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'latitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> latitudeGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'latitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> latitudeLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'latitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> latitudeBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'latitude',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> longitudeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'longitude',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      longitudeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'longitude',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> longitudeEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'longitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      longitudeGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'longitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> longitudeLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'longitude',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> longitudeBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'longitude',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'meterId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'meterId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'meterId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'meterId',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      meterIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'meterId',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      meterNumberGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'meterNumber',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      meterNumberStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'meterNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> meterNumberMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'meterNumber',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      meterNumberIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'meterNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      meterNumberIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'meterNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'zoneName',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'zoneName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'zoneName',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition> zoneNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'zoneName',
        value: '',
      ));
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterFilterCondition>
      zoneNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'zoneName',
        value: '',
      ));
    });
  }
}

extension MeterTaskQueryObject
    on QueryBuilder<MeterTask, MeterTask, QFilterCondition> {}

extension MeterTaskQueryLinks
    on QueryBuilder<MeterTask, MeterTask, QFilterCondition> {}

extension MeterTaskQuerySortBy on QueryBuilder<MeterTask, MeterTask, QSortBy> {
  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByCustomerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'customerName', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByCustomerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'customerName', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByLastReadingValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastReadingValue', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy>
      sortByLastReadingValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastReadingValue', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByLatitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByLongitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByMeterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterId', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByMeterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterId', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByMeterNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterNumber', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByMeterNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterNumber', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByZoneName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'zoneName', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> sortByZoneNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'zoneName', Sort.desc);
    });
  }
}

extension MeterTaskQuerySortThenBy
    on QueryBuilder<MeterTask, MeterTask, QSortThenBy> {
  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByCustomerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'customerName', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByCustomerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'customerName', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByLastReadingValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastReadingValue', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy>
      thenByLastReadingValueDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastReadingValue', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByLatitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByLongitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByMeterId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterId', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByMeterIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterId', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByMeterNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterNumber', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByMeterNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'meterNumber', Sort.desc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByZoneName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'zoneName', Sort.asc);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QAfterSortBy> thenByZoneNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'zoneName', Sort.desc);
    });
  }
}

extension MeterTaskQueryWhereDistinct
    on QueryBuilder<MeterTask, MeterTask, QDistinct> {
  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByAddress(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'address', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByCustomerName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'customerName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByLastReadingValue() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastReadingValue');
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'latitude');
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'longitude');
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByMeterId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'meterId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByMeterNumber(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'meterNumber', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<MeterTask, MeterTask, QDistinct> distinctByZoneName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'zoneName', caseSensitive: caseSensitive);
    });
  }
}

extension MeterTaskQueryProperty
    on QueryBuilder<MeterTask, MeterTask, QQueryProperty> {
  QueryBuilder<MeterTask, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<MeterTask, String, QQueryOperations> addressProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'address');
    });
  }

  QueryBuilder<MeterTask, String, QQueryOperations> customerNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'customerName');
    });
  }

  QueryBuilder<MeterTask, double, QQueryOperations> lastReadingValueProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastReadingValue');
    });
  }

  QueryBuilder<MeterTask, double?, QQueryOperations> latitudeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'latitude');
    });
  }

  QueryBuilder<MeterTask, double?, QQueryOperations> longitudeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'longitude');
    });
  }

  QueryBuilder<MeterTask, String, QQueryOperations> meterIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'meterId');
    });
  }

  QueryBuilder<MeterTask, String, QQueryOperations> meterNumberProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'meterNumber');
    });
  }

  QueryBuilder<MeterTask, String, QQueryOperations> zoneNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'zoneName');
    });
  }
}
