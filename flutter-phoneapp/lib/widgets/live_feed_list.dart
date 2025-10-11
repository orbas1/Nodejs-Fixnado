import 'package:flutter/material.dart';

class LiveFeedItem {
  const LiveFeedItem({
    required this.title,
    required this.location,
    required this.budget,
    this.responseSla = 'Respond within 2 hours',
    this.highPriority = false,
  });

  final String title;
  final String location;
  final String budget;
  final String responseSla;
  final bool highPriority;
}

class LiveFeedList extends StatelessWidget {
  const LiveFeedList({
    super.key,
    this.items = defaultItems,
    this.isLoading = false,
    this.emptyStateMessage = 'No live jobs published in your territory yet.',
    this.onRetry,
  });

  final List<LiveFeedItem> items;
  final bool isLoading;
  final String emptyStateMessage;
  final VoidCallback? onRetry;

  static const List<LiveFeedItem> defaultItems = [
    LiveFeedItem(
      title: 'Emergency plumbing fix required',
      location: 'Manchester, UK',
      budget: '£180 call-out',
      responseSla: 'Dispatch within 45 minutes',
      highPriority: true,
    ),
    LiveFeedItem(
      title: 'Assemble pop-up retail shelves',
      location: 'London, UK',
      budget: '£420 project',
      responseSla: 'Schedule for tonight',
    ),
    LiveFeedItem(
      title: 'QA tester for fintech launch',
      location: 'Remote (EMEA)',
      budget: '£65/hr',
      responseSla: 'Interview slots tomorrow',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }

    if (items.isEmpty) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.map_outlined, size: 48, color: Colors.grey),
          const SizedBox(height: 12),
          Text(
            emptyStateMessage,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 12),
          if (onRetry != null)
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh feed'),
            ),
        ],
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final entry = items[index];

        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 3,
          child: ListTile(
            leading: entry.highPriority
                ? const Icon(Icons.priority_high, color: Colors.redAccent)
                : const Icon(Icons.work_outline),
            title: Text(
              entry.title,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.location),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.schedule, size: 16, color: Colors.blueGrey),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        entry.responseSla,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  entry.budget,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  entry.highPriority ? 'High priority' : 'Active',
                  style: Theme.of(context)
                      .textTheme
                      .labelSmall
                      ?.copyWith(color: entry.highPriority ? Colors.redAccent : Colors.green),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
