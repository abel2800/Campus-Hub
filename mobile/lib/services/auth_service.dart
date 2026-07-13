import 'dart:convert';
import '../core/constants/mock_flags.dart';
import '../core/network/api_client.dart';
import '../core/storage/token_storage.dart';
import '../../models/user_model.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final TokenStorage _storage;

  Future<AppUser> login(String email, String password) async {
    final res = await _api.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return _handleAuthResponse(res.data);
  }

  Future<void> requestRegisterOtp({
    required String email,
    required String password,
    required String username,
    String? department,
    String? firstName,
    String? lastName,
  }) async {
    await _api.post('/auth/register/request', data: {
      'email': email,
      'password': password,
      'username': username,
      if (department != null && department.isNotEmpty) 'department': department,
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
    });
  }

  Future<AppUser> verifyRegisterOtp({
    required String email,
    required String otp,
    bool autoLogin = true,
  }) async {
    final res = await _api.post('/auth/register/verify', data: {
      'email': email,
      'otp': otp,
    });
    final user = await _handleAuthResponse(res.data);
    await _storage.setAutoLogin(autoLogin);
    return user;
  }

  Future<void> requestPasswordResetOtp(String email) async {
    await _api.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String password,
  }) async {
    await _api.post('/auth/reset-password', data: {
      'email': email,
      'otp': otp,
      'password': password,
    });
  }

  Future<AppUser> registerTeacher({
    required String username,
    required String email,
    required String password,
    required String teacherId,
    required String specialization,
    required String qualification,
    String? bio,
  }) async {
    if (MockFlags.teacherRegister) {
      await Future.delayed(const Duration(milliseconds: 600));
      final mockUser = AppUser(
        id: 0,
        username: username,
        email: email,
        role: 'teacher',
        bio: bio,
      );
      await _storage.saveToken('mock-teacher-token');
      await _storage.saveUserJson(jsonEncode(mockUser.toJson()));
      return mockUser;
    }

    final res = await _api.post('/auth/register', data: {
      'username': username,
      'email': email,
      'password': password,
      'isTeacher': true,
      'teacherId': teacherId,
      'specialization': specialization,
      'qualification': qualification,
      if (bio != null) 'bio': bio,
    });
    return _handleAuthResponse(res.data);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<AppUser?> restoreSession() async {
    final autoLogin = await _storage.getAutoLogin();
    if (!autoLogin) return null;

    final token = await _storage.getToken();
    final userJson = await _storage.getUserJson();
    if (token == null || userJson == null) return null;

    if (token == 'mock-teacher-token') {
      return AppUser.fromJson(
        jsonDecode(userJson) as Map<String, dynamic>,
      );
    }

    try {
      final res = await _api.get('/auth/me');
      return AppUser.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      await _storage.clear();
      return null;
    }
  }

  Future<void> logout() => _storage.clear();

  Future<AppUser> _handleAuthResponse(dynamic data) async {
    final map = data as Map<String, dynamic>;
    final token = map['token'] as String?;
    if (token == null) throw Exception('No token received');

    final userMap = map['user'] as Map<String, dynamic>? ?? map;
    final user = AppUser.fromJson(userMap);

    await _storage.saveToken(token);
    await _storage.saveUserJson(jsonEncode(user.toJson()));
    await _storage.setAutoLogin(true);
    return user;
  }
}
