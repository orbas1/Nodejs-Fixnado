import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:fixnado_mobile/features/creation/data/creation_studio_repository.dart';
import 'package:fixnado_mobile/features/creation/domain/creation_blueprint.dart';
import 'package:fixnado_mobile/features/creation/domain/creation_draft.dart';
import 'package:fixnado_mobile/features/creation/presentation/creation_studio_controller.dart';

class _FakeCreationStudioRepository implements CreationStudioRepository {
  _FakeCreationStudioRepository();

  final List<CreationBlueprint> _blueprints = const [
    CreationBlueprint(
      id: 'service',
      title: 'Service package',
      description: 'Full service operations bundle',
      persona: ['provider'],
      defaultPricingModel: 'fixed',
      supportedChannels: ['marketplace'],
      complianceChecklist: ['insurance'],
      recommendedRegions: ['national'],
    ),
  ];

  int saveCalls = 0;
  int publishCalls = 0;

  @override
  Future<List<CreationBlueprint>> fetchBlueprints() async {
    return _blueprints;
  }

  @override
  Future<void> publishDraft(CreationDraft draft) async {
    publishCalls += 1;
  }

  @override
  Future<void> saveDraft(CreationDraft draft) async {
    saveCalls += 1;
  }

  @override
  Future<bool> isSlugAvailable(String slug) async => slug != 'taken';
}

void main() {
  test('loads blueprints and selects draft', () async {
    final fakeRepository = _FakeCreationStudioRepository();
    final container = ProviderContainer(overrides: [
      creationStudioRepositoryProvider.overrideWithValue(fakeRepository),
    ]);
    addTearDown(container.dispose);

    await Future<void>.delayed(const Duration());

    final state = container.read(creationStudioControllerProvider);
    expect(state.blueprints, isNotEmpty);

    final controller = container.read(creationStudioControllerProvider.notifier);
    controller.selectBlueprint(state.blueprints.first);
    final updated = container.read(creationStudioControllerProvider);
    expect(updated.draft, isNotNull);
    expect(updated.selectedBlueprint?.id, 'service');
  });

  test('autosave updates repository when draft changes', () async {
    final fakeRepository = _FakeCreationStudioRepository();
    final container = ProviderContainer(overrides: [
      creationStudioRepositoryProvider.overrideWithValue(fakeRepository),
    ]);
    addTearDown(container.dispose);

    await Future<void>.delayed(const Duration());
    final controller = container.read(creationStudioControllerProvider.notifier);
    final initialState = container.read(creationStudioControllerProvider);
    controller.selectBlueprint(initialState.blueprints.first);

    final draft = container.read(creationStudioControllerProvider).draft!;
    controller.updateDraft(draft.copyWith(name: 'Updated'), autosave: true);
    await Future<void>.delayed(const Duration());

    expect(fakeRepository.saveCalls, greaterThan(0));
  });

  test('publish forwards draft to repository', () async {
    final fakeRepository = _FakeCreationStudioRepository();
    final container = ProviderContainer(overrides: [
      creationStudioRepositoryProvider.overrideWithValue(fakeRepository),
    ]);
    addTearDown(container.dispose);

    await Future<void>.delayed(const Duration());
    final controller = container.read(creationStudioControllerProvider.notifier);
    controller.selectBlueprint(container.read(creationStudioControllerProvider).blueprints.first);
    await controller.publish();

    expect(fakeRepository.publishCalls, 1);
  });
}
