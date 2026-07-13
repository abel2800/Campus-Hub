import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../models/course_model.dart';

class TeacherService {
  TeacherService(this._api);
  final ApiClient _api;

  Future<List<CourseModel>> getCourses() async {
    final res = await _api.get('/teacher/courses');
    final data = res.data;
    final list = data is List ? data : (data['courses'] as List? ?? []);
    return list.map((e) => CourseModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CourseModel> createCourse({
    required String title,
    required String description,
    FormData? formData,
  }) async {
    final res = formData != null
        ? await _api.postForm('/teacher/courses', formData)
        : await _api.post('/teacher/courses', data: {
            'title': title,
            'description': description,
          });
    return CourseModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<CourseModel> updateCourse(int id, Map<String, dynamic> data, {FormData? formData}) async {
    final res = formData != null
        ? await _api.postForm('/courses/$id', formData)
        : await _api.put('/courses/$id', data: data);
    return CourseModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> getCourseStudents(int courseId) async {
    final res = await _api.get('/teacher/courses/$courseId/students');
    final list = res.data as List;
    return list.cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getAnalytics() async {
    final res = await _api.get('/teacher/analytics');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCourseProgress(int courseId) async {
    final res = await _api.get('/teacher/courses/$courseId/progress');
    return res.data as Map<String, dynamic>;
  }

  Future<void> uploadVideo(int courseId, FormData formData) async {
    await _api.postForm('/teacher/courses/$courseId/videos', formData);
  }

  Future<List<CourseVideoModel>> getVideos(int courseId) async {
    final res = await _api.get('/teacher/courses/$courseId/videos');
    final list = res.data as List;
    return list.map((e) => CourseVideoModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
