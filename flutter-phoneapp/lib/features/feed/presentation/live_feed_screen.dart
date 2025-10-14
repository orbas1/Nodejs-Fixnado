import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/datetime_formatter.dart';
import '../../explorer/domain/models.dart';
import '../../explorer/presentation/explorer_controller.dart';
import 'live_feed_controller.dart';
import 'widgets/live_feed_post_card.dart';
import '../domain/live_feed_models.dart';

class LiveFeedScreen extends ConsumerWidget {
  const LiveFeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<LiveFeedViewState>(liveFeedControllerProvider, (previous, next) {
      final controller = ref.read(liveFeedControllerProvider.notifier);
      if (next.actionMessage != null && next.actionMessage != previous?.actionMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.actionMessage!, style: GoogleFonts.inter())),
        );
        controller.clearActionMessage();
      }
    });

    final state = ref.watch(liveFeedControllerProvider);
    final controller = ref.read(liveFeedControllerProvider.notifier);
    final zones = ref.watch(explorerControllerProvider).snapshot?.zones ?? const [];
    final canPublish = state.role == UserRole.customer || state.role == UserRole.enterprise;
    final canBid = state.role == UserRole.serviceman || state.role == UserRole.provider;
    final canMessage = canPublish;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: _Header(
                  state: state,
                  zones: zones.map((zone) => DropdownMenuItem<String?>(
                        value: zone.id,
                        child: Text(zone.name, style: GoogleFonts.inter(fontSize: 14)),
                      ))
                      .toList(),
                  onZoneChanged: controller.selectZone,
                  onIncludeOutOfZone: controller.toggleIncludeOutOfZone,
                  onOutOfZoneOnly: controller.toggleOutOfZoneOnly,
                ),
              ),
            ),
            if (canPublish)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                sliver: SliverToBoxAdapter(
                  child: _JobComposerCard(
                    controller: controller,
                    state: state,
                    zones: zones,
                  ),
                ),
              ),
            if (state.isLoading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(child: CircularProgressIndicator()),
                ),
              )
            else if (state.posts.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 80),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.dynamic_feed_outlined,
                          size: 48, color: Theme.of(context).colorScheme.outline),
                      const SizedBox(height: 12),
                      Text(
                        'No live posts match your filters.',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                sliver: SliverList.separated(
                  itemBuilder: (context, index) {
                    final post = state.posts[index];
                    final bidStatus = state.bidStatuses[post.id] ?? const LiveFeedBidStatus();
                    return Column(
                      children: [
                        LiveFeedPostCard(post: post),
                        if (canBid)
                          _BidActionRow(
                            post: post,
                            status: bidStatus,
                            onSubmit: (request) => controller.submitBid(post.id, request),
                          ),
                        if (canMessage && post.bids.isNotEmpty)
                          _BidConversationList(
                            post: post,
                            statuses: state.messageStatuses,
                            onSend: (bidId, request) => controller.sendBidMessage(post.id, bidId, request),
                          ),
                      ],
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: state.posts.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

class _JobComposerCard extends StatefulWidget {
  const _JobComposerCard({
    required this.controller,
    required this.state,
    required this.zones,
  });

  final LiveFeedController controller;
  final LiveFeedViewState state;
  final List<ZoneSummary> zones;

  @override
  State<_JobComposerCard> createState() => _JobComposerCardState();
}

class _JobComposerCardState extends State<_JobComposerCard> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetAmountController = TextEditingController();
  final _budgetCurrencyController = TextEditingController(text: 'USD');
  final _locationController = TextEditingController();
  String? _zoneId;
  bool _allowOutOfZone = false;
  DateTime? _deadline;
  String? _category;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetAmountController.dispose();
    _budgetCurrencyController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickDeadline(BuildContext context) async {
    final initialDate = _deadline ?? DateTime.now().add(const Duration(days: 1));
    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (date == null) {
      return;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 17, minute: 0),
    );
    setState(() {
      _deadline = DateTime(
        date.year,
        date.month,
        date.day,
        time?.hour ?? 17,
        time?.minute ?? 0,
      );
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final amount = double.tryParse(_budgetAmountController.text.trim());
    final draft = LiveFeedJobDraft(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      budgetAmount: amount,
      budgetCurrency: _budgetCurrencyController.text.trim().isEmpty
          ? null
          : _budgetCurrencyController.text.trim().toUpperCase(),
      budgetLabel: null,
      category: _category,
      location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
      zoneId: _zoneId,
      allowOutOfZone: _allowOutOfZone,
      bidDeadline: _deadline,
    );
    final success = await widget.controller.publishJob(draft);
    if (success) {
      _formKey.currentState!.reset();
      setState(() {
        _zoneId = null;
        _allowOutOfZone = false;
        _deadline = null;
        _category = null;
      });
      _titleController.clear();
      _descriptionController.clear();
      _budgetAmountController.clear();
      _budgetCurrencyController.text = 'USD';
      _locationController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = MaterialLocalizations.of(context);
    return Form(
      key: _formKey,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: theme.colorScheme.surfaceVariant),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Publish a custom job',
              style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Describe the work and alert vetted providers instantly. Escrow and compliance are handled automatically.',
              style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Job title'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Add a title' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Detailed brief'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Add a brief description' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _budgetAmountController,
                    decoration: const InputDecoration(labelText: 'Budget amount'),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 100,
                  child: TextFormField(
                    controller: _budgetCurrencyController,
                    decoration: const InputDecoration(labelText: 'Currency'),
                    textCapitalization: TextCapitalization.characters,
                    maxLength: 3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              value: _category,
              items: const [
                DropdownMenuItem(value: 'Facilities', child: Text('Facilities')),
                DropdownMenuItem(value: 'IT Support', child: Text('IT Support')),
                DropdownMenuItem(value: 'Renovation', child: Text('Renovation')),
                DropdownMenuItem(value: 'Emergency response', child: Text('Emergency response')),
              ],
              onChanged: (value) => setState(() => _category = value),
              decoration: const InputDecoration(labelText: 'Category'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              value: _zoneId,
              onChanged: (value) => setState(() => _zoneId = value),
              decoration: const InputDecoration(labelText: 'Service zone'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Any zone')),
                ...widget.zones.map((zone) => DropdownMenuItem<String?>(
                      value: zone.id,
                      child: Text(zone.name, style: GoogleFonts.inter(fontSize: 14)),
                    )),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(labelText: 'Location (optional)'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickDeadline(context),
                    icon: const Icon(Icons.schedule),
                    label: Text(
                      _deadline == null
                          ? 'Set bid deadline'
                          : '${locale.formatShortDate(_deadline!)} · ${locale.formatTimeOfDay(TimeOfDay.fromDateTime(_deadline!))}',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                FilterChip(
                  selected: _allowOutOfZone,
                  onSelected: (value) => setState(() => _allowOutOfZone = value),
                  label: const Text('Allow out-of-zone bids'),
                ),
              ],
            ),
            if (widget.state.publishError != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  widget.state.publishError!,
                  style: GoogleFonts.inter(color: theme.colorScheme.error, fontSize: 13),
                ),
              ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: widget.state.publishingJob ? null : _submit,
                icon: widget.state.publishingJob
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(widget.state.publishingJob ? 'Publishing…' : 'Publish job'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BidActionRow extends StatelessWidget {
  const _BidActionRow({
    required this.post,
    required this.status,
    required this.onSubmit,
  });

  final LiveFeedPost post;
  final LiveFeedBidStatus status;
  final Future<bool> Function(LiveFeedBidRequest request) onSubmit;

  Future<void> _openSheet(BuildContext context) async {
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _BidComposerSheet(onSubmit: onSubmit, post: post),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilledButton.tonal(
            onPressed: status.loading ? null : () => _openSheet(context),
            child: Text(status.loading ? 'Submitting…' : 'Submit bid'),
          ),
          if (status.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                status.error!,
                style: GoogleFonts.inter(color: theme.colorScheme.error, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _BidConversationList extends StatelessWidget {
  const _BidConversationList({
    required this.post,
    required this.statuses,
    required this.onSend,
  });

  final LiveFeedPost post;
  final Map<String, LiveFeedMessageStatus> statuses;
  final Future<bool> Function(String bidId, LiveFeedMessageRequest request) onSend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: theme.colorScheme.surfaceVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Negotiations', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Track bidder dialogue, share clarifications, and keep the audit trail complete.',
            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          ...post.bids.map((bid) {
            final key = '${post.id}:${bid.id}';
            final status = statuses[key] ?? const LiveFeedMessageStatus();
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _BidConversationCard(
                bid: bid,
                status: status,
                onSend: (request) => onSend(bid.id, request),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _BidConversationCard extends StatefulWidget {
  const _BidConversationCard({required this.bid, required this.status, required this.onSend});

  final LiveFeedBid bid;
  final LiveFeedMessageStatus status;
  final Future<bool> Function(LiveFeedMessageRequest request) onSend;

  @override
  State<_BidConversationCard> createState() => _BidConversationCardState();
}

class _BidConversationCardState extends State<_BidConversationCard> {
  final _messageController = TextEditingController();
  final _linkController = TextEditingController();
  String? _localError;

  @override
  void didUpdateWidget(covariant _BidConversationCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.status.success && !oldWidget.status.success) {
      _messageController.clear();
      _linkController.clear();
    }
    if (widget.status.loading && !oldWidget.status.loading) {
      setState(() => _localError = null);
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_messageController.text.trim().isEmpty) {
      setState(() => _localError = 'Add a short update before sending.');
      return;
    }
    setState(() => _localError = null);
    final attachments = _linkController.text.trim().isEmpty
        ? const <LiveFeedAttachment>[]
        : [LiveFeedAttachment(url: _linkController.text.trim())];
    final request = LiveFeedMessageRequest(
      body: _messageController.text.trim(),
      attachments: attachments,
    );
    final success = await widget.onSend(request);
    if (!mounted) return;
    if (!success && widget.status.error == null) {
      setState(() => _localError = 'Unable to send message. Try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bid = widget.bid;
    final provider = bid.provider?.displayName.isNotEmpty == true ? bid.provider!.displayName : 'Anonymous bidder';
    final amountLabel = bid.amount != null
        ? CurrencyFormatter.format(bid.amount, currency: bid.currency)
        : 'Awaiting amount';
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.surfaceVariant),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(provider, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                    const SizedBox(height: 4),
                    Text(
                      'Status: ${bid.status.toUpperCase()}',
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(amountLabel, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.secondary)),
                  const SizedBox(height: 4),
                  Text(
                    'Submitted ${DateTimeFormatter.relative(bid.submittedAt)}',
                    style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ],
          ),
          if (bid.messages.isNotEmpty) ...[
            const SizedBox(height: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: bid.messages.map((message) {
                final author = message.author?.displayName.isNotEmpty == true
                    ? message.author!.displayName
                    : 'Anonymous';
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.colorScheme.surfaceVariant),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(author, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.primary)),
                          Text(
                            DateTimeFormatter.relative(message.createdAt),
                            style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(message.body, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurface)),
                      if (message.attachments.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: message.attachments
                              .map(
                                (attachment) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surfaceVariant.withOpacity(0.6),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.link, size: 14),
                                      const SizedBox(width: 6),
                                      SelectableText(
                                        attachment.label?.isNotEmpty == true ? attachment.label! : attachment.url,
                                        style: GoogleFonts.inter(fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: _messageController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Send an update',
              hintText: 'Share clarifications, compliance notes, or next steps.',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _linkController,
            decoration: const InputDecoration(
              labelText: 'Reference link (optional)',
              hintText: 'https://files.fixnado.com/compliance.pdf',
            ),
            keyboardType: TextInputType.url,
          ),
          if (_localError != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_localError!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.error)),
            ),
          if (widget.status.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(widget.status.error!, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.error)),
            ),
          if (widget.status.success)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Message sent to bidder.',
                style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.primary),
              ),
            ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.tonal(
              onPressed: widget.status.loading ? null : _submit,
              child: Text(widget.status.loading ? 'Sending…' : 'Send message'),
            ),
          ),
        ],
      ),
    );
  }
}

class _BidComposerSheet extends StatefulWidget {
  const _BidComposerSheet({required this.onSubmit, required this.post});

  final Future<bool> Function(LiveFeedBidRequest request) onSubmit;
  final LiveFeedPost post;

  @override
  State<_BidComposerSheet> createState() => _BidComposerSheetState();
}

class _BidComposerSheetState extends State<_BidComposerSheet> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _currencyController = TextEditingController(text: 'USD');
  final _messageController = TextEditingController();
  final _linkController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    _currencyController.dispose();
    _messageController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting || !_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final amount = double.tryParse(_amountController.text.trim());
    final attachments = _linkController.text.trim().isEmpty
        ? const []
        : [LiveFeedAttachment(url: _linkController.text.trim())];
    final request = LiveFeedBidRequest(
      amount: amount,
      currency: _currencyController.text.trim().isEmpty
          ? null
          : _currencyController.text.trim().toUpperCase(),
      message: _messageController.text.trim(),
      attachments: attachments,
    );
    final success = await widget.onSubmit(request);
    if (!mounted) return;
    if (success) {
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _submitting = false;
        _error = 'Unable to submit bid. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Bid on ${widget.post.title}', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _currencyController,
                decoration: const InputDecoration(labelText: 'Currency'),
                maxLength: 3,
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(labelText: 'Message'),
                minLines: 3,
                maxLines: 5,
                validator: (value) => value == null || value.trim().isEmpty ? 'Add a short message' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _linkController,
                decoration: const InputDecoration(labelText: 'Reference link (optional)'),
                keyboardType: TextInputType.url,
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(_error!, style: GoogleFonts.inter(color: Colors.red, fontSize: 13)),
                ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: Text(_submitting ? 'Submitting…' : 'Send bid'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.state,
    required this.zones,
    required this.onZoneChanged,
    required this.onIncludeOutOfZone,
    required this.onOutOfZoneOnly,
  });

  final LiveFeedViewState state;
  final List<DropdownMenuItem<String?>> zones;
  final ValueChanged<String?> onZoneChanged;
  final ValueChanged<bool> onIncludeOutOfZone;
  final ValueChanged<bool> onOutOfZoneOnly;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Marketplace live feed',
                  style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  'Track verified buyer posts and respond in minutes.',
                  style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
            if (state.lastUpdated != null)
              Text(
                'Updated ${DateTimeFormatter.relative(state.lastUpdated!)}',
                style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String?>(
                    value: state.zoneId,
                    hint: Text('All zones', style: GoogleFonts.inter(fontSize: 14)),
                    items: [
                      DropdownMenuItem<String?>(
                        value: null,
                        child: Text('All zones', style: GoogleFonts.inter(fontSize: 14)),
                      ),
                      ...zones,
                    ],
                    onChanged: onZoneChanged,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Switch(
                      value: state.includeOutOfZone,
                      onChanged: onIncludeOutOfZone,
                    ),
                    const SizedBox(width: 8),
                    Text('Include out-of-zone', style: GoogleFonts.inter(fontSize: 13)),
                  ],
                ),
                Row(
                  children: [
                    Switch(
                      value: state.outOfZoneOnly,
                      onChanged: onOutOfZoneOnly,
                    ),
                    const SizedBox(width: 8),
                    Text('Only out-of-zone', style: GoogleFonts.inter(fontSize: 13)),
                  ],
                ),
              ],
            ),
          ],
        ),
        if (state.offline)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Icon(Icons.signal_wifi_connected_no_internet_4, color: Colors.orange.shade900),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Working from cached feed data. New posts will appear when you reconnect.',
                      style: GoogleFonts.inter(fontSize: 14, color: Colors.orange.shade900),
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (state.errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Text(
              state.errorMessage!,
              style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.error),
            ),
          ),
      ],
    );
  }
}
