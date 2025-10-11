import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/datetime_formatter.dart';
import '../../domain/rental_models.dart';

typedef RentalActionHandler = void Function(String action);

class RentalCard extends StatelessWidget {
  const RentalCard({
    super.key,
    required this.rental,
    this.onAction,
  });

  final RentalAgreementModel rental;
  final RentalActionHandler? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _statusColor(theme, rental.status);

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        rental.status.replaceAll('_', ' ').toUpperCase(),
                        style: GoogleFonts.manrope(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Rental ${rental.rentalNumber}',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Quantity ${rental.quantity} • Deposit ${rental.depositStatus.toUpperCase()}',
                      style: GoogleFonts.inter(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
                const Spacer(),
                if (onAction != null)
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert),
                    onSelected: onAction!,
                    itemBuilder: (context) => _availableActions(rental.status)
                        .map(
                          (action) => PopupMenuItem<String>(
                            value: action,
                            child: Text(_actionLabel(action)),
                          ),
                        )
                        .toList(),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                Chip(
                  avatar: const Icon(Icons.store_mall_directory_outlined, size: 18),
                  label: Text('Company ${rental.companyId.substring(0, 6)}…', style: GoogleFonts.inter(fontSize: 12)),
                ),
                Chip(
                  avatar: const Icon(Icons.person_outline, size: 18),
                  label: Text('Renter ${rental.renterId.substring(0, 6)}…', style: GoogleFonts.inter(fontSize: 12)),
                ),
                if (rental.dailyRate != null)
                  Chip(
                    avatar: const Icon(Icons.payments_outlined, size: 18),
                    label: Text('${CurrencyFormatter.format(rental.dailyRate, currency: rental.rateCurrency ?? 'GBP')} /day', style: GoogleFonts.inter(fontSize: 12)),
                  ),
                if (rental.depositAmount != null)
                  Chip(
                    avatar: const Icon(Icons.savings_outlined, size: 18),
                    label: Text(
                      'Deposit ${CurrencyFormatter.format(rental.depositAmount, currency: rental.depositCurrency ?? 'GBP')}',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _Timeline(timeline: rental.timeline),
          ],
        ),
      ),
    );
  }

  Color _statusColor(ThemeData theme, String status) {
    switch (status) {
      case 'requested':
        return theme.colorScheme.primary;
      case 'approved':
        return const Color(0xFF2563EB);
      case 'pickup_scheduled':
        return const Color(0xFF0EA5E9);
      case 'in_use':
        return const Color(0xFF0F766E);
      case 'return_pending':
        return const Color(0xFFF59E0B);
      case 'inspection_pending':
        return const Color(0xFF7C3AED);
      case 'settled':
        return const Color(0xFF16A34A);
      case 'disputed':
        return const Color(0xFFEA580C);
      case 'cancelled':
        return const Color(0xFF64748B);
      default:
        return theme.colorScheme.primary;
    }
  }

  Iterable<String> _availableActions(String status) {
    switch (status) {
      case 'requested':
        return const ['approve', 'cancel'];
      case 'approved':
        return const ['schedule_pickup', 'checkout', 'cancel'];
      case 'pickup_scheduled':
        return const ['checkout', 'cancel'];
      case 'in_use':
        return const ['mark_returned'];
      case 'inspection_pending':
        return const ['complete_inspection'];
      default:
        return const [];
    }
  }

  String _actionLabel(String action) {
    switch (action) {
      case 'approve':
        return 'Approve rental';
      case 'schedule_pickup':
        return 'Schedule pickup';
      case 'checkout':
        return 'Record checkout';
      case 'mark_returned':
        return 'Mark returned';
      case 'complete_inspection':
        return 'Complete inspection';
      case 'cancel':
        return 'Cancel rental';
      default:
        return action;
    }
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.timeline});

  final List<RentalCheckpointModel> timeline;

  @override
  Widget build(BuildContext context) {
    if (timeline.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text('No activity logged yet.', style: GoogleFonts.inter(fontSize: 13)),
      );
    }

    final sorted = [...timeline]..sort((a, b) => b.occurredAt.compareTo(a.occurredAt));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Activity', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ...sorted.map(
          (checkpoint) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(_checkpointIcon(checkpoint.type), size: 18, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        checkpoint.description,
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${DateTimeFormatter.relative(checkpoint.occurredAt)} • ${checkpoint.recordedByRole}',
                        style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                )
              ],
            ),
          ),
        ),
      ],
    );
  }

  IconData _checkpointIcon(String type) {
    switch (type) {
      case 'status_change':
        return Icons.timeline;
      case 'handover':
        return Icons.handshake_outlined;
      case 'return':
        return Icons.assignment_return_outlined;
      case 'inspection':
        return Icons.fact_check_outlined;
      case 'deposit':
        return Icons.savings_outlined;
      default:
        return Icons.note_outlined;
    }
  }
}
