import '../core/network/api_client.dart';
import '../models/course_model.dart';

class CourseService {
  CourseService(this._api);
  final ApiClient _api;

  Future<List<CourseModel>> getAllCourses() async {
    final res = await _api.get('/courses');
    final list = res.data as List;
    return list.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CourseModel> getCourse(int id) async {
    final res = await _api.get('/courses/$id');
    return CourseModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<CourseModel>> getEnrolledCourses() async {
    final res = await _api.get('/courses/user/enrolled');
    final list = res.data as List;
    return list.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<CourseVideoModel>> getVideos(int courseId) async {
    final res = await _api.get('/courses/$courseId/videos');
    final list = res.data as List;
    return list.map((e) => CourseVideoModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> enroll(int courseId) async {
    await _api.post('/courses/$courseId/enroll');
  }

  Future<void> unenroll(int courseId) async {
    await _api.delete('/courses/$courseId/enroll');
  }

  Future<void> updateProgress(int courseId, int progress, {int? videoId}) async {
    await _api.put('/courses/$courseId/progress', data: {
      'progress': progress,
      if (videoId != null) 'videoId': videoId,
    });
  }

  Future<List<CourseModel>> getTeacherCourses() async {
    final res = await _api.get('/courses/teacher');
    final list = res.data as List;
    return list.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
