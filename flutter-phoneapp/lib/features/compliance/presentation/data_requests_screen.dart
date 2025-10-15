import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../domain/data_subject_request.dart';
import 'data_requests_controller.dart';

class DataRequestsScreen extends ConsumerStatefulWidget {
  const DataRequestsScreen({super.key});

  @override
  ConsumerState<DataRequestsScreen> createState() => _DataRequestsScreenState();
}

class _DataRequestsScreenState extends ConsumerState<DataRequestsScreen> {
  final _emailController = TextEditingController();
  final _justificationController = TextEditingController();
  String _requestType = 'access';
  String _regionCode = 'GB';
  String? _submittingId;
  String? _statusMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _justificationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dataRequestsControllerProvider);
    final controller = ref.read(dataRequestsControllerProvider.notifier);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Data governance', style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () => controller.load(status: state.statusFilter),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
          children: [
            _Header(message: _statusMessage),
            const SizedBox(height: 16),
            _RequestForm(
              emailController: _emailController,
              justificationController: _justificationController,
              requestType: _requestType,
              regionCode: _regionCode,
              loading: _submittingId == 'create',
              onRequestTypeChanged: (value) => setState(() => _requestType = value),
              onRegionChanged: (value) => setState(() => _regionCode = value),
              onSubmit: () async {
                setState(() {
                  _statusMessage = null;
                  _submittingId = 'create';
                });
                try {
                  await controller.create(
                    email: _emailController.text.trim(),
                    type: _requestType,
                    justification: _justificationController.text.trim().isEmpty
                        ? null
                        : _justificationController.text.trim(),
                    regionCode: _regionCode,
                  );
                  setState(() {
                    _statusMessage = 'Request captured successfully';
                    _emailController.clear();
                    _justificationController.clear();
                  });
                } catch (_) {
                  setState(() => _statusMessage = 'Unable to submit request. Check connectivity.');
                } finally {
                  setState(() => _submittingId = null);
                }
              },
            ),
            const SizedBox(height: 24),
            _FilterChips(
              active: state.statusFilter,
              onSelected: (value) {
                controller.load(status: value);
              },
            ),
            const SizedBox(height: 16),
            if (state.error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(state.error!, style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onErrorContainer)),
              ),
            if (state.loading && state.requests.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.requests.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Column(
                  children: [
                    Icon(Icons.verified_user_outlined, size: 48, color: theme.colorScheme.primary),
                    const SizedBox(height: 16),
                    Text('No requests yet', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Text('Log data subject requests to build an auditable history and keep regulators satisfied.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(fontSize: 14, color: theme.colorScheme.onSurfaceVariant)),
                  ],
                ),
              )
            else
              ...state.requests.map((request) {
                final isLoading = _submittingId == request.id;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _RequestCard(
                    request: request,
                    loading: isLoading,
                    onExport: request.requestType == 'access'
                        ? () async {
                            setState(() {
                              _submittingId = request.id;
                              _statusMessage = null;
                            });
                            try {
                              await controller.generateExport(request.id);
                              setState(() => _statusMessage = 'Export generated for ${request.subjectEmail}');
                            } catch (_) {
                              setState(() => _statusMessage = 'Unable to generate export. Check connectivity.');
                            } finally {
                              setState(() => _submittingId = null);
                            }
                          }
                        : null,
                    onStatusChange: (status) async {
                      setState(() {
                        _submittingId = request.id;
                        _statusMessage = null;
                      });
                      try {
                        await controller.updateStatus(request.id, status);
                        setState(() => _statusMessage = 'Status updated for ${request.subjectEmail}');
                      } catch (_) {
                        setState(() => _statusMessage = 'Unable to update status. Try again shortly.');
                      } finally {
                        setState(() => _submittingId = null);
                      }
                    },
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Compliance & privacy centre', style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          'Stay ahead of GDPR, DSAR, and residency requirements. Record incoming requests, track fulfilment progress, and export '
          'verifiable audit packs with a tap.',
          style: GoogleFonts.inter(fontSize: 14, height: 1.5, color: theme.colorScheme.onSurfaceVariant),
        ),
        if (message != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(message!, style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSecondaryContainer)),
          ),
        ]
      ],
    );
  }
}

class _RequestForm extends StatelessWidget {
  const _RequestForm({
    required this.emailController,
    required this.justificationController,
    required this.requestType,
    required this.regionCode,
    required this.loading,
    required this.onSubmit,
    required this.onRequestTypeChanged,
    required this.onRegionChanged,
  });

  final TextEditingController emailController;
  final TextEditingController justificationController;
  final String requestType;
  final String regionCode;
  final bool loading;
  final VoidCallback onSubmit;
  final ValueChanged<String> onRequestTypeChanged;
  final ValueChanged<String> onRegionChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: theme.colorScheme.primary.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 12)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Log a data subject request', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          TextField(
            controller: emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            decoration: const InputDecoration(labelText: 'Subject email', hintText: 'privacy.contact@example.com'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: requestType,
            decoration: const InputDecoration(labelText: 'Request type'),
            onChanged: (value) {
              if (value != null) onRequestTypeChanged(value);
            },
            items: const [
              DropdownMenuItem(value: 'access', child: Text('Access / export data')),
              DropdownMenuItem(value: 'erasure', child: Text('Erasure request')),
              DropdownMenuItem(value: 'rectification', child: Text('Rectification')),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: regionCode,
            decoration: const InputDecoration(labelText: 'Region'),
            onChanged: (value) {
              if (value != null) onRegionChanged(value);
            },
            items: const [
              DropdownMenuItem(value: 'GB', child: Text('United Kingdom (GB)')),
              DropdownMenuItem(value: 'IE', child: Text('Ireland (IE)')),
              DropdownMenuItem(value: 'AE', child: Text('United Arab Emirates (AE)')),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: justificationController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Business context',
              hintText: 'Ticket reference, legal basis, or customer notes',
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: loading ? null : onSubmit,
              child: loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Submit request'),
            ),
          )
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({this.active, required this.onSelected});

  final String? active;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filters = <String?>[null, 'received', 'in_progress', 'completed', 'rejected'];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: filters.map((value) {
        final selected = value == active || (value == null && (active == null || active.isEmpty));
        return FilterChip(
          selected: selected,
          showCheckmark: false,
          label: Text(value == null ? 'All' : value.replaceAll('_', ' ')),
          onSelected: (_) => onSelected(value),
          selectedColor: theme.colorScheme.primaryContainer,
          labelStyle: GoogleFonts.inter(fontSize: 13, color: selected ? theme.colorScheme.onPrimaryContainer : null),
        );
      }).toList(),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.request,
    this.loading = false,
    this.onExport,
    required this.onStatusChange,
  });

  final DataSubjectRequest request;
  final bool loading;
  final VoidCallback? onExport;
  final ValueChanged<String> onStatusChange;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: theme.colorScheme.shadow.withOpacity(0.08), blurRadius: 18, offset: const Offset(0, 10)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(request.subjectEmail, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
                  Text(request.requestType.replaceAll('_', ' '),
                      style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
              _StatusBadge(status: request.status),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.public, size: 16, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(request.regionCode ?? 'GB', style: GoogleFonts.inter(fontSize: 13)),
              const SizedBox(width: 16),
              Icon(Icons.schedule, size: 16, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(_formatDate(request.requestedAt), style: GoogleFonts.inter(fontSize: 13)),
            ],
          ),
          if (request.payloadLocation != null) ...[
            const SizedBox(height: 12),
            Text('Export location', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              request.payloadLocation!,
              style: GoogleFonts.robotoMono(fontSize: 12, color: theme.colorScheme.primary),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: request.status,
                  onChanged: loading ? null : (value) {
                    if (value != null) onStatusChange(value);
                  },
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'received', child: Text('Received')),
                    DropdownMenuItem(value: 'in_progress', child: Text('In progress')),
                    DropdownMenuItem(value: 'completed', child: Text('Completed')),
                    DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (onExport != null)
                FilledButton.tonal(
                  onPressed: loading ? null : onExport,
                  child: loading
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Generate export'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = <String, Color>{
      'received': theme.colorScheme.primary,
      'in_progress': theme.colorScheme.tertiary,
      'completed': theme.colorScheme.secondary,
      'rejected': theme.colorScheme.error,
    };
    final color = palette[status] ?? theme.colorScheme.outline;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

String _formatDate(DateTime dateTime) {
  return '${dateTime.day.toString().padLeft(2, '0')} ${_monthNames[dateTime.month - 1]} ${dateTime.year}, '
      '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
}

const _monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
