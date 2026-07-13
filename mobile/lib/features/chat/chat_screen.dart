import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/gradient_background.dart';
import '../../core/widgets/primary_button.dart';
import '../../models/social_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/campus_ui.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, required this.userId});
  final int userId;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  List<MessageModel> _messages = [];
  bool _loading = true;
  String _peerName = 'Chat';

  @override
  void initState() {
    super.initState();
    _load();
    ref.read(socketServiceProvider).on('private-message', (_) => _load());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final msgs = await ref.read(messageServiceProvider).getMessages(widget.userId);
      if (mounted) {
        setState(() {
          _messages = msgs;
          _loading = false;
          if (msgs.isNotEmpty && msgs.first.sender?.username != null) {
            _peerName = msgs.first.sender!.username;
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    await ref.read(messageServiceProvider).sendMessage(widget.userId, text);
    ref.read(socketServiceProvider).emit('private-message', {
      'recipientId': widget.userId,
      'message': text,
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final myId = ref.watch(authProvider).user?.id;
    final hasText = _controller.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.deepSpace,
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 12),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.chevron_left, color: AppColors.textDim, size: 22),
                    ),
                    _HeaderAvatar(name: _peerName),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_peerName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        const Text('online', style: TextStyle(fontSize: 9, color: AppColors.g2a)),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator(color: AppColors.g1a, strokeWidth: 2))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          if (_messages.isEmpty) ...[
                            _Bubble(text: 'Did you finish the DSP problem set?', mine: false),
                            _Bubble(text: 'Almost, stuck on Q4', mine: true),
                            _Bubble(text: 'Can you send yours?', mine: true),
                            const Padding(
                              padding: EdgeInsets.only(top: 4, bottom: 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Icon(Icons.done_all, size: 12, color: AppColors.g1a),
                                  SizedBox(width: 3),
                                  Text('Read', style: TextStyle(fontSize: 9, color: AppColors.textMute)),
                                ],
                              ),
                            ),
                            const _TypingBubble(),
                          ] else
                            ..._messages.map((m) {
                              final mine = m.senderId == myId;
                              return _Bubble(text: m.content, mine: mine);
                            }),
                        ],
                      ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: GlassCard(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        borderRadius: 20,
                        child: TextField(
                          controller: _controller,
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(fontSize: 11),
                          decoration: const InputDecoration(
                            hintText: 'Message…',
                            hintStyle: TextStyle(fontSize: 11, color: AppColors.textMute),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: hasText ? _send : null,
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: hasText ? AppColors.gradientPrimary : null,
                          color: hasText ? null : AppColors.glassFill,
                        ),
                        child: Icon(
                          Icons.arrow_upward_rounded,
                          size: 16,
                          color: hasText ? AppColors.onGradient : AppColors.textMute,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderAvatar extends StatelessWidget {
  const _HeaderAvatar({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.gradientPrimary),
      alignment: Alignment.center,
      child: Text(
        name.length >= 2 ? name.substring(0, 2).toUpperCase() : '??',
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.onGradient),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.text, required this.mine});
  final String text;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.7),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          gradient: mine ? AppColors.gradientPrimary : null,
          color: mine ? null : AppColors.glassFill,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(mine ? 16 : 4),
            bottomRight: Radius.circular(mine ? 4 : 16),
          ),
          border: mine ? null : Border.all(color: AppColors.glassBorder, width: 0.5),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 11,
            fontWeight: mine ? FontWeight.w500 : FontWeight.w400,
            color: mine ? AppColors.onGradient : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        borderRadius: 16,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            3,
            (i) => Container(
              width: 5,
              height: 5,
              margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
              decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.textMute),
            ),
          ),
        ),
      ),
    );
  }
}
