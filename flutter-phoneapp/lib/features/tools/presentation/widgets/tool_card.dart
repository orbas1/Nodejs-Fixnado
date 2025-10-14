import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/tool_models.dart';

class ToolCard extends StatelessWidget {
  const ToolCard({
    super.key,
    required this.tool,
    required this.onReserve,
    required this.onTelemetry,
  });

  final ToolInventoryItem tool;
  final VoidCallback onReserve;
  final VoidCallback onTelemetry;

  Color _toneColor(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    switch (tool.status.tone) {
      case 'success':
        return scheme.primary;
      case 'warning':
        return Colors.orange.shade700;
      case 'danger':
        return Colors.red.shade600;
      default:
        return scheme.onSurfaceVariant;
    }
  }

  Color _chipBackground(BuildContext context) {
    switch (tool.status.tone) {
      case 'success':
        return Colors.green.shade50;
      case 'warning':
        return Colors.orange.shade50;
      case 'danger':
        return Colors.red.shade50;
      default:
        return Theme.of(context).colorScheme.surfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: scheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tool.category.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        letterSpacing: 2.8,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurfaceVariant,
                      )),
                  const SizedBox(height: 6),
                  Text(
                    tool.name,
                    style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: scheme.primary),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _chipBackground(context),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: _toneColor(context).withOpacity(0.4)),
                ),
                child: Text(
                  tool.status.label,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    letterSpacing: 1.8,
                    fontWeight: FontWeight.w600,
                    color: _toneColor(context),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            tool.description,
            style: GoogleFonts.inter(fontSize: 14, height: 1.4, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _MetricTile(
                  label: 'Availability',
                  value: '${(tool.availability * 100).round()}%',
                  progress: tool.availability,
                  scheme: scheme,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _MetricTile(
                  label: 'Utilisation',
                  value: '${(tool.utilisation * 100).round()}%',
                  progress: tool.utilisation,
                  scheme: scheme,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _Badge(label: tool.rentalLabel, scheme: scheme),
              _Badge(label: 'Next service ${tool.nextServiceLabel}', scheme: scheme),
              _Badge(label: tool.depot, scheme: scheme),
              for (final compliance in tool.compliance)
                _Badge(label: compliance.toUpperCase(), scheme: scheme, outlined: true),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: onReserve,
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Reserve'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: onTelemetry,
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Telemetry'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.progress,
    required this.scheme,
  });

  final String label;
  final String value;
  final double progress;
  final ColorScheme scheme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: progress.clamp(0, 1),
          backgroundColor: scheme.surfaceVariant,
          valueColor: AlwaysStoppedAnimation<Color>(scheme.primary),
          minHeight: 6,
          borderRadius: BorderRadius.circular(999),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: scheme.primary),
        ),
      ],
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.scheme,
    this.outlined = false,
  });

  final String label;
  final ColorScheme scheme;
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: outlined ? scheme.surface : scheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: outlined ? scheme.outlineVariant : Colors.transparent),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          letterSpacing: 1.4,
          fontWeight: FontWeight.w600,
          color: outlined ? scheme.onSurfaceVariant : scheme.primary,
        ),
      ),
    );
  }
}
