import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import 'landing_screen.dart';
import 'login_screen.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import 'reset_password_screen.dart';
import 'teacher_registration_screen.dart';
import '../shell/main_shell.dart';
import '../courses/course_detail_screen.dart';
import '../courses/course_analytics_screen.dart';
import '../courses/my_courses_screen.dart';
import '../courses/course_management_screen.dart';
import '../courses/courses_screen.dart';
import '../../core/widgets/gradient_background.dart';
import '../notifications/notifications_screen.dart';
import '../social/create_post_screen.dart';
import '../social/social_feed_screen.dart';
import '../chat/chat_screen.dart';
import '../friends/friends_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../settings/settings_screen.dart';
import '../teacher/create_course_screen.dart';
import '../teacher/edit_course_screen.dart';
import '../teacher/teacher_course_detail_screen.dart';
import '../teacher/manage_videos_screen.dart';
import '../teacher/teacher_analytics_screen.dart';
import '../teacher/teacher_students_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isAuth = auth.isAuthenticated;
      final isLoading = auth.loading;

      const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/teacher-register',
        '/splash',
      ];

      if (isLoading) return loc == '/splash' ? null : '/splash';
      if (!isAuth && !publicRoutes.contains(loc)) return '/';
      if (isAuth && publicRoutes.contains(loc)) {
        return auth.user?.isTeacher == true ? '/teacher' : '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _SplashView()),
      GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(
          initialEmail: state.extra as String?,
        ),
      ),
      GoRoute(path: '/teacher-register', builder: (_, __) => const TeacherRegistrationScreen()),

      // Student shell tabs: 0 Home, 1 Courses, 2 Chat, 3 Profile
      GoRoute(path: '/home', builder: (_, __) => const MainShell(tab: 0)),
      GoRoute(path: '/social', builder: (_, __) => const _SocialPage()),
      GoRoute(path: '/courses', builder: (_, __) => const MainShell(tab: 1)),
      GoRoute(path: '/chat', builder: (_, __) => const MainShell(tab: 2)),
      GoRoute(path: '/profile', builder: (_, __) => const MainShell(tab: 3)),

      // Teacher shell
      GoRoute(path: '/teacher', builder: (_, __) => const MainShell(tab: 0, isTeacher: true)),

      // Feature routes
      GoRoute(path: '/my-courses', builder: (_, __) => const MyCoursesScreen()),
      GoRoute(path: '/friends', builder: (_, __) => const FriendsScreen()),
      GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/create', builder: (_, __) => const CreatePostScreen()),
      GoRoute(path: '/feed', builder: (_, __) => const SocialFeedScreen()),
      GoRoute(path: '/course-management', builder: (_, __) => const CourseManagementScreen()),
      GoRoute(
        path: '/course/:id',
        builder: (_, state) => CourseDetailScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/course/:id/analytics',
        builder: (_, state) => CourseAnalyticsScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/chat/:userId',
        builder: (_, state) => ChatScreen(
          userId: int.parse(state.pathParameters['userId']!),
        ),
      ),

      // Teacher routes
      GoRoute(path: '/teacher/create-course', builder: (_, __) => const CreateCourseScreen()),
      GoRoute(path: '/teacher/analytics', builder: (_, __) => const TeacherAnalyticsScreen()),
      GoRoute(
        path: '/teacher/course/:id',
        builder: (_, state) => TeacherCourseDetailScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/teacher/course/:id/edit',
        builder: (_, state) => EditCourseScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/teacher/course/:id/videos',
        builder: (_, state) => ManageVideosScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/teacher/course/:id/students',
        builder: (_, state) => TeacherStudentsScreen(
          courseId: int.parse(state.pathParameters['id']!),
        ),
      ),
    ],
  );
});

class _SplashView extends StatelessWidget {
  const _SplashView();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.hub_outlined, size: 64, color: Color(0xFF00E5FF)),
            SizedBox(height: 16),
            CircularProgressIndicator(color: Color(0xFF00E5FF)),
          ],
        ),
      ),
    );
  }
}

class _CatalogPage extends StatelessWidget {
  const _CatalogPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(child: const CoursesScreen()),
      ),
    );
  }
}

class _SocialPage extends StatelessWidget {
  const _SocialPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(child: const SocialFeedScreen()),
      ),
    );
  }
}
