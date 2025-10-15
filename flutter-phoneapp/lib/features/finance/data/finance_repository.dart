import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/network/api_client.dart';
import '../domain/finance_models.dart';

class FinanceRepository {
  FinanceRepository(this._client);

  final FixnadoApiClient _client;

  Future<FinanceOverview> fetchOverview() async {
    final payload = await _client.getJson('/finance/overview');
    return FinanceOverview.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<FinanceTimeline> fetchTimeline(String orderId) async {
    final payload = await _client.getJson('/finance/orders/$orderId/timeline');
    return FinanceTimeline.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<FinanceReport> fetchReport({Map<String, dynamic>? query}) async {
    final payload = await _client.getJson('/finance/reports/daily', query: query);
    return FinanceReport.fromJson(Map<String, dynamic>.from(payload));
  }

  Future<FinanceAlertSummary> fetchAlerts() async {
    final payload = await _client.getJson('/finance/alerts');
    return FinanceAlertSummary.fromJson(Map<String, dynamic>.from(payload));
  }
}

final financeRepositoryProvider = Provider<FinanceRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return FinanceRepository(client);
});
