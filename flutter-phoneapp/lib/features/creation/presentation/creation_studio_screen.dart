import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/creation_blueprint.dart';
import '../domain/creation_draft.dart';
import 'creation_studio_controller.dart';

class CreationStudioScreen extends ConsumerStatefulWidget {
  const CreationStudioScreen({super.key});

  @override
  ConsumerState<CreationStudioScreen> createState() => _CreationStudioScreenState();
}

class _CreationStudioScreenState extends ConsumerState<CreationStudioScreen> {
  final _nameController = TextEditingController();
  final _slugController = TextEditingController();
  final _summaryController = TextEditingController();
  final _priceController = TextEditingController();
  final _setupFeeController = TextEditingController();
  final _leadHoursController = TextEditingController(text: '48');
  ProviderSubscription<CreationDraft?>? _draftSubscription;
  CreationDraft? _lastDraft;

  @override
  void initState() {
    super.initState();
    _draftSubscription = ref.listen<CreationDraft?>
        (creationStudioControllerProvider.select((state) => state.draft), (previous, next) {
      if (next != null) {
        _applyDraft(next);
      }
    });
  }

  @override
  void dispose() {
    _draftSubscription?.close();
    _nameController.dispose();
    _slugController.dispose();
    _summaryController.dispose();
    _priceController.dispose();
    _setupFeeController.dispose();
    _leadHoursController.dispose();
    super.dispose();
  }

  void _applyDraft(CreationDraft draft) {
    if (_lastDraft == draft) {
      return;
    }
    _lastDraft = draft;
    _nameController.text = draft.name;
    _slugController.text = draft.slug;
    _summaryController.text = draft.summary;
    _priceController.text = draft.pricing.amount == 0 ? '' : draft.pricing.amount.toStringAsFixed(0);
    _setupFeeController.text = draft.pricing.setupFee == null ? '' : draft.pricing.setupFee!.toStringAsFixed(0);
    _leadHoursController.text = draft.availabilityLeadHours.toString();
  }

  CreationStudioController get _controller =>
      ref.read(creationStudioControllerProvider.notifier);

  CreationDraft? get _draft => ref.read(creationStudioControllerProvider).draft;

  void _updateDraft({
    String? name,
    String? slug,
    String? summary,
    CreationDraftPricing? pricing,
    List<String>? fulfilmentChannels,
    List<String>? complianceChecklist,
    bool? aiAssistEnabled,
    int? availabilityLeadHours,
  }) {
    final draft = _draft;
    if (draft == null) {
      return;
    }
    _controller.updateDraft(
      draft.copyWith(
        name: name,
        slug: slug,
        summary: summary,
        pricing: pricing,
        fulfilmentChannels: fulfilmentChannels,
        complianceChecklist: complianceChecklist,
        aiAssistEnabled: aiAssistEnabled,
        availabilityLeadHours: availabilityLeadHours,
      ),
      autosave: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(creationStudioControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Creation studio'),
      ),
      body: SafeArea(
        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : Padding(
                padding: const EdgeInsets.all(16),
                child: state.selectedBlueprint == null
                    ? _BlueprintList(
                        blueprints: state.blueprints,
                        onSelect: _controller.selectBlueprint,
                      )
                    : _CreationForm(
                        state: state,
                        nameController: _nameController,
                        slugController: _slugController,
                        summaryController: _summaryController,
                        priceController: _priceController,
                        setupFeeController: _setupFeeController,
                        leadHoursController: _leadHoursController,
                        onUpdate: _updateDraft,
                        onValidateSlug: (slug) => _controller.validateSlug(slug),
                        onPublish: _controller.publish,
                      ),
              ),
      ),
    );
  }
}

class _BlueprintList extends StatelessWidget {
  const _BlueprintList({required this.blueprints, required this.onSelect});

  final List<CreationBlueprint> blueprints;
  final void Function(CreationBlueprint) onSelect;

  @override
  Widget build(BuildContext context) {
    if (blueprints.isEmpty) {
      return const Center(
        child: Text('No creation blueprints are available yet.'),
      );
    }
    return ListView.separated(
      itemCount: blueprints.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final blueprint = blueprints[index];
        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            onTap: () => onSelect(blueprint),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    blueprint.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    blueprint.description,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: blueprint.supportedChannels
                        .map(
                          (channel) => Chip(
                            label: Text(channel),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _CreationForm extends StatelessWidget {
  const _CreationForm({
    required this.state,
    required this.nameController,
    required this.slugController,
    required this.summaryController,
    required this.priceController,
    required this.setupFeeController,
    required this.leadHoursController,
    required this.onUpdate,
    required this.onValidateSlug,
    required this.onPublish,
  });

  final CreationStudioState state;
  final TextEditingController nameController;
  final TextEditingController slugController;
  final TextEditingController summaryController;
  final TextEditingController priceController;
  final TextEditingController setupFeeController;
  final TextEditingController leadHoursController;
  final void Function({
    String? name,
    String? slug,
    String? summary,
    CreationDraftPricing? pricing,
    List<String>? fulfilmentChannels,
    List<String>? complianceChecklist,
    bool? aiAssistEnabled,
    int? availabilityLeadHours,
  }) onUpdate;
  final Future<void> Function(String) onValidateSlug;
  final Future<void> Function() onPublish;

  @override
  Widget build(BuildContext context) {
    final draft = state.draft!;
    final blueprint = state.selectedBlueprint!;
    final channels = ['marketplace', 'direct', 'partner-network', 'white-label'];

    return ListView(
      children: [
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Material(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  state.error!,
                  style: TextStyle(color: Colors.red.shade700),
                ),
              ),
            ),
          ),
        TextField(
          controller: nameController,
          decoration: const InputDecoration(labelText: 'اسم التجربة'),
          onChanged: (value) => onUpdate(name: value),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: slugController,
          decoration: InputDecoration(
            labelText: 'المعرف (Slug)',
            helperText: state.slugError ?? 'يستخدم في الروابط وواجهات البرمجة',
            helperStyle: TextStyle(color: state.slugError != null ? Colors.red : null),
          ),
          onChanged: (value) => onUpdate(slug: value.toLowerCase()),
          onEditingComplete: () => onValidateSlug(slugController.text),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: summaryController,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'الوصف المختصر'),
          onChanged: (value) => onUpdate(summary: value),
        ),
        const SizedBox(height: 20),
        Text('القنوات المتاحة', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: channels
              .map(
                (channel) => FilterChip(
                  label: Text(channel),
                  selected: draft.fulfilmentChannels.contains(channel),
                  onSelected: (selected) {
                    final current = [...draft.fulfilmentChannels];
                    if (selected) {
                      current.add(channel);
                    } else {
                      current.remove(channel);
                    }
                    onUpdate(fulfilmentChannels: current);
                  },
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 20),
        Text('التسعير', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'السعر الأساسي'),
                onChanged: (value) {
                  final amount = double.tryParse(value) ?? 0;
                  onUpdate(
                    pricing: draft.pricing.copyWith(amount: amount),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: setupFeeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'رسوم الإعداد'),
                onChanged: (value) {
                  final setup = double.tryParse(value);
                  onUpdate(
                    pricing: draft.pricing.copyWith(setupFee: setup),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text('التوفر', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        TextField(
          controller: leadHoursController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'مهلة التنفيذ (ساعات)'),
          onChanged: (value) {
            final lead = int.tryParse(value) ?? draft.availabilityLeadHours;
            onUpdate(availabilityLeadHours: lead);
          },
        ),
        const SizedBox(height: 20),
        Text('متطلبات الامتثال', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...blueprint.complianceChecklist.map(
          (item) => CheckboxListTile(
            title: Text(item),
            value: draft.complianceChecklist.contains(item),
            onChanged: (checked) {
              final current = [...draft.complianceChecklist];
              if (checked ?? false) {
                current.add(item);
              } else {
                current.remove(item);
              }
              onUpdate(complianceChecklist: current);
            },
          ),
        ),
        SwitchListTile(
          title: const Text('تفعيل مساعد الذكاء الاصطناعي'),
          value: draft.aiAssistEnabled,
          onChanged: (value) => onUpdate(aiAssistEnabled: value),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: state.publishing ? null : onPublish,
          icon: state.publishing
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.publish),
          label: const Text('نشر على المنصة'),
        ),
      ],
    );
  }
}
