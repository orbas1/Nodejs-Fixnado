import '../../../core/network/api_client.dart';
import '../../../core/storage/local_cache.dart';
import '../domain/consent_models.dart';

class ConsentApi {
  ConsentApi(this._client, this._cache);

  final FixnadoApiClient _client;
  final LocalCache _cache;

  static const _subjectCacheKey = 'consent.subject';

  String? _readSubject() => _cache.readString(_subjectCacheKey);

  Future<void> _persistSubject(String? subject) async {
    if (subject == null || subject.isEmpty) {
      await _cache.remove(_subjectCacheKey);
      return;
    }
    await _cache.writeString(_subjectCacheKey, subject);
  }

  Future<ConsentSnapshot> fetchSnapshot() async {
    final subject = _readSubject();
    final response = await _client.getJson(
      '/api/consent/requirements',
      headers: subject != null ? {'X-Consent-Subject': subject} : null,
    );
    final snapshot = ConsentSnapshot.fromJson(response);
    await _persistSubject(snapshot.subjectId);
    return snapshot;
  }

  Future<ConsentSnapshot> acceptPolicy(String policyKey) async {
    final subject = _readSubject();
    final response = await _client.postJson(
      '/api/consent/events',
      headers: subject != null ? {'X-Consent-Subject': subject} : null,
      body: {
        'policyKey': policyKey,
        'decision': 'granted',
        if (subject != null) 'subjectId': subject,
        'channel': 'mobile'
      },
    );
    final snapshot = ConsentSnapshot.fromJson(response);
    await _persistSubject(snapshot.subjectId);
    return snapshot;
  }
}
