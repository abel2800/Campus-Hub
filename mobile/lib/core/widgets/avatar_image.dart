import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/api_config.dart';

class AvatarImage extends StatelessWidget {
  const AvatarImage({
    super.key,
    this.url,
    this.size = 48,
    this.name,
  });

  final String? url;
  final double size;
  final String? name;

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiConfig.mediaUrl(url);
    final initial = (name?.isNotEmpty == true) ? name![0].toUpperCase() : '?';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipOval(
        child: imageUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => Center(
                  child: Text(initial, style: TextStyle(color: Colors.white, fontSize: size * 0.4)),
                ),
                errorWidget: (_, __, ___) => Center(
                  child: Text(initial, style: TextStyle(color: Colors.white, fontSize: size * 0.4)),
                ),
              )
            : Center(
                child: Text(
                  initial,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: size * 0.4,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      ),
    );
  }
}
