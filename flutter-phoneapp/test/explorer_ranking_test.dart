import 'package:test/test.dart';

import 'package:fixnado_mobile/features/explorer/domain/explorer_ranking.dart';
import 'package:fixnado_mobile/features/explorer/domain/models.dart';

void main() {
  group('Explorer ranking', () {
    final londonZone = ZoneSummary(
      id: 'zone-london',
      name: 'London Core',
      demandLevel: 'high',
      metadata: const {},
      centroid: const {},
      boundingBox: const {},
      analytics: null,
      companyId: 'company-1',
    );

    test('prioritises compliant services in the active zone', () {
      final services = [
        ExplorerService(
          id: 'svc-1',
          title: 'Electrical response',
          description: '24/7 cover with compliance concierge',
          category: 'Electrical',
          categorySlug: 'electrical',
          type: 'trade-services',
          price: 180,
          currency: 'GBP',
          companyName: 'Prime Ops',
          providerName: 'Sarah Volt',
          tags: const ['Escrow ready'],
          companyId: 'company-1',
          complianceScore: 94,
          distanceKm: 5,
        ),
        ExplorerService(
          id: 'svc-2',
          title: 'General maintenance',
          description: 'Reactive maintenance for mixed estates',
          category: 'Maintenance',
          categorySlug: 'maintenance',
          type: 'trade-services',
          price: 90,
          currency: 'GBP',
          companyName: 'Northern Support',
          providerName: 'Lee Martin',
          tags: const [],
          companyId: 'company-2',
          complianceScore: 68,
          distanceKm: 15,
        ),
      ];

      final ranked = rankExplorerServices(
        services,
        selectedZone: londonZone,
        filters: ExplorerFilters(term: 'electrical'),
      );

      expect(ranked.first.id, equals('svc-1'));
      expect(
        scoreExplorerService(
          services.first,
          selectedZone: londonZone,
          filters: ExplorerFilters(term: 'electrical'),
        ),
        greaterThan(
          scoreExplorerService(
            services.last,
            selectedZone: londonZone,
            filters: ExplorerFilters(term: 'electrical'),
          ),
        ),
      );
    });

    test('boosts marketplace items that support rentals and match availability', () {
      final items = [
        ExplorerMarketplaceItem(
          id: 'item-1',
          title: 'Boom lift',
          description: 'Insured and certified for skyline work',
          availability: 'rent',
          location: 'London',
          pricePerDay: 240,
          purchasePrice: 18000,
          status: 'approved',
          insuredOnly: true,
          companyId: 'company-1',
          complianceScore: 0.9,
        ),
        ExplorerMarketplaceItem(
          id: 'item-2',
          title: 'Tool bundle',
          description: 'Out of zone stock',
          availability: 'buy',
          location: 'Manchester',
          pricePerDay: null,
          purchasePrice: 950,
          status: 'pending_review',
          insuredOnly: false,
          companyId: 'company-3',
          complianceScore: 0.6,
        ),
      ];

      final ranked = rankExplorerMarketplaceItems(
        items,
        selectedZone: londonZone,
        filters: ExplorerFilters(availability: 'rent', term: 'lift'),
      );

      expect(ranked.first.id, equals('item-1'));
      expect(
        scoreExplorerMarketplaceItem(
          items.first,
          selectedZone: londonZone,
          filters: ExplorerFilters(availability: 'rent', term: 'lift'),
        ),
        greaterThan(
          scoreExplorerMarketplaceItem(
            items.last,
            selectedZone: londonZone,
            filters: ExplorerFilters(availability: 'rent', term: 'lift'),
          ),
        ),
      );
    });
  });
}
