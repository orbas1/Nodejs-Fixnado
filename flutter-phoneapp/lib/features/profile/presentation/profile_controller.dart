import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:collection/collection.dart';

import '../data/profile_repository.dart';
import '../domain/profile_models.dart';

final profileControllerProvider = StateNotifierProvider<ProfileController, ProfileViewState>((ref) {
  final repository = ref.watch(profileRepositoryProvider);
  return ProfileController(repository)..refresh();
});

class ProfileController extends StateNotifier<ProfileViewState> {
  ProfileController(this._repository) : super(ProfileViewState.initial());

  final ProfileRepository _repository;

  Future<void> refresh({bool bypassCache = false}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _repository.fetchProfile(bypassCache: bypassCache);
      final snapshot = result.profile;
      state = state.copyWith(
        isLoading: false,
        offline: result.offline,
        profile: snapshot,
        draft: ProfileDraft.fromSnapshot(snapshot),
        lastUpdated: snapshot.generatedAt,
      );
    } on Exception catch (error) {
      state = state.copyWith(isLoading: false, errorMessage: error.toString());
    }
  }

  void updateIdentity({
    String? displayName,
    String? headline,
    String? tagline,
    String? bio,
    List<String>? serviceRegions,
    String? supportEmail,
    String? supportPhone,
  }) {
    final draft = state.draft;
    if (draft == null) {
      return;
    }
    final updated = draft.copyWith(
      displayName: displayName,
      headline: headline,
      tagline: tagline,
      bio: bio,
      serviceRegions: serviceRegions,
      supportEmail: supportEmail,
      supportPhone: supportPhone,
    );
    if (identical(updated, draft)) {
      return;
    }
    state = state.copyWith(draft: updated);
  }

  void setBadges(List<String> badges) {
    final draft = state.draft;
    if (draft == null) return;
    if (const ListEquality<String>().equals(draft.badges, badges)) {
      return;
    }
    state = state.copyWith(draft: draft.copyWith(badges: badges));
  }

  void toggleBadge(String badge) {
    final draft = state.draft;
    if (draft == null) return;
    final badges = List<String>.from(draft.badges);
    if (badges.contains(badge)) {
      badges.remove(badge);
    } else {
      badges.add(badge);
    }
    setBadges(badges);
  }

  void toggleServiceTag(String tag) {
    final draft = state.draft;
    if (draft == null) return;
    final tags = List<String>.from(draft.serviceTags);
    if (tags.contains(tag)) {
      tags.remove(tag);
    } else {
      tags.add(tag);
    }
    if (!const ListEquality<String>().equals(tags, draft.serviceTags)) {
      state = state.copyWith(draft: draft.copyWith(serviceTags: tags));
    }
  }

  void toggleLanguage(String locale) {
    final draft = state.draft;
    final profile = state.profile;
    if (draft == null || profile == null) return;
    final selected = List<LanguageCapability>.from(draft.languages);
    final index = selected.indexWhere((language) => language.locale == locale);
    if (index >= 0) {
      selected.removeAt(index);
    } else {
      final option = profile.languageLibrary.firstWhereOrNull((language) => language.locale == locale);
      if (option == null) return;
      selected.add(option);
    }
    if (!const ListEquality<LanguageCapability>().equals(selected, draft.languages)) {
      state = state.copyWith(draft: draft.copyWith(languages: selected));
    }
  }

  void toggleCompliance(String name) {
    final draft = state.draft;
    final profile = state.profile;
    if (draft == null || profile == null) return;
    final selected = List<ComplianceDocument>.from(draft.compliance);
    final index = selected.indexWhere((doc) => doc.name == name);
    if (index >= 0) {
      selected.removeAt(index);
    } else {
      final option = profile.complianceLibrary.firstWhereOrNull((doc) => doc.name == name);
      if (option == null) return;
      selected.add(option);
    }
    if (!const ListEquality<ComplianceDocument>().equals(selected, draft.compliance)) {
      state = state.copyWith(draft: draft.copyWith(compliance: selected));
    }
  }

  void toggleAvailability(String window) {
    final draft = state.draft;
    final profile = state.profile;
    if (draft == null || profile == null) return;
    final selected = List<AvailabilityWindow>.from(draft.availability);
    final index = selected.indexWhere((slot) => slot.window == window);
    if (index >= 0) {
      selected.removeAt(index);
    } else {
      final option = profile.availabilityLibrary.firstWhereOrNull((slot) => slot.window == window);
      if (option == null) return;
      selected.add(option);
    }
    if (!const ListEquality<AvailabilityWindow>().equals(selected, draft.availability)) {
      state = state.copyWith(draft: draft.copyWith(availability: selected));
    }
  }

  void updateShareProfile(bool value) {
    final draft = state.draft;
    if (draft == null || draft.shareProfile == value) return;
    state = state.copyWith(draft: draft.copyWith(shareProfile: value));
  }

  void updateRequestQuote(bool value) {
    final draft = state.draft;
    if (draft == null || draft.requestQuote == value) return;
    state = state.copyWith(draft: draft.copyWith(requestQuote: value));
  }

  Future<void> saveChanges() async {
    final draft = state.draft;
    final profile = state.profile;
    if (draft == null || profile == null) return;
    state = state.copyWith(isSaving: true, errorMessage: null);
    try {
      final updated = await _repository.updateProfile(profile, draft.toUpdateRequest());
      state = state.copyWith(
        isSaving: false,
        profile: updated,
        draft: ProfileDraft.fromSnapshot(updated),
        lastUpdated: updated.generatedAt,
        offline: false,
      );
    } on Exception catch (error) {
      state = state.copyWith(isSaving: false, errorMessage: error.toString());
    }
  }

  void discardChanges() {
    final profile = state.profile;
    if (profile == null) return;
    state = state.copyWith(
      draft: ProfileDraft.fromSnapshot(profile),
      errorMessage: null,
    );
  }
}

class ProfileViewState {
  ProfileViewState({
    required this.isLoading,
    required this.isSaving,
    required this.offline,
    required this.errorMessage,
    required this.profile,
    required this.draft,
    required this.lastUpdated,
  });

  factory ProfileViewState.initial() => ProfileViewState(
        isLoading: true,
        isSaving: false,
        offline: false,
        errorMessage: null,
        profile: null,
        draft: null,
        lastUpdated: null,
      );

  final bool isLoading;
  final bool isSaving;
  final bool offline;
  final String? errorMessage;
  final ProfileSnapshot? profile;
  final ProfileDraft? draft;
  final DateTime? lastUpdated;

  bool get hasUnsavedChanges {
    if (profile == null || draft == null) return false;
    return !draft!.matchesSnapshot(profile!);
  }

  ProfileViewState copyWith({
    bool? isLoading,
    bool? isSaving,
    bool? offline,
    String? errorMessage,
    ProfileSnapshot? profile,
    ProfileDraft? draft,
    DateTime? lastUpdated,
  }) {
    return ProfileViewState(
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      offline: offline ?? this.offline,
      errorMessage: errorMessage ?? this.errorMessage,
      profile: profile ?? this.profile,
      draft: draft ?? this.draft,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}
