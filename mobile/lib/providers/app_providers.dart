import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../core/storage/token_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/course_service.dart';
import '../services/social_service.dart';
import '../services/friend_service.dart';
import '../services/teacher_service.dart';

// Core providers
final tokenStorageProvider = Provider((ref) => TokenStorage());
final apiClientProvider = Provider((ref) => ApiClient(ref.read(tokenStorageProvider)));
final socketServiceProvider = Provider((ref) => SocketService(ref.read(tokenStorageProvider)));

// Service providers
final authServiceProvider = Provider((ref) => AuthRepository(ref.read(apiClientProvider), ref.read(tokenStorageProvider)));
final courseServiceProvider = Provider((ref) => CourseService(ref.read(apiClientProvider)));
final socialServiceProvider = Provider((ref) => SocialService(ref.read(apiClientProvider)));
final friendServiceProvider = Provider((ref) => FriendService(ref.read(apiClientProvider)));
final messageServiceProvider = Provider((ref) => MessageService(ref.read(apiClientProvider)));
final notificationServiceProvider = Provider((ref) => NotificationService(ref.read(apiClientProvider)));
final teacherServiceProvider = Provider((ref) => TeacherService(ref.read(apiClientProvider)));

// Auth state
class AuthState {
  final AppUser? user;
  final bool loading;
  final String? error;

  const AuthState({this.user, this.loading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({AppUser? user, bool? loading, String? error, bool clearError = false}) {
    return AuthState(
      user: user ?? this.user,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._auth, this._socket) : super(const AuthState(loading: true)) {
    _init();
  }

  final AuthRepository _auth;
  final SocketService _socket;

  Future<void> _init() async {
    final user = await _auth.restoreSession();
    if (user != null && user.id != 0) await _socket.connect();
    state = AuthState(user: user, loading: false);
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final user = await _auth.login(email, password);
      await _socket.connect();
      state = AuthState(user: user, loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<bool> requestRegisterOtp({
    required String email,
    required String password,
    required String username,
    String? department,
    String? firstName,
    String? lastName,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await _auth.requestRegisterOtp(
        email: email,
        password: password,
        username: username,
        department: department,
        firstName: firstName,
        lastName: lastName,
      );
      state = state.copyWith(loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<bool> verifyRegisterOtp(String email, String otp) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final user = await _auth.verifyRegisterOtp(email: email, otp: otp);
      await _socket.connect();
      state = AuthState(user: user, loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<bool> requestPasswordReset(String email) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await _auth.requestPasswordResetOtp(email);
      state = state.copyWith(loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String password,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await _auth.resetPassword(email: email, otp: otp, password: password);
      state = state.copyWith(loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<bool> registerTeacher({
    required String username,
    required String email,
    required String password,
    required String teacherId,
    required String specialization,
    required String qualification,
    String? bio,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final user = await _auth.registerTeacher(
        username: username,
        email: email,
        password: password,
        teacherId: teacherId,
        specialization: specialization,
        qualification: qualification,
        bio: bio,
      );
      if (user.id != 0) await _socket.connect();
      state = AuthState(user: user, loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: _message(e));
      return false;
    }
  }

  Future<void> logout() async {
    _socket.disconnect();
    await _auth.logout();
    state = const AuthState(loading: false);
  }

  String _message(Object e) {
    if (e is Exception && e.toString().startsWith('Exception: ')) {
      return e.toString().replaceFirst('Exception: ', '');
    }
    return e.toString();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider), ref.read(socketServiceProvider));
});

// Theme
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.dark);

// Notification badge
final unreadNotificationsProvider = StateProvider<int>((ref) => 0);
