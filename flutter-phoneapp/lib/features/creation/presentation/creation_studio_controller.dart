import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/creation_studio_repository.dart';
import '../domain/creation_blueprint.dart';
import '../domain/creation_draft.dart';

class CreationStudioState extends Equatable {
  const CreationStudioState({
    this.blueprints = const [],
    this.loading = false,
    this.error,
    this.selectedBlueprint,
    this.draft,
    this.saving = false,
    this.publishing = false,
    this.slugError,
  });

  final List<CreationBlueprint> blueprints;
  final bool loading;
  final String? error;
  final CreationBlueprint? selectedBlueprint;
  final CreationDraft? draft;
  final bool saving;
  final bool publishing;
  final String? slugError;

  CreationStudioState copyWith({
    List<CreationBlueprint>? blueprints,
    bool? loading,
    String? error,
    CreationBlueprint? selectedBlueprint,
    CreationDraft? draft,
    bool? saving,
    bool? publishing,
    String? slugError,
  }) {
    return CreationStudioState(
      blueprints: blueprints ?? this.blueprints,
      loading: loading ?? this.loading,
      error: error,
      selectedBlueprint: selectedBlueprint ?? this.selectedBlueprint,
      draft: draft ?? this.draft,
      saving: saving ?? this.saving,
      publishing: publishing ?? this.publishing,
      slugError: slugError,
    );
  }

  @override
  List<Object?> get props => [
        blueprints,
        loading,
        error,
        selectedBlueprint,
        draft,
        saving,
        publishing,
        slugError,
      ];
}

class CreationStudioController extends StateNotifier<CreationStudioState> {
  CreationStudioController(this._repository)
      : super(const CreationStudioState(loading: true));

  final CreationStudioRepository _repository;

  Future<void> initialise() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final blueprints = await _repository.fetchBlueprints();
      state = state.copyWith(blueprints: blueprints, loading: false);
    } catch (error) {
      state = state.copyWith(error: error.toString(), loading: false);
    }
  }

  void selectBlueprint(CreationBlueprint blueprint) {
    final draft = CreationDraft(
      blueprintId: blueprint.id,
      name: '',
      slug: '',
      summary: '',
      persona: blueprint.persona,
      region: blueprint.recommendedRegions.isNotEmpty ? blueprint.recommendedRegions.first : 'national',
      pricing: const CreationDraftPricing(model: 'fixed', amount: 0, currency: 'GBP'),
      fulfilmentChannels: blueprint.supportedChannels,
      complianceChecklist: blueprint.complianceChecklist,
      automationHints: const [],
      availabilityLeadHours: 48,
      availabilityWindow: '08:00-18:00',
      aiAssistEnabled: true,
    );
    state = state.copyWith(selectedBlueprint: blueprint, draft: draft, slugError: null);
  }

  Future<void> updateDraft(CreationDraft draft, {bool autosave = false}) async {
    state = state.copyWith(draft: draft, saving: autosave ? true : state.saving);
    if (!autosave) {
      return;
    }
    try {
      await _repository.saveDraft(draft);
      state = state.copyWith(saving: false);
    } catch (error) {
      state = state.copyWith(saving: false, error: error.toString());
    }
  }

  Future<void> publish() async {
    final draft = state.draft;
    if (draft == null) {
      return;
    }
    state = state.copyWith(publishing: true, error: null);
    try {
      await _repository.publishDraft(draft);
      state = state.copyWith(publishing: false);
    } catch (error) {
      state = state.copyWith(publishing: false, error: error.toString());
    }
  }

  Future<void> validateSlug(String slug) async {
    try {
      final available = await _repository.isSlugAvailable(slug);
      state = state.copyWith(slugError: available ? null : 'Slug already in use');
    } catch (error) {
      state = state.copyWith(slugError: error.toString());
    }
  }
}

final creationStudioControllerProvider =
    StateNotifierProvider<CreationStudioController, CreationStudioState>((ref) {
  final repository = ref.watch(creationStudioRepositoryProvider);
  final controller = CreationStudioController(repository);
  controller.initialise();
  return controller;
});
