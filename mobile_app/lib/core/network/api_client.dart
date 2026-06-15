import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_constants.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  final storage = ref.watch(secureStorageProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // Handle token expiry or specific global errors here if necessary
        return handler.next(e);
      },
    ),
  );

  return dio;
});

class ApiFailure implements Exception {
  final String message;
  final int? statusCode;

  ApiFailure(this.message, {this.statusCode});

  @override
  String toString() => message;
}

extension DioExceptionExt on DioException {
  ApiFailure toFailure() {
    String message = 'حدث خطأ غير متوقع في الشبكة';
    if (response != null) {
      if (response?.data != null && response?.data is Map) {
        message = response?.data['message'] ?? response?.data['error'] ?? message;
      } else {
        message = 'خطأ من الخادم (رمز ${response?.statusCode})';
      }
      return ApiFailure(message, statusCode: response?.statusCode);
    }
    
    switch (type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'انتهت مهلة الاتصال بالخادم. يرجى التحقق من الشبكة';
        break;
      case DioExceptionType.connectionError:
        message = 'تعذر الاتصال بالخادم. تأكد من أن السيرفر يعمل';
        break;
      default:
        message = 'حدث خطأ أثناء الاتصال بالخادم';
    }
    return ApiFailure(message);
  }
}
