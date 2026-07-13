import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/avatar_image.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/post_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';
import '../../shared/widgets/like_burst.dart';
import '../../shared/widgets/shimmer_loader.dart';
import '../../shared/widgets/story_avatar_ring.dart';

class SocialFeedScreen extends ConsumerStatefulWidget {
  const SocialFeedScreen({super.key, this.compact = false});
  final bool compact;

  @override
  ConsumerState<SocialFeedScreen> createState() => _SocialFeedScreenState();
}

class _SocialFeedScreenState extends ConsumerState<SocialFeedScreen> {
  List<PostModel> _posts = [];
  List<StoryModel> _stories = [];
  bool _loading = true;
  int? _burstPostId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final social = ref.read(socialServiceProvider);
      final posts = await social.getFeed();
      List<StoryModel> stories = [];
      try { stories = await social.getStories(); } catch (_) {}
      if (mounted) setState(() { _posts = posts; _stories = stories; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _like(PostModel post) async {
    try {
      final social = ref.read(socialServiceProvider);
      if (post.liked) {
        await social.unlikePost(post.id);
      } else {
        await social.likePost(post.id);
      }
      _load();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    if (_loading) return const ShimmerList();

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.g1a,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 100),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          CampusScreenTitle(
            'Feed',
            trailing: IconButton(
              onPressed: () => context.push('/create'),
              icon: const Icon(Icons.send_outlined, size: 18, color: AppColors.textDim),
            ),
          ),
          SizedBox(
            height: 108,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _AddStoryBubble(onTap: () => context.push('/create')),
                const SizedBox(width: 12),
                ..._stories.map((s) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: StoryAvatarRing(
                        name: s.user?.username ?? '',
                        avatarUrl: s.user?.avatar,
                        size: 52,
                        seen: false,
                      ),
                    )),
                if (_stories.isEmpty)
                  ...['Sara', 'Dawit', 'Hana'].map((n) => Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: StoryAvatarRing(name: n, size: 52, seen: n == 'Hana'),
                      )),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: GestureDetector(
              onTap: () => context.push('/create'),
              child: GlassCard(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    AvatarImage(url: user?.avatar, name: user?.username, size: 24),
                    const SizedBox(width: 8),
                    Text("What's on your mind?", style: AppTypography.body(context, size: 11).copyWith(color: AppColors.textMute)),
                  ],
                ),
              ),
            ),
          ),
          if (_posts.isEmpty)
            _DemoPost(
              onLike: () {},
              onComment: () {},
            )
          else
            ..._posts.map((p) => _PostCard(
                  post: p,
                  showBurst: _burstPostId == p.id,
                  onBurstDone: () => setState(() => _burstPostId = null),
                  onLike: () => _like(p),
                  onDoubleTap: () {
                    if (!p.liked) {
                      setState(() => _burstPostId = p.id);
                      _like(p);
                    }
                  },
                  onComment: () {},
                )),
        ],
      ),
    );
  }
}

class _AddStoryBubble extends StatelessWidget {
  const _AddStoryBubble({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.glassFill,
              border: Border.all(color: AppColors.glassBorder, width: 1.5, style: BorderStyle.solid),
            ),
            child: const Icon(Icons.add, size: 16, color: AppColors.g1a),
          ),
          const SizedBox(height: 5),
          const Text('You', style: TextStyle(fontSize: 9, color: AppColors.textMute)),
        ],
      ),
    );
  }
}

class _DemoPost extends StatelessWidget {
  const _DemoPost({required this.onLike, required this.onComment});
  final VoidCallback onLike;
  final VoidCallback onComment;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                children: [
                  const _GradientRing(child: AvatarImage(name: 'SM', size: 24)),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Sara Mekonnen', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                        Text('Computer Science · 2h', style: TextStyle(fontSize: 9, color: AppColors.textMute)),
                      ],
                    ),
                  ),
                  Icon(Icons.more_horiz, size: 14, color: AppColors.textMute),
                ],
              ),
            ),
            Container(
              height: 150,
              margin: const EdgeInsets.only(top: 10),
              decoration: const BoxDecoration(gradient: AppColors.gradientBanner),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Finals week survival mode 📚', style: AppTypography.body(context, size: 11)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _Action(icon: Icons.favorite, label: '128', color: AppColors.g2a, onTap: onLike),
                      const SizedBox(width: 14),
                      _Action(icon: Icons.chat_bubble_outline, label: '24', onTap: onComment),
                      const Spacer(),
                      const Icon(Icons.bookmark_border, size: 16, color: AppColors.textMute),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PostCard extends StatefulWidget {
  const _PostCard({
    required this.post,
    required this.onLike,
    required this.onDoubleTap,
    required this.onComment,
    required this.showBurst,
    required this.onBurstDone,
  });

  final PostModel post;
  final VoidCallback onLike;
  final VoidCallback onDoubleTap;
  final VoidCallback onComment;
  final bool showBurst;
  final VoidCallback onBurstDone;

  @override
  State<_PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<_PostCard> {
  bool _saved = false;

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final media = ApiConfig.mediaUrl(post.media);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                children: [
                  _GradientRing(child: AvatarImage(url: post.user?.avatar, name: post.user?.username, size: 24)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(post.user?.username ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                        Text(
                          '${post.user?.department ?? 'Campus'} · ${post.createdAt != null ? timeago.format(post.createdAt!) : ''}',
                          style: const TextStyle(fontSize: 9, color: AppColors.textMute),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.more_horiz, size: 14, color: AppColors.textMute),
                ],
              ),
            ),
            if (post.caption != null && post.caption!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                child: Text(post.caption!, style: AppTypography.body(context, size: 11)),
              ),
            if (media.isNotEmpty)
              GestureDetector(
                onDoubleTap: widget.onDoubleTap,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: CachedNetworkImage(
                        imageUrl: media,
                        width: double.infinity,
                        height: 150,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          height: 150,
                          color: AppColors.darkSurface,
                        ),
                      ),
                    ),
                    if (widget.showBurst) LikeBurst(onComplete: widget.onBurstDone),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  _Action(
                    icon: post.liked ? Icons.favorite : Icons.favorite_border,
                    label: '${post.likesCount}',
                    color: post.liked ? AppColors.g2a : AppColors.textMute,
                    onTap: widget.onLike,
                  ),
                  const SizedBox(width: 14),
                  _Action(icon: Icons.chat_bubble_outline, label: '${post.commentsCount}', onTap: widget.onComment),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _saved = !_saved),
                    child: Icon(
                      _saved ? Icons.bookmark : Icons.bookmark_border,
                      size: 16,
                      color: _saved ? AppColors.g1a : AppColors.textMute,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GradientRing extends StatelessWidget {
  const _GradientRing({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      padding: const EdgeInsets.all(2),
      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.gradientPrimary),
      child: ClipOval(child: child),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color? color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Row(
        children: [
          Icon(icon, size: 16, color: color ?? AppColors.textMute),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMute)),
        ],
      ),
    );
  }
}
