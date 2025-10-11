import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../auth/domain/user_role.dart';
import '../../explorer/domain/models.dart';
import '../../explorer/presentation/explorer_controller.dart';
import '../domain/rental_models.dart';
import 'rental_controller.dart';
import 'widgets/rental_card.dart';

class RentalScreen extends ConsumerWidget {
  const RentalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(rentalControllerProvider);
    final controller = ref.read(rentalControllerProvider.notifier);
    final List<ZoneSummary> zones = ref.watch(explorerControllerProvider).snapshot?.zones ?? const [];

    return Scaffold(
      floatingActionButton: state.role == UserRole.customer
          ? FloatingActionButton.extended(
              onPressed: () => _openCreationSheet(context, ref, zones),
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Request rental'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () async => controller.refresh(),
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Rental agreements', style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w700)),
                        if (state.lastUpdated != null)
                          Text(
                            'Updated ${DateTimeFormatter.relative(state.lastUpdated!)}',
                            style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _statusChip(context, ref, state, 'all', 'All'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'requested', 'Requested'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'approved', 'Approved'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'pickup_scheduled', 'Pickup scheduled'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'in_use', 'In use'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'inspection_pending', 'Inspection'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'settled', 'Settled'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'disputed', 'Disputed'),
                          const SizedBox(width: 12),
                          _statusChip(context, ref, state, 'cancelled', 'Cancelled'),
                        ],
                      ),
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
                              Icon(Icons.offline_pin, color: Colors.orange.shade900),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Showing cached rental timeline. Updates will resume when you reconnect.',
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
                          style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                  ],
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
            else if (state.filteredRentals.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 80),
                  child: Column(
                    children: [
                      Icon(Icons.inventory_outlined, size: 48, color: Theme.of(context).colorScheme.outline),
                      const SizedBox(height: 12),
                      Text(
                        'No rentals match your filters.',
                        style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
                sliver: SliverList.separated(
                  itemBuilder: (context, index) {
                    final rental = state.filteredRentals[index];
                    return RentalCard(
                      rental: rental,
                      onAction: state.offline ? null : (action) => _handleAction(context, ref, rental, action),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemCount: state.filteredRentals.length,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(BuildContext context, WidgetRef ref, RentalViewState state, String value, String label) {
    final controller = ref.read(rentalControllerProvider.notifier);
    final selected = state.statusFilter == value;
    return FilterChip(
      label: Text(label, style: GoogleFonts.inter(fontSize: 14)),
      selected: selected,
      onSelected: (_) => controller.updateStatusFilter(value),
      showCheckmark: false,
      backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
      selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.16),
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
        color: selected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurface,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    );
  }

  Future<void> _handleAction(BuildContext context, WidgetRef ref, RentalAgreementModel rental, String action) async {
    final controller = ref.read(rentalControllerProvider.notifier);
    try {
      switch (action) {
        case 'approve':
          await controller.approve(rental.id, actorId: rental.companyId);
          break;
        case 'schedule_pickup':
          final pickup = await _pickDateTime(context, label: 'Pickup date & time');
          if (pickup == null) return;
          final due = await _pickDateTime(context, label: 'Return due');
          if (due == null) return;
          await controller.schedulePickup(rental.id, pickupAt: pickup, returnDueAt: due, actorId: rental.companyId);
          break;
        case 'checkout':
          final start = await _pickDateTime(context, label: 'Rental start');
          await controller.checkout(rental.id, actorId: rental.companyId, startAt: start);
          break;
        case 'mark_returned':
          final returnedAt = await _pickDateTime(context, label: 'Returned at');
          await controller.markReturned(rental.id, actorId: rental.renterId, returnedAt: returnedAt);
          break;
        case 'complete_inspection':
          final outcome = await _pickInspectionOutcome(context);
          if (outcome == null) return;
          await controller.completeInspection(rental.id, actorId: rental.companyId, outcome: outcome);
          break;
        case 'cancel':
          final reason = await _promptText(context, title: 'Cancellation reason', hint: 'Enter reason');
          await controller.cancel(rental.id, actorId: rental.companyId, reason: reason);
          break;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Rental ${rental.rentalNumber} updated.')),
      );
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: $error')),
      );
    }
  }

  Future<DateTime?> _pickDateTime(BuildContext context, {required String label}) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
      helpText: label,
    );
    if (date == null) {
      return null;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(now),
      helpText: label,
    );
    if (time == null) {
      return null;
    }
    return DateTime(date.year, date.month, date.day, time.hour, time.minute).toUtc();
  }

  Future<String?> _pickInspectionOutcome(BuildContext context) async {
    return showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Inspection outcome'),
        children: [
          SimpleDialogOption(
            onPressed: () => Navigator.of(context).pop('clear'),
            child: const Text('Clear'),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.of(context).pop('damaged'),
            child: const Text('Damaged'),
          ),
          SimpleDialogOption(
            onPressed: () => Navigator.of(context).pop('partial'),
            child: const Text('Partial'),
          ),
        ],
      ),
    );
  }

  Future<String?> _promptText(BuildContext context, {required String title, String? hint}) async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(hintText: hint),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.of(context).pop(controller.text.trim()), child: const Text('Submit')),
        ],
      ),
    );
    controller.dispose();
    return result;
  }

  Future<void> _openCreationSheet(BuildContext context, WidgetRef ref, List<ZoneSummary> zones) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => RentalCreationSheet(zones: zones),
    );
  }
}

class RentalCreationSheet extends ConsumerStatefulWidget {
  const RentalCreationSheet({super.key, required this.zones});

  final List<ZoneSummary> zones;

  @override
  ConsumerState<RentalCreationSheet> createState() => _RentalCreationSheetState();
}

class _RentalCreationSheetState extends ConsumerState<RentalCreationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _itemController = TextEditingController();
  final _renterController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  DateTime? _start;
  DateTime? _end;
  bool _submitting = false;

  @override
  void dispose() {
    _itemController.dispose();
    _renterController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: MediaQuery.of(context).viewInsets,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Request rental', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700)),
                  IconButton(onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _itemController,
                decoration: const InputDecoration(labelText: 'Inventory item ID'),
                validator: (value) => value == null || value.isEmpty ? 'Enter an item ID' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _renterController,
                decoration: const InputDecoration(labelText: 'Renter ID'),
                validator: (value) => value == null || value.isEmpty ? 'Enter renter ID' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Quantity'),
                validator: (value) => value == null || int.tryParse(value) == null || int.parse(value) <= 0 ? 'Enter quantity' : null,
              ),
              const SizedBox(height: 12),
              _DateField(label: 'Desired start', value: _start, onChanged: (value) => setState(() => _start = value)),
              const SizedBox(height: 12),
              _DateField(label: 'Desired end', value: _end, onChanged: (value) => setState(() => _end = value)),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : () => _submit(ref),
                  child: _submitting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit request'),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(WidgetRef ref) async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_end != null && _start != null && _end!.isBefore(_start!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('End date must follow start date.')));
      return;
    }

    setState(() => _submitting = true);
    try {
      final request = ref.read(rentalControllerProvider.notifier);
      await request.requestRental(
        itemId: _itemController.text.trim(),
        renterId: _renterController.text.trim(),
        quantity: int.parse(_quantityController.text.trim()),
        rentalStart: _start,
        rentalEnd: _end,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rental request submitted.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Request failed: $error')),
      );
      setState(() => _submitting = false);
    }
  }
}

class _DateField extends StatelessWidget {
  const _DateField({required this.label, required this.value, required this.onChanged});

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  @override
  Widget build(BuildContext context) {
    final display = value == null ? 'Select date' : DateTimeFormatter.full(value!.toLocal());
    return OutlinedButton(
      onPressed: () async {
        final now = DateTime.now();
        final date = await showDatePicker(
          context: context,
          initialDate: value?.toLocal() ?? now,
          firstDate: now.subtract(const Duration(days: 1)),
          lastDate: now.add(const Duration(days: 365)),
          helpText: label,
        );
        if (date == null) {
          return;
        }
        final initialLocal = value?.toLocal() ?? DateTime(date.year, date.month, date.day, 9, 0);
        final time = await showTimePicker(
          context: context,
          initialTime: TimeOfDay.fromDateTime(initialLocal),
          helpText: label,
        );
        if (time == null) {
          onChanged(DateTime(date.year, date.month, date.day).toUtc());
          return;
        }
        final selected = DateTime(date.year, date.month, date.day, time.hour, time.minute);
        onChanged(selected.toUtc());
      },
      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), alignment: Alignment.centerLeft),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$label: $display', style: GoogleFonts.inter(fontSize: 14)),
          const Icon(Icons.calendar_month_outlined),
        ],
      ),
    );
  }
}
