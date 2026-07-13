import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/gradient_background.dart';
import '../../models/social_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';
import '../../shared/widgets/shimmer_loader.dart';

class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key});

  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen> {
  List<FriendModel> _friends = [];
  bool _loading = true;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final friends = await ref.read(friendServiceProvider).getFriends();
      if (mounted) setState(() { _friends = friends; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<FriendModel> get _filtered {
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return _friends;
    return _friends.where((f) => f.username.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CampusScreenTitle('Messages'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: CampusSearchBar(
            hint: 'Search people',
            controller: _search,
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(height: 14),
        Expanded(
          child: _loading
              ? const ShimmerList()
              : _filtered.isEmpty
                  ? Center(
                      child: Text(
                        'Add friends to start chatting',
                        style: TextStyle(color: AppColors.textMute, fontSize: 12),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: _filtered.length,
                      itemBuilder: (_, i) {
                        final f = _filtered[i];
                        final online = i == 0;
                        final unread = i == 1 ? 2 : 0;
                        return GestureDetector(
                          onTap: () => context.push('/chat/${f.id}'),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                            child: Row(
                              children: [
                                Stack(
                                  children: [
                                    _GradientAvatar(name: f.username, url: f.avatar, online: online),
                                    if (online)
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          width: 11,
                                          height: 11,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: AppColors.g2a,
                                            border: Border.all(color: AppColors.deepSpace, width: 2),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(f.username, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                      Text(
                                        online ? 'typing…' : 'Tap to open chat',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: online ? AppColors.g1a : AppColors.textMute,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                if (unread > 0)
                                  Container(
                                    width: 16,
                                    height: 16,
                                    alignment: Alignment.center,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: AppColors.gradientPrimary,
                                    ),
                                    child: Text(
                                      '$unread',
                                      style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.onGradient),
                                    ),
                                  )
                                else
                                  Text(
                                    i == 0 ? 'now' : '${i}d',
                                    style: const TextStyle(fontSize: 9, color: AppColors.textMute),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}

class _GradientAvatar extends StatelessWidget {
  const _GradientAvatar({required this.name, this.url, this.online = false});
  final String name;
  final String? url;
  final bool online;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return AvatarImage(url: url, name: name, size: 44);
    }
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: online ? AppColors.gradientPrimary : null,
        color: online ? null : const Color(0xFF2A3040),
      ),
      child: Center(
        child: Text(
          name.length >= 2 ? name.substring(0, 2).toUpperCase() : name[0].toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: online ? AppColors.onGradient : AppColors.textDim,
          ),
        ),
      ),
    );
  }
}
