import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../domain/calendar_models.dart';

class CalendarEventForm extends StatefulWidget {
  const CalendarEventForm({required this.initialEvent, super.key});

  final CalendarEvent initialEvent;

  @override
  State<CalendarEventForm> createState() => _CalendarEventFormState();
}

class _CalendarEventFormState extends State<CalendarEventForm> {
  late CalendarEventStatus _status;
  late DateTime _start;
  late DateTime _end;
  late List<String> _attendees;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _meetingLinkController = TextEditingController();
  final _coverImageController = TextEditingController();
  final _notesController = TextEditingController();
  final _attendeeInputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final event = widget.initialEvent;
    _status = event.status;
    _start = event.start;
    _end = event.end;
    _attendees = List<String>.from(event.attendees);
    _titleController.text = event.title;
    _descriptionController.text = event.description;
    _locationController.text = event.location;
    _meetingLinkController.text = event.meetingLink ?? '';
    _coverImageController.text = event.coverImageUrl ?? '';
    _notesController.text = event.notes ?? '';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _meetingLinkController.dispose();
    _coverImageController.dispose();
    _notesController.dispose();
    _attendeeInputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final dateFormatter = DateFormat('EEE d MMM');
    final timeFormatter = DateFormat.jm();

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    color: theme.colorScheme.outlineVariant,
                  ),
                ),
              ),
              Text('Schedule engagement',
                  style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'Send invites, add mobilisation context and confirm the command cadence in one step.',
                style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Add a descriptive title' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _DateField(
                      label: 'Start',
                      dateLabel: dateFormatter.format(_start),
                      timeLabel: timeFormatter.format(_start),
                      onPickDate: () => _pickDate(context, isStart: true),
                      onPickTime: () => _pickTime(context, isStart: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DateField(
                      label: 'End',
                      dateLabel: dateFormatter.format(_end),
                      timeLabel: timeFormatter.format(_end),
                      onPickDate: () => _pickDate(context, isStart: false),
                      onPickTime: () => _pickTime(context, isStart: false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<CalendarEventStatus>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: CalendarEventStatus.values
                    .map(
                      (status) => DropdownMenuItem(
                        value: status,
                        child: Text(status.label),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _status = value ?? _status),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _meetingLinkController,
                decoration: const InputDecoration(labelText: 'Video conference URL (optional)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _coverImageController,
                decoration: const InputDecoration(labelText: 'Cover image URL (optional)'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Notes for onsite team (optional)'),
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              Text('Attendees', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _attendees
                    .map(
                      (attendee) => InputChip(
                        avatar: const Icon(Icons.person_outline, size: 16),
                        label: Text(attendee, style: GoogleFonts.inter(fontSize: 12)),
                        onDeleted: () => setState(() => _attendees.remove(attendee)),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _attendeeInputController,
                      decoration: const InputDecoration(hintText: 'Add attendee email'),
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _appendAttendee,
                    child: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _handleSubmit,
                icon: const Icon(Icons.check_circle_outline),
                label: Text(widget.initialEvent.id.isEmpty ? 'Create event' : 'Update event'),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const Icon(Icons.close),
                label: const Text('Close'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _appendAttendee() {
    final value = _attendeeInputController.text.trim();
    if (value.isEmpty) {
      return;
    }
    setState(() {
      _attendees = {..._attendees, value}.toList();
      _attendeeInputController.clear();
    });
  }

  Future<void> _pickDate(BuildContext context, {required bool isStart}) async {
    final initial = isStart ? _start : _end;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _start = DateTime(picked.year, picked.month, picked.day, _start.hour, _start.minute);
        if (_end.isBefore(_start)) {
          _end = _start.add(const Duration(hours: 1));
        }
      } else {
        _end = DateTime(picked.year, picked.month, picked.day, _end.hour, _end.minute);
        if (_end.isBefore(_start)) {
          _start = _end.subtract(const Duration(hours: 1));
        }
      }
    });
  }

  Future<void> _pickTime(BuildContext context, {required bool isStart}) async {
    final initial = TimeOfDay.fromDateTime(isStart ? _start : _end);
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked == null) return;
    setState(() {
      final reference = isStart ? _start : _end;
      final next = DateTime(reference.year, reference.month, reference.day, picked.hour, picked.minute);
      if (isStart) {
        _start = next;
        if (_end.isBefore(_start)) {
          _end = _start.add(const Duration(hours: 1));
        }
      } else {
        _end = next;
        if (_end.isBefore(_start)) {
          _start = _end.subtract(const Duration(hours: 1));
        }
      }
    });
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final event = widget.initialEvent.copyWith(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      location: _locationController.text.trim(),
      start: _start,
      end: _end,
      attendees: List<String>.from(_attendees),
      meetingLink: _meetingLinkController.text.trim().isEmpty ? null : _meetingLinkController.text.trim(),
      coverImageUrl: _coverImageController.text.trim().isEmpty ? null : _coverImageController.text.trim(),
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      status: _status,
    );
    Navigator.of(context).pop(event);
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.dateLabel,
    required this.timeLabel,
    required this.onPickDate,
    required this.onPickTime,
  });

  final String label;
  final String dateLabel;
  final String timeLabel;
  final VoidCallback onPickDate;
  final VoidCallback onPickTime;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: TextButton.icon(
                  onPressed: onPickDate,
                  icon: const Icon(Icons.event_available_outlined),
                  label: Text(dateLabel),
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12)),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: TextButton.icon(
                  onPressed: onPickTime,
                  icon: const Icon(Icons.schedule_outlined),
                  label: Text(timeLabel),
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
