import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/user_role.dart';
import '../domain/tool_models.dart';

final toolRepositoryProvider = Provider<ToolRepository>((ref) => ToolRepository());

class ToolRepository {
  ToolInventorySnapshot? _cache;
  DateTime? _lastFetched;
  bool _simulateOffline = false;

  static const _allowedRoles = {UserRole.provider, UserRole.serviceman};

  Future<ToolInventorySnapshot> fetchInventory(UserRole role, {bool forceRefresh = false}) async {
    if (!_allowedRoles.contains(role)) {
      throw ToolAccessDenied('Persona ${role.name} is not authorised to access tooling inventory.');
    }

    final now = DateTime.now();
    if (!forceRefresh && _cache != null && _lastFetched != null && now.difference(_lastFetched!) < const Duration(minutes: 5)) {
      return _cache!;
    }

    await Future<void>.delayed(const Duration(milliseconds: 450));

    if (_simulateOffline && _cache != null) {
      return ToolInventorySnapshot(
        items: _cache!.items,
        generatedAt: _cache!.generatedAt,
        offline: true,
        uptime: _cache!.uptime,
        readyCount: _cache!.readyCount,
        totalCount: _cache!.totalCount,
      );
    }

    final snapshot = _generateSnapshot();
    _cache = snapshot;
    _lastFetched = now;
    _simulateOffline = Random().nextInt(8) == 0; // occasionally flag offline mode
    return snapshot;
  }

  ToolInventorySnapshot _generateSnapshot() {
    final now = DateTime.now();
    final items = <ToolInventoryItem>[
      ToolInventoryItem(
        id: 'tool-thermal-cam',
        name: 'FLIR E8 Thermal Camera',
        category: 'Diagnostics',
        description: 'High-resolution thermal imaging with telemetry uplink for remote QA sign-off.',
        utilisation: 0.78,
        availability: 0.64,
        status: ToolStatus.calibrated,
        rentalRate: 145,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 12)),
        compliance: const ['PAT', 'RAMS', 'Telemetry'],
        depot: 'City of London depot',
      ),
      ToolInventoryItem(
        id: 'tool-laser-level',
        name: 'Hilti PR 30-HVS Laser Level',
        category: 'Deployment',
        description: 'Self-levelling laser with impact-resistant housing and live calibration data.',
        utilisation: 0.68,
        availability: 0.74,
        status: ToolStatus.inService,
        rentalRate: 95,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 21)),
        compliance: const ['LOLER', 'RAMS'],
        depot: 'Docklands logistics hub',
      ),
      ToolInventoryItem(
        id: 'tool-generator',
        name: 'Pramac GSW65 Generator',
        category: 'Power',
        description: '65kVA generator with remote fuel telemetry and geofenced security interlocks.',
        utilisation: 0.56,
        availability: 0.59,
        status: ToolStatus.maintenanceDue,
        rentalRate: 220,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 5)),
        compliance: const ['Fuel log', 'Insurance'],
        depot: 'Reading mega depot',
      ),
      ToolInventoryItem(
        id: 'tool-hvac-kit',
        name: 'HVAC Recovery Kit',
        category: 'Specialist kits',
        description: 'Complete HVAC recovery stack with safe-handling equipment and IoT temperature logging.',
        utilisation: 0.62,
        availability: 0.72,
        status: ToolStatus.calibrated,
        rentalRate: 180,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 17)),
        compliance: const ['F-Gas', 'COSHH'],
        depot: 'Manchester operations centre',
      ),
      ToolInventoryItem(
        id: 'tool-working-at-height',
        name: 'Working at Height Kit',
        category: 'Safety',
        description: 'Harnesses, fall arrest blocks, and inspection tags with NFC verification.',
        utilisation: 0.71,
        availability: 0.81,
        status: ToolStatus.inService,
        rentalRate: 58,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 9)),
        compliance: const ['LOLER', 'Inspection'],
        depot: 'Birmingham regional hub',
      ),
      ToolInventoryItem(
        id: 'tool-retired',
        name: 'Legacy Drill Rig',
        category: 'Retired assets',
        description: 'Retired from field use pending disposal and asset write-off.',
        utilisation: 0.12,
        availability: 0.15,
        status: ToolStatus.retired,
        rentalRate: null,
        currency: 'GBP',
        nextService: now.add(const Duration(days: 120)),
        compliance: const ['Asset log'],
        depot: 'Bristol storage',
      ),
    ];

    final readyCount = items.where((item) => item.status != ToolStatus.maintenanceDue && item.status != ToolStatus.retired).length;

    return ToolInventorySnapshot(
      items: items,
      generatedAt: now,
      offline: false,
      uptime: 99.3,
      readyCount: readyCount,
      totalCount: items.length,
    );
  }
}
