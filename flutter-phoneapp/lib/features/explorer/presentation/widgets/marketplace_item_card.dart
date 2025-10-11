import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/models.dart';
import '../../../../core/utils/currency_formatter.dart';

class MarketplaceItemCard extends StatelessWidget {
  const MarketplaceItemCard({
    super.key,
    required this.item,
    this.onTap,
  });

  final ExplorerMarketplaceItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 1,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: Theme.of(context).colorScheme.secondaryContainer,
                    ),
                    child: const Icon(Icons.inventory_2_outlined, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.title,
                          style: GoogleFonts.manrope(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        if (item.location != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              item.location!,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (item.pricePerDay != null)
                        Text(
                          '${CurrencyFormatter.format(item.pricePerDay)} /day',
                          style: GoogleFonts.ibmPlexMono(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      if (item.purchasePrice != null)
                        Text(
                          CurrencyFormatter.format(item.purchasePrice),
                          style: GoogleFonts.ibmPlexMono(
                            fontSize: 13,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              if (item.description != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    item.description!,
                    style: GoogleFonts.inter(fontSize: 14, height: 1.5),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  Chip(
                    avatar: const Icon(Icons.local_shipping_outlined, size: 18),
                    label: Text(item.availability.toUpperCase(), style: GoogleFonts.inter(fontSize: 12)),
                  ),
                  Chip(
                    avatar: Icon(
                      item.insuredOnly ? Icons.verified_outlined : Icons.shield_outlined,
                      size: 18,
                    ),
                    label: Text(
                      item.insuredOnly ? 'Insured sellers only' : 'Open to all sellers',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                  ),
                  Chip(
                    avatar: const Icon(Icons.flag_outlined, size: 18),
                    label: Text(item.status.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 12)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
