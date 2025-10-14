import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class ServicemanSummaryCard extends StatelessWidget {
  const ServicemanSummaryCard({
    super.key,
    required this.metadata,
    this.windowLabel,
  });

  final Map<String, dynamic> metadata;
  final String? windowLabel;

  Map<String, dynamic> _mapFrom(Object? input) {
    if (input is Map<String, dynamic>) {
      return input;
    }
    if (input is Map) {
      return Map<String, dynamic>.from(input as Map);
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _listOfMaps(Object? input) {
    if (input is List<Map<String, dynamic>>) {
      return input;
    }
    if (input is List) {
      return input
          .whereType<Map>()
          .map((raw) => Map<String, dynamic>.from(raw as Map))
          .toList();
    }
    return <Map<String, dynamic>>[];
  }

  @override
  Widget build(BuildContext context) {
    final totals = _mapFrom(metadata['totals']);
    final crewLead = metadata['crewLead'] ?? metadata['crewMember'] ?? (metadata['crew'] is List && (metadata['crew'] as List).isNotEmpty
        ? (metadata['crew'] as List).first
        : null);
    final crew = _listOfMaps(metadata['crew']);
    final region = metadata['region'] as String? ?? 'Multi-zone coverage';
    final velocity = _mapFrom(metadata['velocity']);
    final weekly = _listOfMaps(velocity['weekly']);

    final numberFormatter = NumberFormat.compact();
    final currencyFormatter = NumberFormat.compactCurrency(locale: 'en_GB', symbol: '£');

    int _intFrom(dynamic value) => (value is num) ? value.round() : int.tryParse('$value') ?? 0;

    final completed = _intFrom(totals['completed']);
    final inProgress = _intFrom(totals['inProgress']);
    final scheduled = _intFrom(totals['scheduled']);
    final revenue = totals['revenue'] is num ? (totals['revenue'] as num).toDouble() : double.tryParse('${totals['revenue']}') ?? 0;
    final autoMatched = _intFrom(totals['autoMatched']);
    final adsSourced = _intFrom(totals['adsSourced']);
    final active = inProgress + scheduled;

    final travelMinutes = totals['travelMinutes'] is num
        ? (totals['travelMinutes'] as num).toDouble()
        : (velocity['travelMinutes'] is num ? (velocity['travelMinutes'] as num).toDouble() : 0);
    final previousTravel = velocity['previousTravelMinutes'] is num
        ? (velocity['previousTravelMinutes'] as num).toDouble()
        : travelMinutes;
    final travelDelta = travelMinutes - previousTravel;

    final crewLeadMap = _mapFrom(crewLead);
    final crewLeadName = crewLeadMap['name'] as String? ?? 'Crew readiness';
    final crewLeadRole = crewLeadMap['role'] as String? ?? 'Field technician';

    final weeklyTotals =
        weekly.map((entry) => _intFrom(entry['accepted']) + _intFrom(entry['autoMatches'])).toList(growable: false);
    final maxWeekly = weeklyTotals.isEmpty ? 1 : weeklyTotals.reduce(math.max).clamp(1, double.infinity).toDouble();

    final travelCopy = travelDelta == 0
        ? 'Travel buffer holding steady'
        : travelDelta < 0
            ? '${travelDelta.abs().toStringAsFixed(0)}m faster vs prior window'
            : '${travelDelta.toStringAsFixed(0)}m slower vs prior window';

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < 640;
        final travelColor = travelDelta <= 0 ? const Color(0xFF34D399) : const Color(0xFFF59E0B);
        final visibleCrew = crew.take(4).toList(growable: false);

        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0B1D3A), Color(0xFF091226)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.all(Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  Chip(
                    label: const Text('Crew performance'),
                    labelStyle: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.8,
                    ),
                    side: const BorderSide(color: Color(0xFF1F4ED8)),
                    backgroundColor: const Color(0x331F4ED8),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  if (windowLabel != null && windowLabel!.isNotEmpty)
                    Chip(
                      label: Text(windowLabel!),
                      labelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                      backgroundColor: const Color(0x33235abf),
                      side: const BorderSide(color: Color(0x44235abf)),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                crewLeadName,
                style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                '$crewLeadRole • $region',
                style: GoogleFonts.inter(fontSize: 14, color: Colors.white.withOpacity(0.74)),
              ),
              const SizedBox(height: 12),
              Text(
                'Maintain on-time arrivals, compliance checks, and automation wins across every dispatch.',
                style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.62)),
              ),
              const SizedBox(height: 28),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  _MetricPill(
                    label: 'Completed assignments',
                    value: numberFormatter.format(completed),
                  ),
                  _MetricPill(
                    label: 'Active window load',
                    value: numberFormatter.format(active),
                    helper: '${numberFormatter.format(scheduled)} scheduled • ${numberFormatter.format(inProgress)} in progress',
                  ),
                  _MetricPill(
                    label: 'Commission earned',
                    value: currencyFormatter.format(revenue),
                    helper: '${numberFormatter.format(autoMatched)} auto-matched • ${numberFormatter.format(adsSourced)} via Fixnado Ads',
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Flex(
                direction: isCompact ? Axis.vertical : Axis.horizontal,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Flexible(
                    flex: isCompact ? 1 : 2,
                    fit: isCompact ? FlexFit.loose : FlexFit.tight,
                    child: Container(
                      margin: EdgeInsets.only(right: isCompact ? 0 : 20, bottom: isCompact ? 20 : 0),
                      decoration: BoxDecoration(
                        color: const Color(0x1AF5F5F5),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0x332F4E87)),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Crew roster', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
                                  const SizedBox(height: 6),
                                  Text('Top performers in the current analytics window.',
                                      style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.65))),
                                ],
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(color: travelColor.withOpacity(0.4)),
                                  color: travelColor.withOpacity(0.12),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                child: Text(
                                  travelCopy,
                                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: travelColor),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          if (visibleCrew.isEmpty)
                            Text('No crew assignments recorded in this window.',
                                style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.65)))
                          else
                            Column(
                              children: visibleCrew.map((member) {
                                final record = _mapFrom(member);
                                final name = record['name'] as String? ?? 'Crew member';
                                final role = record['role'] as String? ?? 'Field technician';
                                final completedJobs = numberFormatter.format(_intFrom(record['completed']));
                                final activeJobs = numberFormatter.format(_intFrom(record['active']));
                                final totalJobs = numberFormatter.format(_intFrom(record['assignments']));

                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(name,
                                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                                                const SizedBox(height: 4),
                                                Text(role.toUpperCase(),
                                                    style: GoogleFonts.inter(
                                                      fontSize: 11,
                                                      letterSpacing: 1.8,
                                                      color: Colors.white.withOpacity(0.55),
                                                    )),
                                              ],
                                            ),
                                          ),
                                          Wrap(
                                            spacing: 8,
                                            runSpacing: 8,
                                            children: [
                                              _CrewStatChip(label: '$completedJobs completed', color: const Color(0xFF34D399)),
                                              _CrewStatChip(label: '$activeJobs active', color: const Color(0xFF1F4ED8)),
                                              _CrewStatChip(label: '$totalJobs total', color: Colors.white70),
                                            ],
                                          ),
                                        ],
                                      ),
                                      if (visibleCrew.last != member)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 12),
                                          child: Container(height: 1, color: Colors.white.withOpacity(0.08)),
                                        ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                        ],
                      ),
                    ),
                  ),
                  Flexible(
                    flex: 1,
                    fit: isCompact ? FlexFit.loose : FlexFit.tight,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0x1AF5F5F5),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0x332F4E87)),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Velocity signals',
                              style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
                          const SizedBox(height: 6),
                          Text('Weekly acceptances and automation wins.',
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.65))),
                          const SizedBox(height: 20),
                          if (weekly.isEmpty)
                            Text('No velocity telemetry for this window.',
                                style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.65)))
                          else
                            SizedBox(
                              height: 140,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  for (var i = 0; i < weekly.length; i++)
                                    Expanded(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Container(
                                            height: 10 + (108 * (weeklyTotals[i] / maxWeekly)),
                                            decoration: BoxDecoration(
                                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                              gradient: const LinearGradient(
                                                colors: [Color(0xFF1F4ED8), Color(0xFF34D399)],
                                                begin: Alignment.bottomCenter,
                                                end: Alignment.topCenter,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            weekly[i]['label']?.toString().toUpperCase() ?? 'W',
                                            style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withOpacity(0.6), letterSpacing: 1.6),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${weeklyTotals[i]} jobs',
                                            style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withOpacity(0.55)),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          const SizedBox(height: 16),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0x331F2A40),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0x332F4E87)),
                            ),
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Average travel buffer ${travelMinutes.toStringAsFixed(0)} minutes',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.85))),
                                const SizedBox(height: 6),
                                Text('$autoMatched auto-matched • $adsSourced via Fixnado Ads',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withOpacity(0.65))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.value,
    this.helper,
  });

  final String label;
  final String value;
  final String? helper;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 160, maxWidth: 240),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: GoogleFonts.ibmPlexMono(fontSize: 24, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 8),
          Text(label.toUpperCase(),
              style: GoogleFonts.inter(fontSize: 11, letterSpacing: 1.8, color: Colors.white.withOpacity(0.6))),
          if (helper != null) ...[
            const SizedBox(height: 6),
            Text(helper!, style: GoogleFonts.inter(fontSize: 11, color: Colors.white.withOpacity(0.5))),
          ]
        ],
      ),
    );
  }
}

class _CrewStatChip extends StatelessWidget {
  const _CrewStatChip({
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Text(
        label,
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color.withOpacity(0.9)),
      ),
    );
  }
}
