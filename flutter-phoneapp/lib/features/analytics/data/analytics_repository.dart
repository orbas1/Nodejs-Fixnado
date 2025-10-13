import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../../auth/domain/user_role.dart';
import '../domain/analytics_models.dart';
import '../utilities/timezone_resolver.dart';

class AnalyticsRepository {
  AnalyticsRepository(this._client, this._cache, this._timeZoneResolver);

  final FixnadoApiClient _client;
  final LocalCache _cache;
  final TimeZoneResolver _timeZoneResolver;

  static String _cacheKey(UserRole role) => 'analytics-dashboard:v1:${role.name}';
  static String _exportKey(UserRole role) => 'analytics-export:v1:${role.name}';

  Future<AnalyticsDashboardFetchResult> fetchDashboard(UserRole role, {bool bypassCache = false}) async {
    final persona = _personaForRole(role);
    final cacheKey = _cacheKey(role);

    if (!bypassCache) {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        try {
          final snapshot = _snapshotFromCache(cached);
          if (snapshot != null) {
            return AnalyticsDashboardFetchResult(snapshot: snapshot, offline: false);
          }
        } catch (_) {
          // corrupt cache will be ignored and refreshed below
        }
      }
    }

    try {
      final timezone = await _timeZoneResolver.resolve();
      final payload = await _client.getJson(
        '/analytics/dashboards/$persona',
        query: {
          'timezone': timezone,
        },
      );

      final dashboard = AnalyticsDashboard.fromJson(payload);
      final snapshot = AnalyticsDashboardSnapshot(dashboard: dashboard, generatedAt: DateTime.now());
      await _writeSnapshot(cacheKey, snapshot);
      return AnalyticsDashboardFetchResult(snapshot: snapshot, offline: false);
    } on ApiException catch (error) {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        final snapshot = _snapshotFromCache(cached);
        if (snapshot != null) {
          return AnalyticsDashboardFetchResult(snapshot: snapshot, offline: true);
        }
      }
      rethrow;
    } on TimeoutException {
      final cached = _cache.readJson(cacheKey);
      if (cached != null) {
        final snapshot = _snapshotFromCache(cached);
        if (snapshot != null) {
          return AnalyticsDashboardFetchResult(snapshot: snapshot, offline: true);
        }
      }
      rethrow;
    }
  }

  Future<AnalyticsExportRecord> exportDashboard(UserRole role, AnalyticsDashboard dashboard) async {
    final persona = _personaForRole(role);
    final exportPath = dashboard.exports.csv?.href;
    if (exportPath == null || exportPath.isEmpty) {
      throw StateError('CSV export not configured for persona ${dashboard.persona}');
    }

    final timezone = await _timeZoneResolver.resolve();
    final response = await _client.getText(exportPath, query: {'timezone': timezone});
    final exportRecord = AnalyticsExportRecord(
      persona: persona,
      generatedAt: DateTime.now(),
      preview: response.length > 5000 ? response.substring(0, 5000) : response,
      byteLength: utf8.encode(response).length,
    );
    await _cache.writeJson(_exportKey(role), {
      'persona': exportRecord.persona,
      'generatedAt': exportRecord.generatedAt.toIso8601String(),
      'preview': exportRecord.preview,
      'byteLength': exportRecord.byteLength,
    });
    return exportRecord;
  }

  AnalyticsExportRecord? latestExport(UserRole role) {
    final stored = _cache.readJson(_exportKey(role));
    if (stored == null) {
      return null;
    }
    try {
      return AnalyticsExportRecord(
        persona: stored['persona'] as String? ?? role.name,
        generatedAt: DateTime.tryParse(stored['generatedAt'] as String? ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
        preview: stored['preview'] as String? ?? '',
        byteLength: (stored['byteLength'] as num?)?.toInt() ?? 0,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeSnapshot(String cacheKey, AnalyticsDashboardSnapshot snapshot) async {
    await _cache.writeJson(cacheKey, {
      'generatedAt': snapshot.generatedAt.toIso8601String(),
      'dashboard': _serialiseDashboard(snapshot.dashboard),
    });
  }

  AnalyticsDashboardSnapshot? _snapshotFromCache(Map<String, dynamic> cached) {
    final generatedAt = DateTime.tryParse(cached['generatedAt'] as String? ?? '');
    final payload = cached['dashboard'];
    if (generatedAt == null || payload is! Map) {
      return null;
    }
    final dashboard = AnalyticsDashboard.fromJson(Map<String, dynamic>.from(payload as Map));
    return AnalyticsDashboardSnapshot(dashboard: dashboard, generatedAt: generatedAt);
  }

  Map<String, dynamic> _serialiseDashboard(AnalyticsDashboard dashboard) {
    Map<String, dynamic> _serialiseSection(AnalyticsSection section) {
      final base = {
        'id': section.id,
        'label': section.label,
        'description': section.description,
        'type': section.type,
        if (section.sidebar != null)
          'sidebar': {
            'badge': section.sidebar!.badge,
            'status': section.sidebar!.status == null
                ? null
                : {
                    'label': section.sidebar!.status!.label,
                    'tone': section.sidebar!.status!.tone,
                  },
            'highlights': section.sidebar!.highlights
                .map((highlight) => {'label': highlight.label, 'value': highlight.value})
                .toList(),
          },
      };

      if (section is AnalyticsOverviewSection) {
        return {
          ...base,
          'analytics': {
            'metrics': section.analytics.metrics
                .map(
                  (metric) => {
                    'label': metric.label,
                    'value': metric.value,
                    'change': metric.change,
                    'trend': metric.trend,
                  },
                )
                .toList(),
            'charts': section.analytics.charts
                .map(
                  (chart) => {
                    'id': chart.id,
                    'title': chart.title,
                    'description': chart.description,
                    'type': chart.type,
                    'dataKey': chart.dataKey,
                    'secondaryKey': chart.secondaryKey,
                    'data': chart.data,
                  },
                )
                .toList(),
            'upcoming': section.analytics.upcoming
                .map((event) => {'title': event.title, 'when': event.when, 'status': event.status})
                .toList(),
            'insights': section.analytics.insights,
          },
        };
      }

      if (section is AnalyticsTableSection) {
        return {
          ...base,
          'data': {
            'headers': section.data.headers,
            'rows': section.data.rows,
          },
        };
      }

      if (section is AnalyticsBoardSection) {
        return {
          ...base,
          'data': {
            'columns': section.data.columns
                .map(
                  (column) => {
                    'title': column.title,
                    'items': column.items
                        .map(
                          (item) => {
                            'title': item.title,
                            'owner': item.owner,
                            'value': item.value,
                            'eta': item.eta,
                          },
                        )
                        .toList(),
                  },
                )
                .toList(),
          },
        };
      }

      if (section is AnalyticsListSection) {
        return {
          ...base,
          'data': {
            'items': section.data.items
                .map(
                  (item) => {
                    'title': item.title,
                    'description': item.description,
                    'status': item.status,
                  },
                )
                .toList(),
          },
        };
      }

      if (section is AnalyticsGridSection) {
        return {
          ...base,
          'data': {
            'cards': section.data.cards
                .map(
                  (card) => {
                    'title': card.title,
                    'details': card.details,
                  },
                )
                .toList(),
          },
        };
      }

      if (section is AnalyticsAdsSection) {
        return {
          ...base,
          'data': {
            'summaryCards': section.data.summaryCards
                .map(
                  (card) => {
                    'title': card.title,
                    'value': card.value,
                    'change': card.change,
                    'trend': card.trend,
                    'helper': card.helper,
                  },
                )
                .toList(),
            'funnel': section.data.funnel
                .map(
                  (stage) => {
                    'title': stage.title,
                    'value': stage.value,
                    'helper': stage.helper,
                  },
                )
                .toList(),
            'campaigns': section.data.campaigns
                .map(
                  (campaign) => {
                    'id': campaign.id,
                    'name': campaign.name,
                    'status': campaign.status,
                    'objective': campaign.objective,
                    'spend': campaign.spend,
                    'spendChange': campaign.spendChange,
                    'conversions': campaign.conversions,
                    'conversionsChange': campaign.conversionsChange,
                    'cpa': campaign.cpa,
                    'roas': campaign.roas,
                    'roasChange': campaign.roasChange,
                    'pacing': campaign.pacing,
                    'lastMetricDate': campaign.lastMetricDate,
                    'flights': campaign.flights,
                    'window': campaign.window,
                  },
                )
                .toList(),
            'invoices': section.data.invoices
                .map(
                  (invoice) => {
                    'invoiceNumber': invoice.invoiceNumber,
                    'campaign': invoice.campaign,
                    'amountDue': invoice.amountDue,
                    'status': invoice.status,
                    'dueDate': invoice.dueDate,
                  },
                )
                .toList(),
            'alerts': section.data.alerts
                .map(
                  (alert) => {
                    'title': alert.title,
                    'severity': alert.severity,
                    'description': alert.description,
                    'detectedAt': alert.detectedAt,
                    'flight': alert.flight,
                  },
                )
                .toList(),
            'recommendations': section.data.recommendations
                .map(
                  (recommendation) => {
                    'title': recommendation.title,
                    'description': recommendation.description,
                    'action': recommendation.action,
                  },
                )
                .toList(),
            'timeline': section.data.timeline
                .map(
                  (entry) => {
                    'title': entry.title,
                    'status': entry.status,
                    'start': entry.start,
                    'end': entry.end,
                    'budget': entry.budget,
                  },
                )
                .toList(),
          },
        };
      }

      if (section is AnalyticsSettingsSection) {
        return {
          ...base,
          'data': {
            'panels': section.data.panels
                .map(
                  (panel) => {
                    'id': panel.id,
                    'title': panel.title,
                    'description': panel.description,
                    'items': panel.items
                        .map(
                          (item) => {
                            'type': item.type,
                            'label': item.label,
                            'value': item.value,
                            'helper': item.helper,
                            'enabled': item.enabled,
                          },
                        )
                        .toList(),
                  },
                )
                .toList(),
          },
        };
      }

      return base;
    }

    return {
      'persona': dashboard.persona,
      'name': dashboard.name,
      'headline': dashboard.headline,
      'window': {
        'start': dashboard.window.start?.toIso8601String(),
        'end': dashboard.window.end?.toIso8601String(),
        'label': dashboard.window.label,
        'timezone': dashboard.window.timezone,
      },
      'metadata': dashboard.metadata,
      'exports': {
        'csv': {
          'href': dashboard.exports.csv?.href,
          'rowLimit': dashboard.exports.csv?.rowLimit,
        },
      },
      'navigation': dashboard.navigation.map(_serialiseSection).toList(),
    };
  }

  String _personaForRole(UserRole role) {
    switch (role) {
      case UserRole.customer:
        return 'user';
      case UserRole.provider:
        return 'provider';
      case UserRole.serviceman:
        return 'serviceman';
      case UserRole.enterprise:
        return 'enterprise';
    }
  }
}

final analyticsRepositoryProvider = Provider<AnalyticsRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  final resolver = ref.watch(timeZoneResolverProvider);
  return AnalyticsRepository(client, cache, resolver);
});
