import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/datetime_formatter.dart';
import '../../../rentals/presentation/rental_controller.dart';
import '../../domain/models.dart';

class ToolHireSheet extends ConsumerStatefulWidget {
  const ToolHireSheet({super.key, required this.item});

  final ExplorerMarketplaceItem item;

  @override
  ConsumerState<ToolHireSheet> createState() => _ToolHireSheetState();
}

class _ToolHireSheetState extends ConsumerState<ToolHireSheet> {
  final _formKey = GlobalKey<FormState>();
  final _renterController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _notesController = TextEditingController();

  DateTime? _start;
  DateTime? _end;
  bool _submitting = false;

  @override
  void dispose() {
    _renterController.dispose();
    _quantityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final theme = Theme.of(context);

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
                  Expanded(
                    child: Text(
                      'Hire ${item.title}',
                      style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Secure equipment rentals with concierge oversight. Confirm renter details and schedule to raise the hire request.',
                style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              Card(
                color: theme.colorScheme.surface,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.title, style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w600)),
                      if (item.description != null && item.description!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            item.description!,
                            style: GoogleFonts.inter(fontSize: 13, height: 1.5),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Chip(
                            avatar: const Icon(Icons.calendar_month_outlined, size: 18),
                            label: Text(item.availability.toUpperCase(), style: GoogleFonts.inter(fontSize: 12)),
                          ),
                          if (item.pricePerDay != null)
                            Chip(
                              avatar: const Icon(Icons.payments_outlined, size: 18),
                              label: Text(
                                '${CurrencyFormatter.format(item.pricePerDay)} per day',
                                style: GoogleFonts.inter(fontSize: 12),
                              ),
                            ),
                          if (item.insuredOnly)
                            Chip(
                              avatar: const Icon(Icons.verified_outlined, size: 18),
                              label: Text('Insured renters only', style: GoogleFonts.inter(fontSize: 12)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _renterController,
                decoration: const InputDecoration(labelText: 'Renter ID'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter renter ID' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _quantityController,
                decoration: const InputDecoration(labelText: 'Quantity'),
                keyboardType: TextInputType.number,
                validator: (value) {
                  final parsed = int.tryParse(value ?? '');
                  if (parsed == null || parsed <= 0) {
                    return 'Enter a valid quantity';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              _DateField(
                label: 'Rental start',
                value: _start,
                onChanged: (value) => setState(() => _start = value),
              ),
              const SizedBox(height: 12),
              _DateField(
                label: 'Return date',
                value: _end,
                onChanged: (value) => setState(() => _end = value),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Notes (optional)'),
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _submitting ? null : _submit,
                  icon: _submitting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send_outlined),
                  label: Text(_submitting ? 'Submitting...' : 'Send hire request'),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_start != null && _end != null && _end!.isBefore(_start!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Return date must be after the start date.')),
      );
      return;
    }

    final notes = _notesController.text.trim();
    final quantity = int.parse(_quantityController.text.trim());

    setState(() => _submitting = true);
    try {
      await ref.read(rentalControllerProvider.notifier).requestRental(
            itemId: widget.item.id,
            marketplaceItemId: widget.item.id,
            renterId: _renterController.text.trim(),
            quantity: quantity,
            rentalStart: _start,
            rentalEnd: _end,
            notes: notes.isEmpty ? null : notes,
          );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Hire request for ${widget.item.title} submitted.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to submit request: $error')),
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
    final theme = Theme.of(context);
    final display = value == null ? 'Select date' : DateTimeFormatter.full(value!.toLocal());

    return OutlinedButton(
      onPressed: () async {
        final selected = await _pickDateTime(context, value, label);
        onChanged(selected);
      },
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        alignment: Alignment.centerLeft,
        backgroundColor: theme.colorScheme.surface,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$label: $display', style: GoogleFonts.inter(fontSize: 14)),
          const Icon(Icons.calendar_today_outlined),
        ],
      ),
    );
  }

  Future<DateTime?> _pickDateTime(BuildContext context, DateTime? initialValue, String label) async {
    final now = DateTime.now();
    final initial = initialValue?.toLocal() ?? now;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
      helpText: label,
    );
    if (date == null) {
      return initialValue;
    }

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
      helpText: label,
    );

    if (time == null) {
      return DateTime(date.year, date.month, date.day).toUtc();
    }

    final selected = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    return selected.toUtc();
  }
}
