import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/role_scope.dart';
import '../../auth/domain/user_role.dart';
import '../domain/communication_models.dart';
import 'communications_controller.dart';

const _communicationsAllowedRoles = <UserRole>{
  UserRole.provider,
  UserRole.enterprise,
  UserRole.support,
  UserRole.operations,
  UserRole.admin,
};

class _EntryPointDefinition {
  const _EntryPointDefinition({
    required this.key,
    required this.title,
    required this.tagline,
    required this.emoji,
    required this.template,
  });

  final String key;
  final String title;
  final String tagline;
  final String emoji;
  final String template;
}

const _entryPointDefinitions = <_EntryPointDefinition>[
  _EntryPointDefinition(
    key: 'serviceLaunch',
    title: 'Service launch',
    tagline: 'Kickoff updates when crews roll out.',
    emoji: '🚚',
    template: 'Hi there! Your Fixnado service has just launched. Let us know if anything on-site needs attention.',
  ),
  _EntryPointDefinition(
    key: 'toolsMaterials',
    title: 'Tools & materials',
    tagline: 'Assist shoppers reviewing equipment.',
    emoji: '🛠️',
    template:
        'Hello! I noticed you are reviewing our tools and material display. I am here to help with specs, availability, or bundle suggestions.',
  ),
  _EntryPointDefinition(
    key: 'shopFronts',
    title: 'Shop fronts',
    tagline: 'Chat from every storefront card.',
    emoji: '🛍️',
    template: 'Welcome to our Fixnado shop front! How can we help you find the right service or product today?',
  ),
  _EntryPointDefinition(
    key: 'businessFronts',
    title: 'Business fronts',
    tagline: 'Keep profile visitors engaged.',
    emoji: '🏢',
    template:
        'Thanks for visiting our Fixnado business front. I am on hand if you need recommendations or want to schedule a consult.',
  ),
  _EntryPointDefinition(
    key: 'bookingFlow',
    title: 'Booking flow',
    tagline: 'Guide customers as they schedule.',
    emoji: '📅',
    template:
        'I am here while you complete your booking. Let me know if you need help picking a time or clarifying what is included.',
  ),
  _EntryPointDefinition(
    key: 'purchaseFlow',
    title: 'Checkout',
    tagline: 'Answer questions before payment.',
    emoji: '🧾',
    template:
        'I can help as you finalise your purchase. If anything looks unclear, send a quick note and I will respond right away.',
  ),
];

class CommunicationsScreen extends ConsumerStatefulWidget {
  const CommunicationsScreen({super.key});

  @override
  ConsumerState<CommunicationsScreen> createState() => _CommunicationsScreenState();
}

class _CommunicationsScreenState extends ConsumerState<CommunicationsScreen> {
  late final TextEditingController _participantController;
  late final FocusNode _participantFocusNode;
  late final TextEditingController _messageController;
  late final FocusNode _messageFocusNode;
  late final ScrollController _messageScrollController;
  late final Map<String, bool> _entryPointSettings;
  String? _lastConversationId;
  bool _requestAiAssist = false;
  String? _composerError;

  @override
  void initState() {
    super.initState();
    _participantController = TextEditingController();
    _participantFocusNode = FocusNode();
    _messageController = TextEditingController();
    _messageFocusNode = FocusNode();
    _messageScrollController = ScrollController();
    _entryPointSettings = {
      for (final entry in _entryPointDefinitions) entry.key: true,
    };

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(communicationsControllerProvider);
      _participantController.text = state.participantId ?? '';
      _syncAiAssistPreference(state);
    });

    ref.listen<CommunicationsViewState>(communicationsControllerProvider, (previous, next) {
      if (previous?.participantId != next.participantId && !_participantFocusNode.hasFocus) {
        _participantController.text = next.participantId ?? '';
      }

      final previousConversationId = previous?.activeConversationId;
      final nextConversationId = next.activeConversationId;
      if (previousConversationId != nextConversationId) {
        _syncAiAssistPreference(next);
        _lastConversationId = nextConversationId;
      }

      final previousMessages = previous?.activeConversation?.messages.length ?? 0;
      final nextMessages = next.activeConversation?.messages.length ?? 0;
      if (nextMessages > previousMessages && nextConversationId != null && previousConversationId == nextConversationId) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_messageScrollController.hasClients) {
            _messageScrollController.animateTo(
              _messageScrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _participantController.dispose();
    _participantFocusNode.dispose();
    _messageController.dispose();
    _messageFocusNode.dispose();
    _messageScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(communicationsControllerProvider);
    final controller = ref.read(communicationsControllerProvider.notifier);
    final participantId = state.participantId;
    final viewerParticipant = state.activeConversation?.participantById(participantId ?? '');
    final aiAssistAvailable = viewerParticipant?.aiAssistEnabled == true && (state.activeConversation?.aiAssistDefault ?? false);
    final conversations = state.conversations;
    final currentRole = ref.watch(currentRoleProvider);
    final hasAccess = _communicationsAllowedRoles.contains(currentRole);
    final allowedRoleNames = _communicationsAllowedRoles.map((role) => role.displayName).join(', ');

    if (_lastConversationId != state.activeConversationId) {
      _syncAiAssistPreference(state);
      _lastConversationId = state.activeConversationId;
    }

    if (!hasAccess) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: Colors.amber.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.amber.shade100.withOpacity(0.6),
                    blurRadius: 20,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Access restricted',
                    style: GoogleFonts.manrope(
                      fontSize: 12,
                      letterSpacing: 4,
                      fontWeight: FontWeight.w600,
                      color: Colors.amber.shade700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Messaging workspace is limited to $allowedRoleNames roles.',
                    style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Switch to an authorised role in your profile to coordinate customer conversations, or request enablement support to join the rollout cohort.',
                    style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _communicationsAllowedRoles
                        .map(
                          (role) => Chip(
                            label: Text(role.displayName, style: GoogleFonts.inter(fontSize: 12)),
                            backgroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                              side: BorderSide(color: Colors.amber.shade100),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      FilledButton(
                        onPressed: () => ref.read(authControllerProvider.notifier).setActiveRole(UserRole.provider),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          backgroundColor: const Color(0xFF1F4ED8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: Text('Switch to provider', style: GoogleFonts.manrope(fontWeight: FontWeight.w600)),
                      ),
                      OutlinedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Email enablement@fixnado.com to request access.',
                                style: GoogleFonts.inter(),
                              ),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          side: BorderSide(color: Colors.amber.shade400),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: Text('Contact enablement', style: GoogleFonts.manrope(fontWeight: FontWeight.w600, color: Colors.amber.shade700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Inbox', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(
              'Coordinate chat, AI assists, and video escalations for your Fixnado teams on the go.',
              style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            _buildParticipantForm(context, state, controller),
            if (state.offline)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.wifi_off, color: Colors.orange.shade900),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Working from cached conversations. Some realtime actions are unavailable until connectivity returns.',
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.orange.shade900),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            if (state.errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  state.errorMessage!,
                  style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.error),
                ),
              ),
            const SizedBox(height: 16),
            _buildEntryPointSection(theme, state, controller),
            const SizedBox(height: 16),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final wideLayout = constraints.maxWidth >= 900;
                  if (!wideLayout) {
                    return Column(
                      children: [
                        Expanded(
                          child: _ConversationListSection(
                            conversations: conversations,
                            activeConversationId: state.activeConversationId,
                            loading: state.listLoading,
                            onRefresh: participantId == null ? null : () => controller.refreshConversations(),
                            onSelect: controller.loadConversation,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: _buildConversationDetail(
                            state,
                            controller,
                            aiAssistAvailable,
                            viewerParticipant,
                            _messageFocusNode,
                          ),
                        ),
                      ],
                    );
                  }
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 320,
                        child: _ConversationListSection(
                          conversations: conversations,
                          activeConversationId: state.activeConversationId,
                          loading: state.listLoading,
                          onRefresh: participantId == null ? null : () => controller.refreshConversations(),
                          onSelect: controller.loadConversation,
                        ),
                      ),
                      const SizedBox(width: 24),
                      Expanded(
                        child: _buildConversationDetail(
                          state,
                          controller,
                          aiAssistAvailable,
                          viewerParticipant,
                          _messageFocusNode,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEntryPointSection(
    ThemeData theme,
    CommunicationsViewState state,
    CommunicationsController controller,
  ) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Entry points', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Switch on the surfaces you want to cover and send a quick hello.',
              style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _entryPointDefinitions
                  .map(
                    (definition) => _EntryPointCard(
                      definition: definition,
                      enabled: _entryPointSettings[definition.key] ?? false,
                      enableTemplate:
                          state.participantId != null && (_entryPointSettings[definition.key] ?? false),
                      onToggle: () => _toggleEntryPoint(definition.key),
                      onUseTemplate: () => _prepareEntryPointTemplate(state, controller, definition.template),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  void _toggleEntryPoint(String key) {
    setState(() {
      final current = _entryPointSettings[key] ?? false;
      _entryPointSettings[key] = !current;
    });
  }

  void _prepareEntryPointTemplate(
    CommunicationsViewState state,
    CommunicationsController controller,
    String template,
  ) {
    if (state.participantId == null) {
      setState(() {
        _composerError = 'Enter a participant before using templates.';
      });
      return;
    }

    if (state.activeConversationId == null) {
      final fallbackConversation = state.conversations.firstOrNull;
      if (fallbackConversation == null) {
        setState(() {
          _composerError = 'Load a participant to sync conversations before messaging.';
        });
        return;
      }
      controller.loadConversation(fallbackConversation.id);
    }

    _applyEntryPointTemplate(template);
  }

  void _applyEntryPointTemplate(String template) {
    setState(() {
      _composerError = null;
      _messageController.text = template;
      _messageController.selection = TextSelection.collapsed(offset: _messageController.text.length);
    });
    _messageFocusNode.requestFocus();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_messageScrollController.hasClients) {
        _messageScrollController.animateTo(
          _messageScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildParticipantForm(
    BuildContext context,
    CommunicationsViewState state,
    CommunicationsController controller,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _participantController,
                focusNode: _participantFocusNode,
                decoration: InputDecoration(
                  labelText: 'Conversation participant ID',
                  suffixIcon: state.listLoading
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                        )
                      : (_participantController.text.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.clear),
                              tooltip: 'Clear participant',
                              onPressed: () {
                                _participantController.clear();
                                controller.setParticipant(null);
                              },
                            )),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (value) {
                  final trimmed = value.trim();
                  controller.setParticipant(trimmed.isEmpty ? null : trimmed);
                },
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: () {
                final trimmed = _participantController.text.trim();
                controller.setParticipant(trimmed.isEmpty ? null : trimmed);
              },
              child: const Text('Load'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Use the participant identifier from booking timelines to sync communications threads.',
          style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      ],
    );
  }

  Widget _buildConversationDetail(
    CommunicationsViewState state,
    CommunicationsController controller,
    bool aiAssistAvailable,
    ConversationParticipantModel? viewerParticipant,
    FocusNode composerFocusNode,
  ) {
    final activeConversation = state.activeConversation;
    if (state.activeConversationId == null) {
      return _EmptyPlaceholder(
        icon: Icons.chat_bubble_outline,
        message: state.participantId == null
            ? 'Enter a participant identifier to pull inbox threads.'
            : 'Select a conversation to inspect transcripts and controls.',
      );
    }

    if (activeConversation == null) {
      if (state.messagesLoading) {
        return const Center(child: CircularProgressIndicator());
      }
      return _EmptyPlaceholder(
        icon: Icons.chat_outlined,
        message: 'Unable to load conversation. Pull to refresh or try again later.',
      );
    }

    final theme = Theme.of(context);
    final metadata = activeConversation.metadata;
    final hasMessages = activeConversation.messages.isNotEmpty;

    return RefreshIndicator(
      onRefresh: () async {
        await controller.loadConversation(activeConversation.id);
      },
      child: CustomScrollView(
        controller: _messageScrollController,
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(activeConversation.subject, style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  activeConversation.participants
                      .where((participant) => participant.role != 'ai_assistant')
                      .map((participant) => '${participant.displayName} (${participant.role})')
                      .join(' • '),
                  style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Chip(
                      label: Text('AI assist ${activeConversation.aiAssistDefault ? 'enabled' : 'disabled'}',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    Chip(
                      label: Text('Retention ${activeConversation.retentionDays} days',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    if (metadata['bookingId'] != null)
                      Chip(
                        label: Text('Booking #${metadata['bookingId']}',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          if (state.messagesLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (!hasMessages)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 48),
                child: _EmptyPlaceholder(
                  icon: Icons.mark_chat_unread_outlined,
                  message: 'No messages yet. Share context so AI assist can apply guardrails.',
                ),
              ),
            )
          else
            SliverList.separated(
              itemCount: activeConversation.messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final message = activeConversation.messages[index];
                final isSelf = message.senderParticipantId == state.participantId;
                return _MessageBubble(
                  message: message,
                  viewerParticipantId: state.participantId,
                  isSelf: isSelf,
                );
              },
            ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: _ParticipantControls(
                participant: viewerParticipant,
                saving: state.preferencesSaving,
                onChange: (updates) => controller.updatePreferences(updates),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: _VideoSessionSection(
              session: state.videoSession,
              onGenerate: controller.createVideoSession,
              enabled: state.participantId != null,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: _MessageComposer(
                controller: _messageController,
                focusNode: composerFocusNode,
                errorText: _composerError,
                onSend: () async {
                  final trimmed = _messageController.text.trim();
                  if (trimmed.isEmpty) {
                    setState(() {
                      _composerError = 'Enter a message before sending.';
                    });
                    return;
                  }
                  setState(() {
                    _composerError = null;
                  });
                  await controller.sendMessage(trimmed, requestAiAssist: aiAssistAvailable && _requestAiAssist);
                  if (mounted) {
                    setState(() {
                      _messageController.clear();
                    });
                  }
                },
                sending: state.messageSending,
                aiAssistAvailable: aiAssistAvailable,
                requestAiAssist: _requestAiAssist && aiAssistAvailable,
                onToggleAiAssist: (value) {
                  setState(() {
                    _requestAiAssist = value;
                  });
                },
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  void _syncAiAssistPreference(CommunicationsViewState state) {
    final participantId = state.participantId;
    if (participantId == null) {
      _requestAiAssist = false;
      return;
    }
    final participant = state.activeConversation?.participantById(participantId);
    final defaultEnabled = participant?.aiAssistEnabled == true && (state.activeConversation?.aiAssistDefault ?? false);
    _requestAiAssist = defaultEnabled;
  }
}

class _ConversationListSection extends StatelessWidget {
  const _ConversationListSection({
    required this.conversations,
    required this.activeConversationId,
    required this.loading,
    required this.onSelect,
    this.onRefresh,
  });

  final List<ConversationModel> conversations;
  final String? activeConversationId;
  final bool loading;
  final void Function(String conversationId) onSelect;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    if (conversations.isEmpty) {
      if (loading) {
        return const Center(child: CircularProgressIndicator());
      }
      final placeholder = Center(
        child: _EmptyPlaceholder(
          icon: Icons.mark_chat_read_outlined,
          message: 'No conversations yet. Load a participant to sync transcripts.',
        ),
      );
      if (onRefresh == null) {
        return placeholder;
      }
      return RefreshIndicator(
        onRefresh: onRefresh!,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 24),
            SizedBox(height: 180, child: placeholder),
          ],
        ),
      );
    }

    final list = ListView.separated(
      physics: onRefresh != null ? const AlwaysScrollableScrollPhysics() : const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 12),
      itemCount: conversations.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final conversation = conversations[index];
        final lastMessage = conversation.messages.isNotEmpty ? conversation.messages.last : null;
        final timestamp = lastMessage?.createdAt;
        return InkWell(
          onTap: () => onSelect(conversation.id),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: activeConversationId == conversation.id
                  ? Theme.of(context).colorScheme.primary.withOpacity(0.08)
                  : Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: activeConversationId == conversation.id
                    ? Theme.of(context).colorScheme.primary.withOpacity(0.4)
                    : Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        conversation.subject,
                        style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (timestamp != null)
                      Text(
                        DateTimeFormatter.relative(timestamp),
                        style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  conversation.participants
                      .where((participant) => participant.role != 'ai_assistant')
                      .map((participant) => participant.displayName)
                      .join(' • '),
                  style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                if (lastMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    lastMessage.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );

    if (onRefresh == null) {
      return list;
    }

    return RefreshIndicator(
      onRefresh: onRefresh!,
      child: list,
    );
  }
}

class _EntryPointCard extends StatelessWidget {
  const _EntryPointCard({
    required this.definition,
    required this.enabled,
    required this.enableTemplate,
    required this.onToggle,
    required this.onUseTemplate,
  });

  final _EntryPointDefinition definition;
  final bool enabled;
  final bool enableTemplate;
  final VoidCallback onToggle;
  final VoidCallback onUseTemplate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = enabled ? const Color(0xFF1F4ED8).withOpacity(0.25) : theme.colorScheme.outlineVariant;
    final background = enabled ? const Color(0xFFF5F8FF) : Colors.white;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
        boxShadow: [
          if (enabled)
            BoxShadow(
              color: const Color(0xFF1F4ED8).withOpacity(0.08),
              blurRadius: 22,
              offset: const Offset(0, 16),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(definition.emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(definition.title, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      definition.tagline,
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Switch.adaptive(
                value: enabled,
                onChanged: (_) => onToggle(),
                activeColor: const Color(0xFF1F4ED8),
              ),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: enableTemplate ? onUseTemplate : null,
            icon: const Icon(Icons.text_snippet_outlined, size: 18),
            label: const Text('Use template'),
            style: OutlinedButton.styleFrom(
              foregroundColor: enableTemplate ? const Color(0xFF1F4ED8) : theme.disabledColor,
              side: BorderSide(
                color: enableTemplate
                    ? const Color(0xFF1F4ED8).withOpacity(0.35)
                    : theme.disabledColor.withOpacity(0.2),
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.viewerParticipantId,
    required this.isSelf,
  });

  final ConversationMessageModel message;
  final String? viewerParticipantId;
  final bool isSelf;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final delivery = message.deliveries.firstWhereOrNull((item) => item.participantId == viewerParticipantId) ??
        message.deliveries.firstWhereOrNull((item) => item.participantId != null);
    final normalisedStatus = delivery == null
        ? null
        : delivery.status == 'suppressed'
            ? 'Muted (${(delivery.suppressedReason ?? 'quiet hours').toUpperCase()})'
            : delivery.status?.toUpperCase();
    final isAssistant = message.messageType == 'assistant';
    final gradient = isAssistant
        ? const LinearGradient(colors: [Color(0xFFF6F8FF), Color(0xFFEEF1FF)])
        : isSelf
            ? const LinearGradient(colors: [Color(0xFFFFFFFF), Color(0xFFE8F2FF)])
            : null;
    final baseColor = gradient == null ? Colors.white : null;
    final borderColor = isAssistant
        ? const Color(0xFF6366F1).withOpacity(0.25)
        : isSelf
            ? const Color(0xFF38BDF8).withOpacity(0.25)
            : theme.colorScheme.outlineVariant;
    final foregroundColor = isAssistant
        ? const Color(0xFF1E1B4B)
        : isSelf
            ? const Color(0xFF082F49)
            : theme.colorScheme.onSurface;

    final alignment = isSelf ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart;

    return Align(
      alignment: alignment,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          color: baseColor,
          gradient: gradient,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: (isAssistant ? const Color(0xFF312E81) : const Color(0xFF0F172A)).withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.body,
              style: GoogleFonts.inter(
                fontSize: 15,
                color: foregroundColor,
                height: 1.55,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 6,
              children: [
                Text(
                  isAssistant
                      ? 'AI Assist'
                      : isSelf
                          ? 'You'
                          : 'Participant',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: foregroundColor.withOpacity(0.75),
                    letterSpacing: 1.8,
                  ),
                ),
                Text(
                  DateFormat.jm().format(message.createdAt.toLocal()),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: foregroundColor.withOpacity(0.6),
                    letterSpacing: 1.8,
                  ),
                ),
                if (normalisedStatus != null)
                  Text(
                    normalisedStatus,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: foregroundColor.withOpacity(0.6),
                      letterSpacing: 1.8,
                    ),
                  ),
                if (message.aiConfidenceScore != null)
                  Text(
                    'Confidence ${(message.aiConfidenceScore! * 100).round()}%',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: foregroundColor.withOpacity(0.6),
                      letterSpacing: 1.8,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ParticipantControls extends StatelessWidget {
  const _ParticipantControls({
    required this.participant,
    required this.saving,
    required this.onChange,
  });

  final ConversationParticipantModel? participant;
  final bool saving;
  final Future<void> Function(Map<String, dynamic> updates) onChange;

  @override
  Widget build(BuildContext context) {
    if (participant == null) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          'Participant is not part of this conversation.',
          style: GoogleFonts.inter(fontSize: 13),
        ),
      );
    }

    Future<void> updateQuietHours(String key, String? value) async {
      await onChange({key: value});
    }

    Future<void> selectTime(String key, String? currentValue) async {
      if (saving) return;
      final initial = _parseTimeOfDay(currentValue) ?? const TimeOfDay(hour: 9, minute: 0);
      final selected = await showTimePicker(context: context, initialTime: initial);
      if (selected != null) {
        final formatted = _formatTimeOfDay(selected);
        await updateQuietHours(key, formatted);
      }
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Notification preferences', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              if (saving)
                const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
          const SizedBox(height: 12),
          SwitchListTile.adaptive(
            value: participant!.notificationsEnabled,
            onChanged: saving ? null : (value) => onChange({'notificationsEnabled': value}),
            title: Text('Enable realtime alerts', style: GoogleFonts.inter(fontSize: 13)),
            dense: true,
            contentPadding: EdgeInsets.zero,
          ),
          SwitchListTile.adaptive(
            value: participant!.aiAssistEnabled,
            onChanged: saving ? null : (value) => onChange({'aiAssistEnabled': value}),
            title: Text('Allow AI follow-ups', style: GoogleFonts.inter(fontSize: 13)),
            dense: true,
            contentPadding: EdgeInsets.zero,
          ),
          SwitchListTile.adaptive(
            value: participant!.videoEnabled,
            onChanged: saving ? null : (value) => onChange({'videoEnabled': value}),
            title: Text('Permit instant video escalation', style: GoogleFonts.inter(fontSize: 13)),
            dense: true,
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuietHoursTile(
                  label: 'Quiet hours start',
                  value: participant!.quietHoursStart,
                  onTap: saving ? null : () => selectTime('quietHoursStart', participant!.quietHoursStart),
                  onClear: saving || participant!.quietHoursStart == null
                      ? null
                      : () => updateQuietHours('quietHoursStart', null),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuietHoursTile(
                  label: 'Quiet hours end',
                  value: participant!.quietHoursEnd,
                  onTap: saving ? null : () => selectTime('quietHoursEnd', participant!.quietHoursEnd),
                  onClear: saving || participant!.quietHoursEnd == null
                      ? null
                      : () => updateQuietHours('quietHoursEnd', null),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Quiet hour suppressions retain audit metadata to evidence consented contact rules.',
            style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  static TimeOfDay? _parseTimeOfDay(String? value) {
    if (value == null || value.isEmpty) return null;
    final parts = value.split(':');
    if (parts.length != 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }

  static String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _QuietHoursTile extends StatelessWidget {
  const _QuietHoursTile({
    required this.label,
    required this.value,
    this.onTap,
    this.onClear,
  });

  final String label;
  final String? value;
  final VoidCallback? onTap;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 4),
                  Text(value ?? 'Not set', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (onClear != null)
              IconButton(
                onPressed: onClear,
                icon: const Icon(Icons.close, size: 16),
                tooltip: 'Clear time',
              ),
          ],
        ),
      ),
    );
  }
}

class _VideoSessionSection extends StatelessWidget {
  const _VideoSessionSection({
    required this.session,
    required this.onGenerate,
    required this.enabled,
  });

  final VideoSessionModel? session;
  final Future<void> Function() onGenerate;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Video escalation', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: enabled
                    ? () async {
                        await onGenerate();
                      }
                    : null,
                icon: const Icon(Icons.videocam_outlined),
                label: const Text('Generate session'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Issue secure tokens that keep chat and call transcripts in sync for audit trails.',
            style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          if (session != null) ...[
            const SizedBox(height: 16),
            _SessionField(label: 'Channel', value: session!.channelName),
            _SessionField(label: 'Expires', value: DateFormat.yMMMd().add_jm().format(session!.expiresAt.toLocal())),
            _SessionField(label: 'Token', value: session!.token, monospaced: true),
          ],
        ],
      ),
    );
  }
}

class _SessionField extends StatelessWidget {
  const _SessionField({required this.label, required this.value, this.monospaced = false});

  final String label;
  final String value;
  final bool monospaced;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(
            value,
            style: monospaced
                ? GoogleFonts.robotoMono(fontSize: 12, color: Theme.of(context).colorScheme.onSurface)
                : GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurface),
          ),
        ],
      ),
    );
  }
}

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({
    required this.controller,
    required this.focusNode,
    required this.onSend,
    required this.sending,
    required this.aiAssistAvailable,
    required this.requestAiAssist,
    required this.onToggleAiAssist,
    this.errorText,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final Future<void> Function() onSend;
  final bool sending;
  final bool aiAssistAvailable;
  final bool requestAiAssist;
  final void Function(bool value) onToggleAiAssist;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: controller,
          focusNode: focusNode,
          maxLines: 5,
          minLines: 3,
          decoration: InputDecoration(
            labelText: 'Compose message',
            errorText: errorText,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (aiAssistAvailable)
              Row(
                children: [
                  Switch.adaptive(value: requestAiAssist, onChanged: sending ? null : onToggleAiAssist),
                  const SizedBox(width: 8),
                  Text('Request AI assist', style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                ],
              )
            else
              Text(
                'AI assist disabled for this participant.',
                style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: sending ? null : onSend,
              icon: sending
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send_outlined),
              label: Text(sending ? 'Sending…' : 'Send message'),
            ),
          ],
        ),
      ],
    );
  }
}

class _EmptyPlaceholder extends StatelessWidget {
  const _EmptyPlaceholder({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(height: 12),
        Text(
          message,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      ],
    );
  }
}
