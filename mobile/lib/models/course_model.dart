class CourseModel {
  final int id;
  final String title;
  final String description;
  final String? thumbnail;
  final String? imageUrl;
  final String? department;
  final String? level;
  final String? duration;
  final String? status;
  final int? totalVideos;
  final int? enrollmentCount;
  final int? progress;
  final String? teacherName;

  const CourseModel({
    required this.id,
    required this.title,
    required this.description,
    this.thumbnail,
    this.imageUrl,
    this.department,
    this.level,
    this.duration,
    this.status,
    this.totalVideos,
    this.enrollmentCount,
    this.progress,
    this.teacherName,
  });

  String get cover => thumbnail ?? imageUrl ?? '';

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      thumbnail: json['thumbnail'] as String?,
      imageUrl: json['imageUrl'] as String?,
      department: json['department'] as String?,
      level: json['level'] as String?,
      duration: json['duration'] as String?,
      status: json['status'] as String?,
      totalVideos: json['totalVideos'] as int?,
      enrollmentCount: json['enrollmentCount'] as int?,
      progress: json['progress'] as int?,
      teacherName: json['teacherName'] as String? ??
          (json['instructor'] as Map?)?['username'] as String?,
    );
  }
}

class CourseVideoModel {
  final int id;
  final int courseId;
  final String title;
  final String? description;
  final String videoUrl;
  final String? thumbnail;
  final int duration;
  final int order;

  const CourseVideoModel({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    required this.videoUrl,
    this.thumbnail,
    this.duration = 0,
    this.order = 0,
  });

  factory CourseVideoModel.fromJson(Map<String, dynamic> json) {
    return CourseVideoModel(
      id: json['id'] as int,
      courseId: json['courseId'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      videoUrl: json['videoUrl'] as String? ?? '',
      thumbnail: json['thumbnail'] as String?,
      duration: json['duration'] as int? ?? 0,
      order: json['order'] as int? ?? 0,
    );
  }
}
