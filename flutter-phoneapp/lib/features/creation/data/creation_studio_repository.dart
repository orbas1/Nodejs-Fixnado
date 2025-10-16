import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../../../core/network/api_client.dart';
import '../domain/creation_blueprint.dart';
import '../domain/creation_draft.dart';

class CreationStudioRepository {
  CreationStudioRepository(this._client);

  final FixnadoApiClient _client;

  Future<List<CreationBlueprint>> fetchBlueprints() async {
    final payload = await _client.getJson('/creation-studio/blueprints');
    final rawList = payload['data'] is List ? payload['data'] as List : payload['blueprints'] as List?;
    if (rawList == null) {
      return const [];
    }
    return rawList.map((entry) => CreationBlueprint.fromJson(Map<String, dynamic>.from(entry as Map))).toList(growable: false);
  }

  Future<void> saveDraft(CreationDraft draft) {
    return _client.postJson('/creation-studio/drafts', body: draft.toJson());
  }

  Future<void> publishDraft(CreationDraft draft) {
    return _client.postJson('/creation-studio/publish', body: draft.toJson());
  }

  Future<bool> isSlugAvailable(String slug) async {
    final payload = await _client.getJson('/creation-studio/slug-check', query: {'slug': slug});
    if (payload['available'] is bool) {
      return payload['available'] as bool;
    }
    final data = payload['data'];
    if (data is Map && data['available'] is bool) {
      return data['available'] as bool;
    }
    return false;
  }
}

final creationStudioRepositoryProvider = Provider<CreationStudioRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return CreationStudioRepository(client);
});
