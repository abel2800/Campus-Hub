import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/floating_nav_bar.dart';
import '../../core/widgets/gradient_background.dart';
import '../../providers/app_providers.dart';
import '../home/home_screen.dart';
import '../courses/courses_screen.dart';
import '../chat/chat_list_screen.dart';
import '../profile/profile_screen.dart';
import '../teacher/teacher_home_screen.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.tab, this.isTeacher = false});

  final int tab;
  final bool isTeacher;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.tab.clamp(0, 3);
  }

  void _onNavTap(int i) => setState(() => _index = i);

  void _openDrawerRoute(String route) {
    Navigator.pop(context);
    context.push(route);
  }

  @override
  Widget build(BuildContext context) {
    final isTeacher = widget.isTeacher || ref.watch(authProvider).user?.isTeacher == true;
    final unread = ref.watch(unreadNotificationsProvider);

    final pages = isTeacher
        ? [
            const TeacherHomeScreen(),
            const CoursesScreen(teacherMode: true),
            const ChatListScreen(),
            const ProfileScreen(),
          ]
        : [
            const HomeScreen(),
            const CoursesScreen(),
            const ChatListScreen(),
            const ProfileScreen(),
          ];

    return Scaffold(
      extendBody: true,
      drawer: _CampusDrawer(
        isTeacher: isTeacher,
        unread: unread,
        onNavigate: _openDrawerRoute,
      ),
      body: Stack(
        children: [
          GradientBackground(child: pages[_index]),
        ],
      ),
      bottomNavigationBar: FloatingNavBar(
        currentIndex: _index,
        onTap: _onNavTap,
      ),
    );
  }
}

class _CampusDrawer extends StatelessWidget {
  const _CampusDrawer({
    required this.isTeacher,
    required this.unread,
    required this.onNavigate,
  });

  final bool isTeacher;
  final int unread;
  final void Function(String route) onNavigate;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.deepSpace.withValues(alpha: 0.98),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: ShaderMask(
                shaderCallback: (b) => AppColors.gradientPrimary.createShader(b),
                child: const Text(
                  'Campus Hub',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ),
            ),
            _DrawerTile(icon: Icons.dashboard_outlined, label: 'Dashboard', onTap: () => onNavigate('/dashboard')),
            _DrawerTile(icon: Icons.dynamic_feed_outlined, label: 'Social feed', onTap: () => onNavigate('/social')),
            _DrawerTile(icon: Icons.add_circle_outline, label: 'Create post', onTap: () => onNavigate('/create')),
            _DrawerTile(icon: Icons.school_outlined, label: 'My Courses', onTap: () => onNavigate('/my-courses')),
            _DrawerTile(icon: Icons.people_outline, label: 'Friends', onTap: () => onNavigate('/friends')),
            _DrawerTile(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              badge: unread > 0 ? '$unread' : null,
              onTap: () => onNavigate('/notifications'),
            ),
            _DrawerTile(icon: Icons.settings_outlined, label: 'Settings', onTap: () => onNavigate('/settings')),
            if (isTeacher) ...[
              const Divider(color: AppColors.glassBorder, height: 24),
              _DrawerTile(icon: Icons.add_circle_outline, label: 'Create course', onTap: () => onNavigate('/teacher/create-course')),
              _DrawerTile(icon: Icons.analytics_outlined, label: 'Analytics', onTap: () => onNavigate('/teacher/analytics')),
            ],
          ],
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(9),
          color: AppColors.g1a.withValues(alpha: 0.12),
        ),
        child: Icon(icon, color: AppColors.g1a, size: 15),
      ),
      title: Text(label, style: const TextStyle(fontSize: 12)),
      trailing: badge != null
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(badge!, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.onGradient)),
            )
          : const Icon(Icons.chevron_right, color: AppColors.textMute, size: 14),
      onTap: onTap,
    );
  }
}
