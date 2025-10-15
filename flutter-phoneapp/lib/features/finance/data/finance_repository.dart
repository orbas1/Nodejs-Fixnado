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
}

final financeRepositoryProvider = Provider<FinanceRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return FinanceRepository(client);
});
