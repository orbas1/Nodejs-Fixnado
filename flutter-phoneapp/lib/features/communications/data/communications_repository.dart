import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/communication_models.dart';

class CommunicationsRepository {
  CommunicationsRepository(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static String _listCacheKey(String participantId) => 'communications:list:$participantId';
  static String _conversationCacheKey(String conversationId) => 'communications:conversation:$conversationId';

  Future<ConversationCollection> fetchConversations(String participantId) async {
    try {
      final payload = await _client.getJson('/communications', query: {'participantId': participantId});
      final conversations = (payload['data'] as List<dynamic>? ?? payload as List<dynamic>? ?? [])
          .map((item) => ConversationModel.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
      await _cache.writeJson(
        _listCacheKey(participantId),
        conversations.map((conversation) => {
              'id': conversation.id,
              'subject': conversation.subject,
              'aiAssistDefault': conversation.aiAssistDefault,
              'retentionDays': conversation.retentionDays,
              'metadata': conversation.metadata,
              'participants': conversation.participants
                  .map((participant) => {
                        'id': participant.id,
                        'conversationId': participant.conversationId,
                        'participantType': participant.participantType,
                        'displayName': participant.displayName,
                        'role': participant.role,
                        'aiAssistEnabled': participant.aiAssistEnabled,
                        'notificationsEnabled': participant.notificationsEnabled,
                        'videoEnabled': participant.videoEnabled,
                        'quietHoursStart': participant.quietHoursStart,
                        'quietHoursEnd': participant.quietHoursEnd,
                        'timezone': participant.timezone,
                        'metadata': participant.metadata,
                      })
                  .toList(),
                'messages': conversation.messages
                    .map((message) => {
                          'id': message.id,
                          'conversationId': message.conversationId,
                          'senderParticipantId': message.senderParticipantId,
                          'messageType': message.messageType,
                          'body': message.body,
                          'createdAt': message.createdAt.toIso8601String(),
                          'aiAssistUsed': message.aiAssistUsed,
                          'aiConfidenceScore': message.aiConfidenceScore,
                        })
                    .toList(),
              })
          .toList(),
      );
      return ConversationCollection(conversations: conversations, offline: false);
    } on TimeoutException catch (_) {
      final cached = _cache.readJson(_listCacheKey(participantId));
      if (cached != null) {
        final data = List<Map<String, dynamic>>.from(cached['value'] as List);
        return ConversationCollection(
          conversations: data.map(ConversationModel.fromJson).toList(),
          offline: true,
        );
      }
      rethrow;
    } on ApiException catch (_) {
      final cached = _cache.readJson(_listCacheKey(participantId));
      if (cached != null) {
        final data = List<Map<String, dynamic>>.from(cached['value'] as List);
        return ConversationCollection(
          conversations: data.map(ConversationModel.fromJson).toList(),
          offline: true,
        );
      }
      rethrow;
    }
  }

  Future<ConversationModel> fetchConversation(String conversationId, {int? limit}) async {
    final payload = await _client.getJson('/communications/$conversationId', query: {
      if (limit != null) 'limit': limit,
    });
    final conversation = ConversationModel.fromJson(payload);
    await _cache.writeJson(_conversationCacheKey(conversationId), payload);
    return conversation;
  }

  Future<ConversationModel?> readCachedConversation(String conversationId) async {
    final cached = _cache.readJson(_conversationCacheKey(conversationId));
    if (cached == null) {
      return null;
    }
    return ConversationModel.fromJson(Map<String, dynamic>.from(cached['value'] as Map));
  }

  Future<List<ConversationMessageModel>> sendMessage(
    String conversationId, {
    required String participantId,
    required String body,
    bool requestAiAssist = false,
  }) async {
    final payload = await _client.postJson('/communications/$conversationId/messages', body: {
      'senderParticipantId': participantId,
      'body': body,
      'requestAiAssist': requestAiAssist,
    });
    final messages = (payload['data'] as List<dynamic>? ?? payload as List<dynamic>? ?? [])
        .map((item) => ConversationMessageModel.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    return messages;
  }

  Future<ConversationParticipantModel> updatePreferences(
    String conversationId,
    String participantId,
    Map<String, dynamic> updates,
  ) async {
    final payload = await _client.patchJson('/communications/$conversationId/participants/$participantId', body: updates);
    return ConversationParticipantModel.fromJson(payload);
  }

  Future<VideoSessionModel> createVideoSession(String conversationId, String participantId) async {
    final payload = await _client.postJson('/communications/$conversationId/video-session', body: {
      'participantId': participantId,
    });
    return VideoSessionModel.fromJson(payload);
  }
}

final communicationsRepositoryProvider = Provider<CommunicationsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return CommunicationsRepository(client, cache);
});
