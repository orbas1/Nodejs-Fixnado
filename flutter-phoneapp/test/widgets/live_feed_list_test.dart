import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fixnado_mobile/widgets/live_feed_list.dart';

void main() {
  testWidgets('renders provided live feed entries with SLA badges and priority states', (tester) async {
    const items = [
      LiveFeedItem(
        title: 'Emergency generator repair',
        location: 'Birmingham, UK',
        budget: '£520 same-day',
        responseSla: 'Respond within 30 minutes',
        highPriority: true,
      ),
      LiveFeedItem(
        title: 'Enterprise onboarding audit',
        location: 'Remote',
        budget: '£95/hr',
        responseSla: 'Kick-off tomorrow 09:00',
      ),
    ];

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Padding(
            padding: EdgeInsets.all(16),
            child: LiveFeedList(items: items),
          ),
        ),
      ),
    );

    expect(find.text('Emergency generator repair'), findsOneWidget);
    expect(find.text('Enterprise onboarding audit'), findsOneWidget);
    expect(find.byIcon(Icons.priority_high), findsOneWidget);
    expect(find.textContaining('Respond within 30 minutes'), findsOneWidget);
  });

  testWidgets('shows empty state messaging and triggers retry callback when no data', (tester) async {
    var retried = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveFeedList(
            items: const [],
            emptyStateMessage: 'No geo-matched jobs yet.',
            onRetry: () => retried = true,
          ),
        ),
      ),
    );

    expect(find.text('No geo-matched jobs yet.'), findsOneWidget);
    expect(find.text('Refresh feed'), findsOneWidget);

    await tester.tap(find.text('Refresh feed'));
    await tester.pump();

    expect(retried, isTrue);
  });

  testWidgets('displays loading indicator when refreshing feed data', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: LiveFeedList(
            isLoading: true,
            items: [],
          ),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
