import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/consent_controller.dart';

class ConsentOverlay extends ConsumerWidget {
  const ConsentOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(consentControllerProvider);
    if (!state.requiresAction) {
      return const SizedBox.shrink();
    }

    final controller = ref.read(consentControllerProvider.notifier);
    final theme = Theme.of(context);

    return Positioned.fill(
      child: Material(
        color: Colors.black.withOpacity(0.55),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 12,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Review updated terms',
                      style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'We refreshed our legal documentation to include the consent ledger and scam detection policies. Please acknowledge the updates to continue using Fixnado.',
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    const SizedBox(height: 16),
                    ...state.pendingPolicies.map((policy) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: ListTile(
                              dense: true,
                              title: Text(
                                policy.title,
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Text(
                                'Version ${policy.version}\n${policy.description}',
                                style: theme.textTheme.bodySmall,
                              ),
                            ),
                          ),
                        )),
                    if (state.errorMessage != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        state.errorMessage!,
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: state.isLoading ? null : controller.acceptAll,
                        child: state.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Acknowledge and continue'),
                      ),
                    ),
                    TextButton(
                      onPressed: state.isLoading ? null : controller.load,
                      child: const Text('Refresh status'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
