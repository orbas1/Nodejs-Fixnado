import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/utils/datetime_formatter.dart';
import '../../explorer/presentation/explorer_controller.dart';
import 'live_feed_controller.dart';
import 'widgets/live_feed_post_card.dart';

class LiveFeedScreen extends ConsumerWidget {
  const LiveFeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(liveFeedControllerProvider);
    final controller = ref.read(liveFeedControllerProvider.notifier);
    final zones = ref.watch(explorerControllerProvider).snapshot?.zones ?? const [];

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
                  itemBuilder: (context, index) => LiveFeedPostCard(post: state.posts[index]),
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
