import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/service_catalog_models.dart';

class ServicePackageCard extends StatelessWidget {
  const ServicePackageCard({
    super.key,
    required this.package,
    this.onBook,
  });

  final ServicePackage package;
  final VoidCallback? onBook;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 280,
      child: Card(
        elevation: 1,
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                package.name,
                style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              Text(
                package.description,
                style: GoogleFonts.inter(fontSize: 14, height: 1.5),
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
              if (package.price != null) ...[
                const SizedBox(height: 16),
                Text(
                  '${package.currency} ${package.price!.toStringAsFixed(2)} / month',
                  style: GoogleFonts.ibmPlexMono(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
              if (package.highlights.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...package.highlights.map(
                  (highlight) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            highlight,
                            style: GoogleFonts.inter(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onBook,
                  icon: const Icon(Icons.event_available_outlined),
                  label: const Text('Book package'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
