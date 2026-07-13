class PostModel {
  final int id;
  final String? caption;
  final String? imageUrl;
  final String? mediaUrl;
  final String? mediaType;
  final int likesCount;
  final int commentsCount;
  final DateTime? createdAt;
  final PostUser? user;
  final bool liked;

  const PostModel({
    required this.id,
    this.caption,
    this.imageUrl,
    this.mediaUrl,
    this.mediaType,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.createdAt,
    this.user,
    this.liked = false,
  });

  String? get media => mediaUrl ?? imageUrl;

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['id'] as int,
      caption: json['caption'] as String? ?? json['content'] as String?,
      imageUrl: json['imageUrl'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      mediaType: json['mediaType'] as String?,
      likesCount: json['likesCount'] as int? ?? 0,
      commentsCount: json['commentsCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: json['user'] != null
          ? PostUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      liked: json['liked'] as bool? ?? false,
    );
  }
}

class PostUser {
  final int id;
  final String username;
  final String? avatar;
  final String? department;

  const PostUser({
    required this.id,
    required this.username,
    this.avatar,
    this.department,
  });

  factory PostUser.fromJson(Map<String, dynamic> json) {
    return PostUser(
      id: json['id'] as int,
      username: json['username'] as String? ?? '',
      avatar: json['avatar'] as String?,
      department: json['department'] as String?,
    );
  }
}

class CommentModel {
  final int id;
  final String content;
  final DateTime? createdAt;
  final PostUser? user;

  const CommentModel({
    required this.id,
    required this.content,
    this.createdAt,
    this.user,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as int,
      content: json['content'] as String? ?? json['text'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: json['user'] != null
          ? PostUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}

class StoryModel {
  final int id;
  final String? mediaUrl;
  final String? mediaType;
  final DateTime? createdAt;
  final PostUser? user;

  const StoryModel({
    required this.id,
    this.mediaUrl,
    this.mediaType,
    this.createdAt,
    this.user,
  });

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    return StoryModel(
      id: json['id'] as int,
      mediaUrl: json['mediaUrl'] as String? ?? json['imageUrl'] as String?,
      mediaType: json['mediaType'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: json['user'] != null
          ? PostUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}
