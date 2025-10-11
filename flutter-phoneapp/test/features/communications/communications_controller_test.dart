import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:riverpod/riverpod.dart';

import 'package:fixnado_mobile/features/communications/data/communications_repository.dart';
import 'package:fixnado_mobile/features/communications/domain/communication_models.dart';
import 'package:fixnado_mobile/features/communications/presentation/communications_controller.dart';

class _MockCommunicationsRepository extends Mock implements CommunicationsRepository {}

void main() {
  late ProviderContainer container;
  late CommunicationsController controller;
  late _MockCommunicationsRepository repository;

  final participant = ConversationParticipantModel(
    id: 'participant-1',
    conversationId: 'conversation-1',
    participantType: 'user',
    displayName: 'Ops Manager',
    role: 'support',
    aiAssistEnabled: true,
    notificationsEnabled: true,
    videoEnabled: true,
  );

  final message = ConversationMessageModel(
    id: 'message-1',
    conversationId: 'conversation-1',
    senderParticipantId: 'participant-1',
    messageType: 'user',
    body: 'Hello world',
    createdAt: DateTime.parse('2025-02-10T10:00:00Z'),
    aiAssistUsed: false,
  );

  final conversation = ConversationModel(
    id: 'conversation-1',
    subject: 'Onboarding',
    aiAssistDefault: true,
    retentionDays: 90,
    participants: [participant],
    messages: [message],
  );

  setUp(() {
    repository = _MockCommunicationsRepository();
    container = ProviderContainer(overrides: [
      communicationsRepositoryProvider.overrideWithValue(repository),
    ]);
    addTearDown(container.dispose);
    controller = container.read(communicationsControllerProvider.notifier);
  });

  test('setParticipant loads conversations and active conversation', () async {
    when(() => repository.fetchConversations('participant-1')).thenAnswer(
      (_) async => ConversationCollection(conversations: [conversation], offline: false),
    );
    when(() => repository.fetchConversation('conversation-1', limit: any(named: 'limit')))
        .thenAnswer((_) async => conversation);

    await controller.setParticipant('participant-1');

    final state = container.read(communicationsControllerProvider);
    expect(state.participantId, 'participant-1');
    expect(state.conversations, hasLength(1));
    expect(state.activeConversation?.id, 'conversation-1');
    verify(() => repository.fetchConversations('participant-1')).called(1);
    verify(() => repository.fetchConversation('conversation-1', limit: any(named: 'limit'))).called(1);
  });

  test('sendMessage appends messages to active conversation', () async {
    when(() => repository.fetchConversations(any())).thenAnswer(
      (_) async => ConversationCollection(conversations: [conversation], offline: false),
    );
    when(() => repository.fetchConversation('conversation-1', limit: any(named: 'limit')))
        .thenAnswer((_) async => conversation);
    when(
      () => repository.sendMessage(
        'conversation-1',
        participantId: any(named: 'participantId'),
        body: any(named: 'body'),
        requestAiAssist: any(named: 'requestAiAssist'),
      ),
    ).thenAnswer(
      (_) async => [
        ConversationMessageModel(
          id: 'message-2',
          conversationId: 'conversation-1',
          senderParticipantId: 'participant-1',
          messageType: 'user',
          body: 'Escalate to AI',
          createdAt: DateTime.parse('2025-02-10T10:05:00Z'),
          aiAssistUsed: false,
        ),
        ConversationMessageModel(
          id: 'message-3',
          conversationId: 'conversation-1',
          senderParticipantId: null,
          messageType: 'assistant',
          body: 'AI summary here',
          createdAt: DateTime.parse('2025-02-10T10:05:05Z'),
          aiAssistUsed: true,
          aiConfidenceScore: 0.8,
        )
      ],
    );

    await controller.setParticipant('participant-1');
    await controller.sendMessage('Escalate to AI', requestAiAssist: true);

    final state = container.read(communicationsControllerProvider);
    expect(state.activeConversation?.messages, hasLength(3));
    expect(state.activeConversation?.messages.last.messageType, 'assistant');
  });

  test('createVideoSession stores session metadata', () async {
    when(() => repository.createVideoSession('conversation-1', 'participant-1')).thenAnswer(
      (_) async => VideoSessionModel(
        appId: 'test-app',
        channelName: 'channel',
        token: 'token',
        uid: '42',
        expiresAt: DateTime.parse('2025-02-10T11:00:00Z'),
      ),
    );

    controller.state = controller.state.copyWith(
      participantId: 'participant-1',
      activeConversationId: 'conversation-1',
      activeConversation: conversation,
    );

    await controller.createVideoSession();

    final state = container.read(communicationsControllerProvider);
    expect(state.videoSession?.token, 'token');
  });

  test('updatePreferences replaces participant entry', () async {
    when(
      () => repository.updatePreferences(
        'conversation-1',
        'participant-1',
        any(),
      ),
    ).thenAnswer(
      (_) async => ConversationParticipantModel(
        id: 'participant-1',
        conversationId: 'conversation-1',
        participantType: 'user',
        displayName: 'Ops Manager',
        role: 'support',
        aiAssistEnabled: false,
        notificationsEnabled: false,
        videoEnabled: true,
      ),
    );

    controller.state = controller.state.copyWith(
      participantId: 'participant-1',
      activeConversationId: 'conversation-1',
      activeConversation: conversation,
    );

    await controller.updatePreferences({'notificationsEnabled': false});

    final state = container.read(communicationsControllerProvider);
    expect(state.activeConversation?.participants.first.notificationsEnabled, isFalse);
    expect(state.preferencesSaving, isFalse);
  });
}
