import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';
import '../data/consent_api.dart';
import '../domain/consent_models.dart';

class ConsentState {
  const ConsentState({
    required this.isLoading,
    required this.pendingPolicies,
    this.errorMessage,
  });

  final bool isLoading;
  final List<ConsentPolicy> pendingPolicies;
  final String? errorMessage;

  bool get requiresAction => pendingPolicies.isNotEmpty;

  ConsentState copyWith({
    bool? isLoading,
    List<ConsentPolicy>? pendingPolicies,
    String? errorMessage,
  }) {
    return ConsentState(
      isLoading: isLoading ?? this.isLoading,
      pendingPolicies: pendingPolicies ?? this.pendingPolicies,
      errorMessage: errorMessage,
    );
  }
}

final consentApiProvider = Provider<ConsentApi>((ref) {
  final client = ref.watch(apiClientProvider);
  final cache = ref.watch(localCacheProvider);
  return ConsentApi(client, cache);
});

final consentControllerProvider = StateNotifierProvider<ConsentController, ConsentState>((ref) {
  final api = ref.watch(consentApiProvider);
  return ConsentController(api)..load();
});

class ConsentController extends StateNotifier<ConsentState> {
  ConsentController(this._api)
      : super(const ConsentState(isLoading: true, pendingPolicies: [], errorMessage: null));

  final ConsentApi _api;

  Future<void> load() async {
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);
      final snapshot = await _api.fetchSnapshot();
      state = ConsentState(isLoading: false, pendingPolicies: snapshot.pendingPolicies, errorMessage: null);
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString(),
      );
    }
  }

  Future<void> acceptAll() async {
    if (state.pendingPolicies.isEmpty) {
      return;
    }
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);
      // Take a snapshot of current policies to avoid mutation during iteration.
      final policiesToConfirm = List<ConsentPolicy>.from(state.pendingPolicies);
      for (final policy in policiesToConfirm) {
        await _api.acceptPolicy(policy.key);
      }
      final snapshot = await _api.fetchSnapshot();
      state = ConsentState(isLoading: false, pendingPolicies: snapshot.pendingPolicies, errorMessage: null);
    } catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }
}
