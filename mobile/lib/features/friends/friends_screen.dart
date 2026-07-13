import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/social_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/shimmer_loader.dart';

class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key});

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _search = TextEditingController();
  List<FriendModel> _friends = [];
  List<FriendRequestModel> _requests = [];
  List<FriendModel> _searchResults = [];
  bool _loading = true;
  bool _searching = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(friendServiceProvider);
      final friends = await svc.getFriends();
      final requests = await svc.getPendingRequests();
      if (mounted) {
        setState(() {
          _friends = friends;
          _requests = requests;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _searchUsers() async {
    final q = _search.text.trim();
    if (q.length < 2) return;
    setState(() => _searching = true);
    try {
      final results = await ref.read(friendServiceProvider).searchUsers(q);
      if (mounted) setState(() { _searchResults = results; _searching = false; });
    } catch (_) {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const SectionHeader(title: 'Friends', subtitle: 'Network'),
          TabBar(
            controller: _tabs,
            indicatorColor: AppColors.electricCyan,
            labelColor: AppColors.electricCyan,
            unselectedLabelColor: Colors.white54,
            tabs: [
              Tab(text: 'Friends (${_friends.length})'),
              Tab(text: 'Requests (${_requests.length})'),
              const Tab(text: 'Find'),
            ],
          ),
          Expanded(
            child: _loading
                ? const ShimmerList()
                : TabBarView(
                    controller: _tabs,
                    children: [
                      _FriendsList(
                        friends: _friends,
                        onRemove: (id) async {
                          await ref.read(friendServiceProvider).removeFriend(id);
                          _load();
                        },
                        onChat: (id) => context.push('/chat/$id'),
                      ),
                      _RequestsList(
                        requests: _requests,
                        onAccept: (id) async {
                          await ref.read(friendServiceProvider).acceptRequest(id);
                          _load();
                        },
                        onReject: (id) async {
                          await ref.read(friendServiceProvider).rejectRequest(id);
                          _load();
                        },
                      ),
                      _FindFriendsTab(
                        controller: _search,
                        searching: _searching,
                        results: _searchResults,
                        onSearch: _searchUsers,
                        onAdd: (id) async {
                          await ref.read(friendServiceProvider).sendRequest(id);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Friend request sent')),
                            );
                          }
                        },
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _FriendsList extends StatelessWidget {
  const _FriendsList({required this.friends, required this.onRemove, required this.onChat});
  final List<FriendModel> friends;
  final ValueChanged<int> onRemove;
  final ValueChanged<int> onChat;

  @override
  Widget build(BuildContext context) {
    if (friends.isEmpty) {
      return const Center(child: Text('No friends yet'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: friends.length,
      itemBuilder: (_, i) {
        final f = friends[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundImage: f.avatar != null ? NetworkImage(ApiConfig.mediaUrl(f.avatar)) : null,
                  child: f.avatar == null ? Text(f.username[0].toUpperCase()) : null,
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(f.username, style: const TextStyle(fontWeight: FontWeight.w600))),
                IconButton(onPressed: () => onChat(f.id), icon: const Icon(Icons.chat_bubble_outline)),
                IconButton(onPressed: () => onRemove(f.id), icon: const Icon(Icons.person_remove_outlined)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _RequestsList extends StatelessWidget {
  const _RequestsList({required this.requests, required this.onAccept, required this.onReject});
  final List<FriendRequestModel> requests;
  final ValueChanged<int> onAccept;
  final ValueChanged<int> onReject;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) return const Center(child: Text('No pending requests'));
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: requests.length,
      itemBuilder: (_, i) {
        final r = requests[i];
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(child: Text(r.sender.username, style: const TextStyle(fontWeight: FontWeight.w600))),
                TextButton(onPressed: () => onAccept(r.id), child: const Text('Accept')),
                TextButton(onPressed: () => onReject(r.id), child: const Text('Reject')),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _FindFriendsTab extends StatelessWidget {
  const _FindFriendsTab({
    required this.controller,
    required this.searching,
    required this.results,
    required this.onSearch,
    required this.onAdd,
  });

  final TextEditingController controller;
  final bool searching;
  final List<FriendModel> results;
  final VoidCallback onSearch;
  final ValueChanged<int> onAdd;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: 'Search by username...',
              suffixIcon: IconButton(
                onPressed: onSearch,
                icon: searching
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.search),
              ),
            ),
            onSubmitted: (_) => onSearch(),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: results.length,
            itemBuilder: (_, i) {
              final u = results[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(child: Text(u.username)),
                      IconButton(onPressed: () => onAdd(u.id), icon: const Icon(Icons.person_add_alt_1)),
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
