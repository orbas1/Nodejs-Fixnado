import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/models.dart';

class ServiceResultCard extends StatelessWidget {
  const ServiceResultCard({
    super.key,
    required this.service,
    this.onTap,
  });

  final ExplorerService service;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      child: InkWell(
        onTap: onTap,
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
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.handyman_outlined, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.title,
                          style: GoogleFonts.manrope(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        if (service.providerName != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              service.providerName!,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (service.price != null)
                    Text(
                      '${service.currency} ${service.price!.toStringAsFixed(2)}',
                      style: GoogleFonts.ibmPlexMono(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                ],
              ),
              if (service.description != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    service.description!,
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
                    label: Text(service.category ?? 'General', style: GoogleFonts.inter(fontSize: 13)),
                  ),
                  if (service.companyName != null)
                    Chip(
                      avatar: const Icon(Icons.business_outlined, size: 18),
                      label: Text(service.companyName!, style: GoogleFonts.inter(fontSize: 13)),
                    ),
                  if (service.providerName != null)
                    Chip(
                      avatar: const Icon(Icons.verified_user_outlined, size: 18),
                      label: Text('Background checked', style: GoogleFonts.inter(fontSize: 13)),
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
