import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/communications_repository.dart';
import '../domain/communication_models.dart';

final communicationsControllerProvider =
    StateNotifierProvider<CommunicationsController, CommunicationsViewState>((ref) {
  final repository = ref.watch(communicationsRepositoryProvider);
  return CommunicationsController(ref, repository);
});

class CommunicationsController extends StateNotifier<CommunicationsViewState> {
  CommunicationsController(this._ref, this._repository)
      : super(const CommunicationsViewState());

  final Ref _ref;
  final CommunicationsRepository _repository;

  Future<void> setParticipant(String? participantId) async {
    state = state.copyWith(
      participantId: participantId,
      conversations: const [],
      activeConversationId: null,
      activeConversation: null,
      errorMessage: null,
      videoSession: null,
      offline: false,
    );

    if (participantId != null && participantId.isNotEmpty) {
      await refreshConversations();
    }
  }

  Future<void> refreshConversations() async {
    final participantId = state.participantId;
    if (participantId == null || participantId.isEmpty) {
      return;
    }

    state = state.copyWith(listLoading: true, errorMessage: null);
    try {
      final collection = await _repository.fetchConversations(participantId);
      state = state.copyWith(
        conversations: collection.conversations,
        listLoading: false,
        offline: collection.offline,
        activeConversationId:
            state.activeConversationId ?? collection.conversations.firstOrNull?.id,
      );

      if (state.activeConversationId != null) {
        await loadConversation(state.activeConversationId!);
      }
    } on Exception catch (error) {
      state = state.copyWith(
        listLoading: false,
        errorMessage: error.toString(),
      );
    }
  }

  Future<void> loadConversation(String conversationId) async {
    state = state.copyWith(
      activeConversationId: conversationId,
      messagesLoading: true,
      errorMessage: null,
    );

    try {
      final conversation = await _repository.fetchConversation(conversationId, limit: 100);
      state = state.copyWith(
        activeConversation: conversation,
        messagesLoading: false,
        videoSession: null,
      );
    } on Exception catch (error) {
      final cached = await _repository.readCachedConversation(conversationId);
      if (cached != null) {
        state = state.copyWith(
          activeConversation: cached,
          messagesLoading: false,
          videoSession: null,
          errorMessage: error.toString(),
        );
      } else {
        state = state.copyWith(
          messagesLoading: false,
          errorMessage: error.toString(),
        );
      }
    }
  }

  Future<void> sendMessage(String body, {bool requestAiAssist = false}) async {
    final conversationId = state.activeConversationId;
    final participantId = state.participantId;
    if (conversationId == null || participantId == null) {
      return;
    }

    state = state.copyWith(messageSending: true, errorMessage: null);
    try {
      final messages = await _repository.sendMessage(
        conversationId,
        participantId: participantId,
        body: body,
        requestAiAssist: requestAiAssist,
      );

      final updatedConversation = state.activeConversation?.copyWith(
        messages: [...(state.activeConversation?.messages ?? const []), ...messages],
      );
      final updatedConversations = state.conversations
          .map((conversation) =>
              conversation.id == conversationId ? conversation.copyWith(messages: [messages.last]) : conversation)
          .toList();

      state = state.copyWith(
        activeConversation: updatedConversation,
        conversations: updatedConversations,
        messageSending: false,
      );
    } on Exception catch (error) {
      state = state.copyWith(messageSending: false, errorMessage: error.toString());
    }
  }

  Future<void> updatePreferences(Map<String, dynamic> updates) async {
    final conversationId = state.activeConversationId;
    final participantId = state.participantId;
    if (conversationId == null || participantId == null) {
      return;
    }

    state = state.copyWith(preferencesSaving: true, errorMessage: null);
    try {
      final participant = await _repository.updatePreferences(conversationId, participantId, updates);
      final updatedParticipants = state.activeConversation?.participants
              .map((item) => item.id == participant.id ? participant : item)
              .toList() ??
          const [];

      state = state.copyWith(
        activeConversation: state.activeConversation?.copyWith(participants: updatedParticipants),
        preferencesSaving: false,
      );
    } on Exception catch (error) {
      state = state.copyWith(preferencesSaving: false, errorMessage: error.toString());
    }
  }

  Future<void> createVideoSession() async {
    final conversationId = state.activeConversationId;
    final participantId = state.participantId;
    if (conversationId == null || participantId == null) {
      return;
    }

    try {
      final session = await _repository.createVideoSession(conversationId, participantId);
      state = state.copyWith(videoSession: session);
    } on Exception catch (error) {
      state = state.copyWith(errorMessage: error.toString());
    }
  }
}

class CommunicationsViewState {
  const CommunicationsViewState({
    this.participantId,
    this.conversations = const [],
    this.activeConversationId,
    this.activeConversation,
    this.listLoading = false,
    this.messagesLoading = false,
    this.messageSending = false,
    this.preferencesSaving = false,
    this.offline = false,
    this.errorMessage,
    this.videoSession,
  });

  final String? participantId;
  final List<ConversationModel> conversations;
  final String? activeConversationId;
  final ConversationModel? activeConversation;
  final bool listLoading;
  final bool messagesLoading;
  final bool messageSending;
  final bool preferencesSaving;
  final bool offline;
  final String? errorMessage;
  final VideoSessionModel? videoSession;

  static const _sentinel = Object();

  CommunicationsViewState copyWith({
    String? participantId,
    List<ConversationModel>? conversations,
    String? activeConversationId,
    ConversationModel? activeConversation,
    bool? listLoading,
    bool? messagesLoading,
    bool? messageSending,
    bool? preferencesSaving,
    bool? offline,
    Object? errorMessage = _sentinel,
    Object? videoSession = _sentinel,
  }) {
    return CommunicationsViewState(
      participantId: participantId ?? this.participantId,
      conversations: conversations ?? this.conversations,
      activeConversationId: activeConversationId ?? this.activeConversationId,
      activeConversation: activeConversation ?? this.activeConversation,
      listLoading: listLoading ?? this.listLoading,
      messagesLoading: messagesLoading ?? this.messagesLoading,
      messageSending: messageSending ?? this.messageSending,
      preferencesSaving: preferencesSaving ?? this.preferencesSaving,
      offline: offline ?? this.offline,
      errorMessage:
          identical(errorMessage, _sentinel) ? this.errorMessage : errorMessage as String?,
      videoSession:
          identical(videoSession, _sentinel) ? this.videoSession : videoSession as VideoSessionModel?,
    );
  }
}
