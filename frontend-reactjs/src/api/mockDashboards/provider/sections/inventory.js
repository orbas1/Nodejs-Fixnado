export const providerInventorySection = {
  id: 'inventory',
  icon: 'assets',
  label: 'Tools & Materials',
  menuLabel: 'Inventory',
  description: 'Inventory availability, utilisation, and alert posture.',
  type: 'inventory',
  data: {
    summary: [
      { id: 'available', label: 'Available units', value: 84, helper: '12 SKUs tracked', tone: 'info' },
      { id: 'reserved', label: 'Reserved', value: 18, helper: '102 on hand', tone: 'accent' },
      { id: 'alerts', label: 'Alerts', value: 2, helper: 'Action required', tone: 'warning' }
    ],
    groups: [
      {
        id: 'materials',
        label: 'Materials',
        items: [
          {
            id: 'mat-1',
            name: 'Bio-cleanse concentrate',
            sku: 'MAT-BC-01',
            category: 'Sanitation',
            status: 'healthy',
            available: 36,
            onHand: 48,
            reserved: 12,
            safetyStock: 8,
            unitType: 'litres',
            condition: 'excellent',
            location: 'Docklands depot',
            nextMaintenanceDue: '2025-04-12',
            notes: 'Lot #221-B stable. Auto-reorder enabled.',
            activeAlerts: 0,
            activeRentals: 0
          },
          {
            id: 'mat-2',
            name: 'HVAC filter packs',
            sku: 'MAT-HVAC-07',
            category: 'HVAC',
            status: 'low_stock',
            available: 8,
            onHand: 24,
            reserved: 16,
            safetyStock: 6,
            unitType: 'packs',
            condition: 'good',
            location: 'North hub',
            nextMaintenanceDue: '2025-03-28',
            notes: 'Vendor replenishment ETA 3 days.',
            activeAlerts: 1,
            alertSeverity: 'warning',
            activeRentals: 0
          }
        ]
      },
      {
        id: 'tools',
        label: 'Tools',
        items: [
          {
            id: 'tool-1',
            name: 'Thermal imaging kit',
            sku: 'TL-THERM-04',
            category: 'Diagnostics',
            status: 'healthy',
            available: 6,
            onHand: 10,
            reserved: 4,
            safetyStock: 3,
            unitType: 'kits',
            condition: 'excellent',
            location: 'Fleet workshop',
            nextMaintenanceDue: '2025-05-02',
            rentalRate: 180,
            rentalRateCurrency: 'GBP',
            depositAmount: 450,
            depositCurrency: 'GBP',
            notes: 'Calibration synced weekly.',
            activeAlerts: 0,
            activeRentals: 2
          },
          {
            id: 'tool-2',
            name: 'Tower lighting rig',
            sku: 'TL-LIGHT-12',
            category: 'Access',
            status: 'stockout',
            available: 0,
            onHand: 4,
            reserved: 4,
            safetyStock: 2,
            unitType: 'units',
            condition: 'needs_service',
            location: 'Logistics yard',
            nextMaintenanceDue: '2025-03-22',
            rentalRate: 260,
            rentalRateCurrency: 'GBP',
            depositAmount: 600,
            depositCurrency: 'GBP',
            notes: 'Inspection overdue • awaiting parts.',
            activeAlerts: 2,
            alertSeverity: 'critical',
            activeRentals: 3
          }
        ]
      }
    ]
  }
};

export default providerInventorySection;
