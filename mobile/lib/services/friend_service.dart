import '../core/network/api_client.dart';
import '../models/social_model.dart';

class FriendService {
  FriendService(this._api);
  final ApiClient _api;

  Future<List<FriendModel>> getFriends() async {
    final res = await _api.get('/friends/list');
    final list = res.data as List;
    return list.map((e) => FriendModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<FriendRequestModel>> getPendingRequests() async {
    final res = await _api.get('/friends/requests/pending');
    final list = res.data as List;
    return list.map((e) => FriendRequestModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<FriendModel>> searchUsers(String query) async {
    final res = await _api.get('/friends/search/users', query: {'query': query});
    final list = res.data as List;
    return list.map((e) => FriendModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> sendRequest(int receiverId) async {
    await _api.post('/friends/request', data: {'receiverId': receiverId});
  }

  Future<void> acceptRequest(int requestId) async {
    await _api.post('/friends/requests/$requestId/accept');
  }

  Future<void> rejectRequest(int requestId) async {
    await _api.post('/friends/requests/$requestId/reject');
  }

  Future<void> removeFriend(int friendId) async {
    await _api.delete('/friends/$friendId');
  }
}

class MessageService {
  MessageService(this._api);
  final ApiClient _api;

  Future<List<MessageModel>> getMessages(int participantId) async {
    final res = await _api.get('/messages/$participantId');
    final list = res.data as List;
    return list.map((e) => MessageModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> sendMessage(int recipientId, String content) async {
    await _api.post('/messages/send', data: {
      'recipientId': recipientId,
      'content': content,
    });
  }
}

class NotificationService {
  NotificationService(this._api);
  final ApiClient _api;

  Future<List<NotificationModel>> getNotifications() async {
    final res = await _api.get('/notifications');
    final list = res.data as List;
    return list.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markRead(int id) async {
    await _api.put('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _api.put('/notifications/read-all');
  }
}
