import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../models/post_model.dart';

class SocialService {
  SocialService(this._api);
  final ApiClient _api;

  Future<List<PostModel>> getFeed() async {
    final res = await _api.get('/posts/feed');
    final list = res.data as List;
    return list.map((e) => PostModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<PostModel> createPost({String? caption, String? filePath}) async {
    final form = FormData.fromMap({
      if (caption != null) 'caption': caption,
      if (filePath != null) 'media': await MultipartFile.fromFile(filePath),
    });
    final res = await _api.postForm('/posts', form);
    return PostModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> likePost(int postId) async {
    await _api.post('/posts/$postId/like');
  }

  Future<void> unlikePost(int postId) async {
    await _api.delete('/posts/$postId/unlike');
  }

  Future<List<CommentModel>> getComments(int postId) async {
    final res = await _api.get('/posts/$postId/comments');
    final list = res.data as List;
    return list.map((e) => CommentModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> addComment(int postId, String content) async {
    await _api.post('/posts/$postId/comment', data: {'content': content});
  }

  Future<List<StoryModel>> getStories() async {
    final res = await _api.get('/stories');
    final list = res.data as List;
    return list.map((e) => StoryModel.fromJson(e as Map<String, dynamic>)).toList();
  }
}
