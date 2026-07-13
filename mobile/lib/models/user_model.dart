class AppUser {
  final int id;
  final String username;
  final String email;
  final String? department;
  final String? avatar;
  final String? bio;
  final String role;

  const AppUser({
    required this.id,
    required this.username,
    required this.email,
    this.department,
    this.avatar,
    this.bio,
    this.role = 'student',
  });

  bool get isTeacher => role == 'teacher';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      department: json['department'] as String?,
      avatar: json['avatar'] as String? ?? json['avatarUrl'] as String?,
      bio: json['bio'] as String?,
      role: json['role'] as String? ?? 'student',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'department': department,
        'avatar': avatar,
        'bio': bio,
        'role': role,
      };
}
