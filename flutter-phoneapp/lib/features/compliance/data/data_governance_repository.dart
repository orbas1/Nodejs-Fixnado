import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/network/api_client.dart';
import '../domain/data_subject_request.dart';

class DataGovernanceRepository {
  DataGovernanceRepository(this._client);

  final FixnadoApiClient _client;

  Future<List<DataSubjectRequest>> fetchRequests({String? status}) async {
    final payload = await _client.getJson('/compliance/data-requests', query: {
      if (status != null) 'status': status,
    });
    final raw = payload['data'] as List<dynamic>? ?? [];
    return raw
        .map((item) => DataSubjectRequest.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<DataSubjectRequest> createRequest({
    required String subjectEmail,
    required String requestType,
    String? justification,
    String? regionCode,
  }) async {
    final payload = await _client.postJson('/compliance/data-requests', body: {
      'subjectEmail': subjectEmail,
      'requestType': requestType,
      if (justification != null && justification.isNotEmpty) 'justification': justification,
      if (regionCode != null) 'regionCode': regionCode,
    });
    return DataSubjectRequest.fromJson(payload);
  }

  Future<DataSubjectRequest> updateStatus(String requestId, {required String status, String? note}) async {
    final payload = await _client.postJson('/compliance/data-requests/$requestId/status', body: {
      'status': status,
      if (note != null) 'note': note,
    });
    return DataSubjectRequest.fromJson(payload);
  }

  Future<DataSubjectRequest> generateExport(String requestId) async {
    final payload = await _client.postJson('/compliance/data-requests/$requestId/export');
    if (payload.containsKey('request')) {
      return DataSubjectRequest.fromJson(Map<String, dynamic>.from(payload['request'] as Map));
    }
    return DataSubjectRequest.fromJson(payload);
  }
}

final dataGovernanceRepositoryProvider = Provider<DataGovernanceRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return DataGovernanceRepository(client);
});
