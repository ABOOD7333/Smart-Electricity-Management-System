import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../data/models/user_model.dart';
import '../../data/models/company_model.dart';

// State class for Authentication
class AuthState {
  final bool isLoading;
  final UserModel? user;
  final String? errorMessage;
  final bool isAuthenticated;

  AuthState({
    this.isLoading = false,
    this.user,
    this.errorMessage,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    bool? isLoading,
    UserModel? user,
    String? errorMessage,
    bool? isAuthenticated,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      errorMessage: errorMessage,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// StateNotifier for Auth
class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;
  final Ref _ref;

  AuthNotifier(this._dio, this._ref) : super(AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    final storage = _ref.read(secureStorageProvider);
    final token = await storage.read(key: 'jwt_token');
    
    if (token != null) {
      final userId = await storage.read(key: 'user_id') ?? '';
      final username = await storage.read(key: 'user_name') ?? '';
      final role = await storage.read(key: 'user_role') ?? '';
      final status = await storage.read(key: 'user_status') ?? 'active';

      state = AuthState(
        isAuthenticated: true,
        user: UserModel(
          userId: userId,
          username: username,
          role: role,
          status: status,
        ),
      );
    } else {
      state = AuthState(isAuthenticated: false);
    }
  }

  Future<bool> login(String username, String password, {String? companyCode}) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'username': username,
          'password': password,
        },
        options: Options(
          headers: {
            if (companyCode != null) 'X-Company-Code': companyCode,
          },
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final token = data['token'];
        final userMap = data['user'];
        final user = UserModel.fromJson(userMap);

        // Store in Secure Storage
        final storage = _ref.read(secureStorageProvider);
        await storage.write(key: 'jwt_token', value: token);
        await storage.write(key: 'user_id', value: user.userId);
        await storage.write(key: 'user_name', value: user.username);
        await storage.write(key: 'user_role', value: user.role);
        await storage.write(key: 'user_status', value: user.status);
        if (user.zoneId != null) {
          await storage.write(key: 'user_zone_id', value: user.zoneId);
        }

        state = AuthState(
          isAuthenticated: true,
          user: user,
        );
        return true;
      } else {
        state = AuthState(errorMessage: 'فشل تسجيل الدخول: رمز خطأ غير معروف');
        return false;
      }
    } on DioException catch (e) {
      final failure = e.toFailure();
      state = AuthState(errorMessage: failure.message);
      return false;
    } catch (e) {
      state = AuthState(errorMessage: 'حدث خطأ أثناء الاتصال بالخادم');
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    final storage = _ref.read(secureStorageProvider);
    await storage.delete(key: 'jwt_token');
    await storage.delete(key: 'user_id');
    await storage.delete(key: 'user_name');
    await storage.delete(key: 'user_role');
    await storage.delete(key: 'user_status');
    await storage.delete(key: 'user_zone_id');
    
    state = AuthState(isAuthenticated: false);
  }
}

// Auth State Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final dio = ref.watch(dioProvider);
  return AuthNotifier(dio, ref);
});

// Providers for fetching all electricity companies
final companiesProvider = FutureProvider<List<CompanyModel>>((ref) async {
  final dio = ref.watch(dioProvider);
  try {
    final response = await dio.get(ApiConstants.companies);
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => CompanyModel.fromJson(json)).toList();
    }
    return [];
  } catch (e) {
    // Fallback default list if API fails
    return [
      CompanyModel(companyId: 'bpower-uuid', companyName: 'شركة الطاقة الرئيسية B.POWER', companyCode: 'BPOWER'),
      CompanyModel(companyId: 'noor-uuid', companyName: 'شركة نور الكهربائية', companyCode: 'NOOR'),
      CompanyModel(companyId: 'aman-uuid', companyName: 'شركة أمان للطاقة', companyCode: 'AMAN'),
    ];
  }
});
