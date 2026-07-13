class FriendModel {
  final int id;
  final String username;
  final String? email;
  final String? avatar;
  final String? department;

  const FriendModel({
    required this.id,
    required this.username,
    this.email,
    this.avatar,
    this.department,
  });

  factory FriendModel.fromJson(Map<String, dynamic> json) {
    final user = json['friend'] as Map<String, dynamic>? ?? json;
    return FriendModel(
      id: user['id'] as int,
      username: user['username'] as String? ?? '',
      email: user['email'] as String?,
      avatar: user['avatar'] as String? ?? user['avatarUrl'] as String?,
      department: user['department'] as String?,
    );
  }
}

class FriendRequestModel {
  final int id;
  final String status;
  final FriendModel sender;

  const FriendRequestModel({
    required this.id,
    required this.status,
    required this.sender,
  });

  factory FriendRequestModel.fromJson(Map<String, dynamic> json) {
    return FriendRequestModel(
      id: json['id'] as int,
      status: json['status'] as String? ?? 'pending',
      sender: FriendModel.fromJson(json['sender'] as Map<String, dynamic>),
    );
  }
}

class MessageModel {
  final int id;
  final String content;
  final int senderId;
  final int receiverId;
  final DateTime? createdAt;
  final FriendModel? sender;

  const MessageModel({
    required this.id,
    required this.content,
    required this.senderId,
    required this.receiverId,
    this.createdAt,
    this.sender,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as int,
      content: json['content'] as String? ?? json['message'] as String? ?? '',
      senderId: json['senderId'] as int? ?? json['sender_id'] as int? ?? 0,
      receiverId: json['receiverId'] as int? ?? json['receiver_id'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.tryParse(json['created_at'].toString())
              : null,
      sender: json['sender'] != null
          ? FriendModel.fromJson(json['sender'] as Map<String, dynamic>)
          : null,
    );
  }
}

class NotificationModel {
  final int id;
  final String type;
  final String content;
  final bool read;
  final DateTime? createdAt;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.content,
    this.read = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as int,
      type: json['type'] as String? ?? 'SYSTEM',
      content: json['content'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}
