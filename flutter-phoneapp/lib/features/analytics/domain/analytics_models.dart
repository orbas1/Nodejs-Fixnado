import 'package:collection/collection.dart';

class AnalyticsDashboard {
  const AnalyticsDashboard({
    required this.persona,
    required this.name,
    required this.headline,
    required this.window,
    required this.navigation,
    required this.metadata,
    required this.exports,
  });

  final String persona;
  final String name;
  final String headline;
  final AnalyticsWindow window;
  final List<AnalyticsSection> navigation;
  final Map<String, dynamic> metadata;
  final AnalyticsExports exports;

  factory AnalyticsDashboard.fromJson(Map<String, dynamic> json) {
    return AnalyticsDashboard(
      persona: json['persona'] as String? ?? 'unknown',
      name: json['name'] as String? ?? 'Analytics',
      headline: json['headline'] as String? ?? '',
      window: AnalyticsWindow.fromJson(Map<String, dynamic>.from(json['window'] as Map? ?? const {})),
      navigation: (json['navigation'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsSection.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
      exports: AnalyticsExports.fromJson(Map<String, dynamic>.from(json['exports'] as Map? ?? const {})),
    );
  }
}

class AnalyticsWindow {
  const AnalyticsWindow({
    this.start,
    this.end,
    this.label,
    this.timezone,
  });

  final DateTime? start;
  final DateTime? end;
  final String? label;
  final String? timezone;

  factory AnalyticsWindow.fromJson(Map<String, dynamic> json) {
    return AnalyticsWindow(
      start: (json['start'] as String?) != null ? DateTime.tryParse(json['start'] as String) : null,
      end: (json['end'] as String?) != null ? DateTime.tryParse(json['end'] as String) : null,
      label: json['label'] as String?,
      timezone: json['timezone'] as String?,
    );
  }
}

class AnalyticsExports {
  const AnalyticsExports({
    this.csv,
  });

  final AnalyticsExportLink? csv;

  factory AnalyticsExports.fromJson(Map<String, dynamic> json) {
    return AnalyticsExports(
      csv: json['csv'] is Map
          ? AnalyticsExportLink.fromJson(Map<String, dynamic>.from(json['csv'] as Map))
          : null,
    );
  }
}

class AnalyticsExportLink {
  const AnalyticsExportLink({
    required this.href,
    this.rowLimit,
  });

  final String href;
  final int? rowLimit;

  factory AnalyticsExportLink.fromJson(Map<String, dynamic> json) {
    return AnalyticsExportLink(
      href: json['href'] as String? ?? '',
      rowLimit: json['rowLimit'] is num ? (json['rowLimit'] as num).toInt() : null,
    );
  }
}

abstract class AnalyticsSection {
  AnalyticsSection({
    required this.id,
    required this.label,
    required this.description,
    required this.type,
    this.sidebar,
  });

  final String id;
  final String label;
  final String description;
  final String type;
  final AnalyticsSidebar? sidebar;

  factory AnalyticsSection.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String? ?? 'overview';
    final sidebar = json['sidebar'] is Map
        ? AnalyticsSidebar.fromJson(Map<String, dynamic>.from(json['sidebar'] as Map))
        : null;

    switch (type) {
      case 'overview':
        return AnalyticsOverviewSection(
          id: json['id'] as String? ?? 'overview',
          label: json['label'] as String? ?? 'Overview',
          description: json['description'] as String? ?? '',
          analytics: AnalyticsOverview.fromJson(
            Map<String, dynamic>.from(json['analytics'] as Map? ?? const {}),
          ),
          sidebar: sidebar,
        );
      case 'table':
        return AnalyticsTableSection(
          id: json['id'] as String? ?? 'table',
          label: json['label'] as String? ?? 'Table',
          description: json['description'] as String? ?? '',
          data: AnalyticsTableData.fromJson(
            Map<String, dynamic>.from(json['data'] as Map? ?? const {}),
          ),
          sidebar: sidebar,
        );
      case 'board':
        return AnalyticsBoardSection(
          id: json['id'] as String? ?? 'board',
          label: json['label'] as String? ?? 'Board',
          description: json['description'] as String? ?? '',
          data: AnalyticsBoardData.fromJson(
            Map<String, dynamic>.from(json['data'] as Map? ?? const {}),
          ),
          sidebar: sidebar,
        );
      case 'list':
        return AnalyticsListSection(
          id: json['id'] as String? ?? 'list',
          label: json['label'] as String? ?? 'List',
          description: json['description'] as String? ?? '',
          data: AnalyticsListData.fromJson(Map<String, dynamic>.from(json['data'] as Map? ?? const {})),
          sidebar: sidebar,
        );
      case 'grid':
        return AnalyticsGridSection(
          id: json['id'] as String? ?? 'grid',
          label: json['label'] as String? ?? 'Grid',
          description: json['description'] as String? ?? '',
          data: AnalyticsGridData.fromJson(Map<String, dynamic>.from(json['data'] as Map? ?? const {})),
          sidebar: sidebar,
        );
      case 'settings':
        return AnalyticsSettingsSection(
          id: json['id'] as String? ?? 'settings',
          label: json['label'] as String? ?? 'Settings',
          description: json['description'] as String? ?? '',
          data: AnalyticsSettingsData.fromJson(Map<String, dynamic>.from(json['data'] as Map? ?? const {})),
          sidebar: sidebar,
        );
      default:
        return AnalyticsOverviewSection(
          id: json['id'] as String? ?? 'overview',
          label: json['label'] as String? ?? 'Overview',
          description: json['description'] as String? ?? '',
          analytics: AnalyticsOverview.fromJson(
            Map<String, dynamic>.from(json['analytics'] as Map? ?? const {}),
          ),
          sidebar: sidebar,
        );
    }
  }
}

class AnalyticsOverviewSection extends AnalyticsSection {
  AnalyticsOverviewSection({
    required super.id,
    required super.label,
    required super.description,
    required this.analytics,
    super.sidebar,
  }) : super(type: 'overview');

  final AnalyticsOverview analytics;
}

class AnalyticsTableSection extends AnalyticsSection {
  AnalyticsTableSection({
    required super.id,
    required super.label,
    required super.description,
    required this.data,
    super.sidebar,
  }) : super(type: 'table');

  final AnalyticsTableData data;
}

class AnalyticsBoardSection extends AnalyticsSection {
  AnalyticsBoardSection({
    required super.id,
    required super.label,
    required super.description,
    required this.data,
    super.sidebar,
  }) : super(type: 'board');

  final AnalyticsBoardData data;
}

class AnalyticsListSection extends AnalyticsSection {
  AnalyticsListSection({
    required super.id,
    required super.label,
    required super.description,
    required this.data,
    super.sidebar,
  }) : super(type: 'list');

  final AnalyticsListData data;
}

class AnalyticsGridSection extends AnalyticsSection {
  AnalyticsGridSection({
    required super.id,
    required super.label,
    required super.description,
    required this.data,
    super.sidebar,
  }) : super(type: 'grid');

  final AnalyticsGridData data;
}

class AnalyticsSettingsSection extends AnalyticsSection {
  AnalyticsSettingsSection({
    required super.id,
    required super.label,
    required super.description,
    required this.data,
    super.sidebar,
  }) : super(type: 'settings');

  final AnalyticsSettingsData data;
}

class AnalyticsOverview {
  const AnalyticsOverview({
    this.metrics = const [],
    this.charts = const [],
    this.upcoming = const [],
    this.insights = const [],
  });

  final List<AnalyticsMetric> metrics;
  final List<AnalyticsChart> charts;
  final List<AnalyticsUpcomingEvent> upcoming;
  final List<String> insights;

  factory AnalyticsOverview.fromJson(Map<String, dynamic> json) {
    return AnalyticsOverview(
      metrics: (json['metrics'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsMetric.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
      charts: (json['charts'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsChart.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
      upcoming: (json['upcoming'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsUpcomingEvent.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
      insights: (json['insights'] as List<dynamic>? ?? const []).map((value) => value.toString()).toList(),
    );
  }
}

class AnalyticsMetric {
  const AnalyticsMetric({
    required this.label,
    required this.value,
    this.change,
    this.trend,
  });

  final String label;
  final String value;
  final String? change;
  final String? trend;

  factory AnalyticsMetric.fromJson(Map<String, dynamic> json) {
    return AnalyticsMetric(
      label: json['label'] as String? ?? '',
      value: json['value']?.toString() ?? '0',
      change: json['change']?.toString(),
      trend: json['trend']?.toString(),
    );
  }
}

class AnalyticsChart {
  const AnalyticsChart({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.data,
    this.dataKey,
    this.secondaryKey,
  });

  final String id;
  final String title;
  final String description;
  final String type;
  final String? dataKey;
  final String? secondaryKey;
  final List<Map<String, dynamic>> data;

  factory AnalyticsChart.fromJson(Map<String, dynamic> json) {
    return AnalyticsChart(
      id: json['id'] as String? ?? 'chart',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      type: json['type'] as String? ?? 'bar',
      dataKey: json['dataKey']?.toString(),
      secondaryKey: json['secondaryKey']?.toString(),
      data: (json['data'] as List<dynamic>? ?? const [])
          .map((raw) => Map<String, dynamic>.from(raw as Map))
          .toList(),
    );
  }

  Iterable<AnalyticsChartSeries> get series {
    final primaryKey = dataKey ?? 'value';
    final keys = <String>{primaryKey};
    if (secondaryKey != null && secondaryKey!.isNotEmpty) {
      keys.add(secondaryKey!);
    }

    final availableNumericKeys = keys
        .where((key) => data.any((entry) => entry[key] is num))
        .map((key) => AnalyticsChartSeries(
              key: key,
              points: data
                  .map(
                    (entry) => AnalyticsChartPoint(
                      label: entry['name']?.toString() ?? '',
                      value: (entry[key] as num?)?.toDouble() ?? 0,
                    ),
                  )
                  .toList(),
            ))
        .toList();

    if (availableNumericKeys.isEmpty) {
      return [
        AnalyticsChartSeries(
          key: primaryKey,
          points: data
              .map(
                (entry) => AnalyticsChartPoint(
                  label: entry['name']?.toString() ?? '',
                  value: double.tryParse(entry[primaryKey]?.toString() ?? '') ?? 0,
                ),
              )
              .toList(),
        )
      ];
    }

    return availableNumericKeys;
  }
}

class AnalyticsChartSeries {
  const AnalyticsChartSeries({
    required this.key,
    required this.points,
  });

  final String key;
  final List<AnalyticsChartPoint> points;

  double get maxValue => points.map((point) => point.value).maxOrNull ?? 0;
}

class AnalyticsChartPoint {
  const AnalyticsChartPoint({
    required this.label,
    required this.value,
  });

  final String label;
  final double value;
}

class AnalyticsUpcomingEvent {
  const AnalyticsUpcomingEvent({
    required this.title,
    this.when,
    this.status,
  });

  final String title;
  final String? when;
  final String? status;

  factory AnalyticsUpcomingEvent.fromJson(Map<String, dynamic> json) {
    return AnalyticsUpcomingEvent(
      title: json['title'] as String? ?? '',
      when: json['when']?.toString(),
      status: json['status']?.toString(),
    );
  }
}

class AnalyticsTableData {
  const AnalyticsTableData({
    this.headers = const [],
    this.rows = const [],
  });

  final List<String> headers;
  final List<List<String>> rows;

  factory AnalyticsTableData.fromJson(Map<String, dynamic> json) {
    return AnalyticsTableData(
      headers: (json['headers'] as List<dynamic>? ?? const []).map((value) => value.toString()).toList(),
      rows: (json['rows'] as List<dynamic>? ?? const [])
          .map((raw) => (raw as List<dynamic>).map((value) => value?.toString() ?? '').toList())
          .toList(),
    );
  }
}

class AnalyticsBoardData {
  const AnalyticsBoardData({
    this.columns = const [],
  });

  final List<AnalyticsBoardColumn> columns;

  factory AnalyticsBoardData.fromJson(Map<String, dynamic> json) {
    return AnalyticsBoardData(
      columns: (json['columns'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsBoardColumn.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsBoardColumn {
  const AnalyticsBoardColumn({
    required this.title,
    this.items = const [],
  });

  final String title;
  final List<AnalyticsBoardItem> items;

  factory AnalyticsBoardColumn.fromJson(Map<String, dynamic> json) {
    return AnalyticsBoardColumn(
      title: json['title'] as String? ?? '',
      items: (json['items'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsBoardItem.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsBoardItem {
  const AnalyticsBoardItem({
    required this.title,
    this.owner,
    this.value,
    this.eta,
  });

  final String title;
  final String? owner;
  final String? value;
  final String? eta;

  factory AnalyticsBoardItem.fromJson(Map<String, dynamic> json) {
    return AnalyticsBoardItem(
      title: json['title'] as String? ?? '',
      owner: json['owner']?.toString(),
      value: json['value']?.toString(),
      eta: json['eta']?.toString(),
    );
  }
}

class AnalyticsListData {
  const AnalyticsListData({
    this.items = const [],
  });

  final List<AnalyticsListItem> items;

  factory AnalyticsListData.fromJson(Map<String, dynamic> json) {
    return AnalyticsListData(
      items: (json['items'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsListItem.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsListItem {
  const AnalyticsListItem({
    required this.title,
    this.description,
    this.status,
  });

  final String title;
  final String? description;
  final String? status;

  factory AnalyticsListItem.fromJson(Map<String, dynamic> json) {
    return AnalyticsListItem(
      title: json['title'] as String? ?? '',
      description: json['description']?.toString(),
      status: json['status']?.toString(),
    );
  }
}

class AnalyticsGridData {
  const AnalyticsGridData({
    this.cards = const [],
  });

  final List<AnalyticsGridCard> cards;

  factory AnalyticsGridData.fromJson(Map<String, dynamic> json) {
    return AnalyticsGridData(
      cards: (json['cards'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsGridCard.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsGridCard {
  const AnalyticsGridCard({
    required this.title,
    this.details = const [],
  });

  final String title;
  final List<String> details;

  factory AnalyticsGridCard.fromJson(Map<String, dynamic> json) {
    return AnalyticsGridCard(
      title: json['title'] as String? ?? '',
      details: (json['details'] as List<dynamic>? ?? const []).map((value) => value.toString()).toList(),
    );
  }
}

class AnalyticsSettingsData {
  const AnalyticsSettingsData({
    this.panels = const [],
  });

  final List<AnalyticsSettingsPanel> panels;

  factory AnalyticsSettingsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsSettingsData(
      panels: (json['panels'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsSettingsPanel.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsSettingsPanel {
  const AnalyticsSettingsPanel({
    required this.id,
    required this.title,
    this.description,
    this.items = const [],
  });

  final String id;
  final String title;
  final String? description;
  final List<AnalyticsSettingsItem> items;

  factory AnalyticsSettingsPanel.fromJson(Map<String, dynamic> json) {
    return AnalyticsSettingsPanel(
      id: json['id']?.toString() ?? 'panel',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      items: (json['items'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsSettingsItem.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsSettingsItem {
  const AnalyticsSettingsItem({
    required this.type,
    required this.label,
    this.value,
    this.helper,
    this.enabled,
  });

  final String type;
  final String label;
  final String? value;
  final String? helper;
  final bool? enabled;

  factory AnalyticsSettingsItem.fromJson(Map<String, dynamic> json) {
    return AnalyticsSettingsItem(
      type: json['type']?.toString() ?? 'value',
      label: json['label']?.toString() ?? '',
      value: json['value']?.toString(),
      helper: json['helper']?.toString(),
      enabled: json['enabled'] is bool ? json['enabled'] as bool : null,
    );
  }
}

class AnalyticsSidebar {
  const AnalyticsSidebar({
    this.badge,
    this.status,
    this.highlights = const [],
  });

  final String? badge;
  final AnalyticsSidebarStatus? status;
  final List<AnalyticsSidebarHighlight> highlights;

  factory AnalyticsSidebar.fromJson(Map<String, dynamic> json) {
    return AnalyticsSidebar(
      badge: json['badge']?.toString(),
      status: json['status'] is Map
          ? AnalyticsSidebarStatus.fromJson(Map<String, dynamic>.from(json['status'] as Map))
          : null,
      highlights: (json['highlights'] as List<dynamic>? ?? const [])
          .map((raw) => AnalyticsSidebarHighlight.fromJson(Map<String, dynamic>.from(raw as Map)))
          .toList(),
    );
  }
}

class AnalyticsSidebarStatus {
  const AnalyticsSidebarStatus({
    required this.label,
    this.tone,
  });

  final String label;
  final String? tone;

  factory AnalyticsSidebarStatus.fromJson(Map<String, dynamic> json) {
    return AnalyticsSidebarStatus(
      label: json['label']?.toString() ?? '',
      tone: json['tone']?.toString(),
    );
  }
}

class AnalyticsSidebarHighlight {
  const AnalyticsSidebarHighlight({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  factory AnalyticsSidebarHighlight.fromJson(Map<String, dynamic> json) {
    return AnalyticsSidebarHighlight(
      label: json['label']?.toString() ?? '',
      value: json['value']?.toString() ?? '',
    );
  }
}

class AnalyticsDashboardSnapshot {
  const AnalyticsDashboardSnapshot({
    required this.dashboard,
    required this.generatedAt,
  });

  final AnalyticsDashboard dashboard;
  final DateTime generatedAt;
}

class AnalyticsDashboardFetchResult {
  const AnalyticsDashboardFetchResult({
    required this.snapshot,
    required this.offline,
  });

  final AnalyticsDashboardSnapshot snapshot;
  final bool offline;
}

class AnalyticsExportRecord {
  const AnalyticsExportRecord({
    required this.persona,
    required this.generatedAt,
    required this.preview,
    required this.byteLength,
  });

  final String persona;
  final DateTime generatedAt;
  final String preview;
  final int byteLength;
}
