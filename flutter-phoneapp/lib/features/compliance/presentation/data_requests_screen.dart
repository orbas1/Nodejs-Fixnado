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
  String _warehouseDataset = 'orders';
  String? _warehouseRegion;
  bool _warehouseSubmitting = false;

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
        onRefresh: () async {
          await controller.load(status: state.statusFilter);
          await controller.loadWarehouse(dataset: state.warehouseDatasetFilter);
        },
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
            const SizedBox(height: 16),
            if (state.metricsLoading)
              const Center(child: CircularProgressIndicator())
            else if (state.metrics != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MetricsStrip(metrics: state.metrics!),
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
                        await controller.updateStatus(request.id, status: status);
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
            const SizedBox(height: 32),
            _WarehouseExportsSection(
              dataset: _warehouseDataset,
              regionCode: _warehouseRegion,
              submitting: _warehouseSubmitting,
              state: state,
              onDatasetChanged: (value) => setState(() => _warehouseDataset = value),
              onRegionChanged: (value) => setState(() => _warehouseRegion = value.isEmpty ? null : value),
              onTrigger: () async {
                setState(() => _warehouseSubmitting = true);
                try {
                  await controller.triggerWarehouseExport(
                    _warehouseDataset,
                    regionCode: _warehouseRegion,
                  );
                  setState(() => _statusMessage = 'Warehouse export queued for $_warehouseDataset');
                } catch (_) {
                  setState(() => _statusMessage = 'Unable to trigger warehouse export.');
                } finally {
                  setState(() => _warehouseSubmitting = false);
                }
              },
              onFilterChanged: (dataset) => controller.loadWarehouse(dataset: dataset.isEmpty ? null : dataset),
              onRefresh: () => controller.loadWarehouse(dataset: state.warehouseDatasetFilter),
            ),
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

class _WarehouseExportsSection extends StatelessWidget {
  const _WarehouseExportsSection({
    required this.dataset,
    required this.regionCode,
    required this.submitting,
    required this.state,
    required this.onDatasetChanged,
    required this.onRegionChanged,
    required this.onTrigger,
    required this.onFilterChanged,
    required this.onRefresh,
  });

  final String dataset;
  final String? regionCode;
  final bool submitting;
  final DataRequestsState state;
  final ValueChanged<String> onDatasetChanged;
  final ValueChanged<String> onRegionChanged;
  final VoidCallback onTrigger;
  final ValueChanged<String> onFilterChanged;
  final VoidCallback onRefresh;

  static const _datasetOptions = [
    DropdownMenuItem(value: 'orders', child: Text('Orders & fulfilment')),
    DropdownMenuItem(value: 'finance', child: Text('Finance history')),
    DropdownMenuItem(value: 'communications', child: Text('Communications ledger')),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filterValue = state.warehouseDatasetFilter ?? '';

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
          Text('Warehouse CDC exports', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Trigger incremental exports to keep the analytics warehouse in sync and satisfy audit traceability.',
            style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              SizedBox(
                width: 240,
                child: DropdownButtonFormField<String>(
                  value: dataset,
                  decoration: const InputDecoration(labelText: 'Dataset'),
                  items: _datasetOptions,
                  onChanged: (value) {
                    if (value != null) onDatasetChanged(value);
                  },
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  value: regionCode ?? '',
                  decoration: const InputDecoration(labelText: 'Region scope'),
                  items: const [
                    DropdownMenuItem(value: '', child: Text('Global rollup')),
                    DropdownMenuItem(value: 'GB', child: Text('United Kingdom (GB)')),
                    DropdownMenuItem(value: 'IE', child: Text('Ireland (IE)')),
                    DropdownMenuItem(value: 'AE', child: Text('United Arab Emirates (AE)')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      onRegionChanged(value);
                    }
                  },
                ),
              ),
              ElevatedButton.icon(
                onPressed: submitting ? null : onTrigger,
                icon: submitting
                    ? SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.onPrimary),
                      )
                    : const Icon(Icons.playlist_add_check_rounded, size: 18),
                label: Text(submitting ? 'Triggering…' : 'Trigger export'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: filterValue,
                  decoration: const InputDecoration(labelText: 'Filter dataset'),
                  items: const [
                    DropdownMenuItem(value: '', child: Text('All datasets')),
                    DropdownMenuItem(value: 'orders', child: Text('Orders & fulfilment')),
                    DropdownMenuItem(value: 'finance', child: Text('Finance history')),
                    DropdownMenuItem(value: 'communications', child: Text('Communications ledger')),
                  ],
                  onChanged: (value) {
                    if (value != null) onFilterChanged(value);
                  },
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Refresh'),
              ),
            ],
          ),
          if (state.warehouseError != null) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                state.warehouseError!,
                style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onErrorContainer),
              ),
            ),
          ],
          const SizedBox(height: 16),
          if (state.warehouseLoading)
            const Center(child: Padding(padding: EdgeInsets.symmetric(vertical: 24), child: CircularProgressIndicator()))
          else if (state.warehouseRuns.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'No export runs recorded yet. Trigger an export to capture CDC bundles for compliance evidence.',
                style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            )
          else
            Column(
              children: state.warehouseRuns
                  .map((run) => _WarehouseRunTile(run: run))
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _WarehouseRunTile extends StatelessWidget {
  const _WarehouseRunTile({required this.run});

  final WarehouseExportRun run;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(run.dataset, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
              _StatusBadge(status: run.status),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _InfoChip(label: 'Region', value: run.regionCode ?? 'GLOBAL'),
              _InfoChip(label: 'Rows', value: run.rowCount.toString()),
              if (run.runStartedAt != null)
                _InfoChip(label: 'Started', value: _formatDate(run.runStartedAt!)),
              if (run.runFinishedAt != null)
                _InfoChip(label: 'Completed', value: _formatDate(run.runFinishedAt!)),
            ],
          ),
          if (run.filePath != null) ...[
            const SizedBox(height: 8),
            Text(
              run.filePath!,
              style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
            ),
          ]
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text('$label: $value', style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
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

class _MetricsStrip extends StatelessWidget {
  const _MetricsStrip({required this.metrics});

  final Map<String, dynamic> metrics;

  String _formatNumber(num? value) => (value ?? 0).toInt().toString();

  String _formatDuration(num? minutes) {
    if (minutes == null) {
      return '—';
    }
    final totalMinutes = minutes.toDouble();
    if (totalMinutes >= 60) {
      final hours = totalMinutes / 60;
      return '${hours.toStringAsFixed(hours >= 10 ? 1 : 2)}h';
    }
    if (totalMinutes >= 1) {
      return '${totalMinutes.toStringAsFixed(totalMinutes >= 10 ? 1 : 2)}m';
    }
    return '${(totalMinutes * 60).round()}s';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = metrics['totalRequests'] as num?;
    final completed = (metrics['statusBreakdown'] as Map?)?['completed'] as num?;
    final overdue = metrics['overdueCount'] as num?;
    final dueSoon = metrics['dueSoonCount'] as num?;
    final averageMinutes = metrics['averageCompletionMinutes'] as num?;
    final completionRate = ((metrics['completionRate'] as num?) ?? 0).toDouble() * 100;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _MetricTile(
          label: 'Total requests',
          value: _formatNumber(total ?? 0),
          caption: 'Completed ${_formatNumber(completed ?? 0)}',
          accent: theme.colorScheme.primary,
        ),
        _MetricTile(
          label: 'Overdue',
          value: _formatNumber(overdue ?? 0),
          caption: 'Due soon ${_formatNumber(dueSoon ?? 0)}',
          accent: theme.colorScheme.error,
        ),
        _MetricTile(
          label: 'Avg completion',
          value: _formatDuration(averageMinutes),
          caption: 'Completion ${completionRate.toStringAsFixed(0)}%',
          accent: theme.colorScheme.secondary,
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.caption,
    required this.accent,
  });

  final String label;
  final String value;
  final String caption;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: theme.colorScheme.shadow.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 12)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: accent)),
          const SizedBox(height: 4),
          Text(caption, style: GoogleFonts.inter(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
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
    final isOverdue = request.isOverdue;
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
          if (request.dueAt != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 16,
                  color: isOverdue ? theme.colorScheme.error : theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 6),
                Text(
                  'Due ${_formatDate(request.dueAt!)}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isOverdue ? theme.colorScheme.error : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
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
      'running': theme.colorScheme.primary,
      'pending': theme.colorScheme.outline,
      'succeeded': theme.colorScheme.secondary,
      'failed': theme.colorScheme.error,
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
