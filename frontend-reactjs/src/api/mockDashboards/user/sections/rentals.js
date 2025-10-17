export const userRentalsSection = {
  id: 'rentals',
  icon: 'assets',
  label: 'Rental Desk',
  menuLabel: 'Rentals',
  description: 'Active rentals, deposits, and available inventory.',
  type: 'rentals',
  data: {
    defaults: {
      timezone: 'Europe/London',
      currency: 'GBP',
      renterId: 'USR-2488'
    },
    rentals: [
      {
        id: 'RENT-1201',
        rentalNumber: 'RN-1201',
        status: 'in_use',
        depositStatus: 'held',
        quantity: 2,
        renterId: 'USR-2488',
        pickupAt: '2025-03-12T08:30:00Z',
        returnDueAt: '2025-03-19T17:00:00Z',
        depositAmount: 800,
        depositCurrency: 'GBP',
        dailyRate: 160,
        rateCurrency: 'GBP',
        item: {
          id: 'INV-810',
          name: 'Dehumidifier kit',
          sku: 'DH-02',
          rentalRate: 160,
          rentalRateCurrency: 'GBP',
          depositAmount: 400,
          depositCurrency: 'GBP'
        },
        timeline: [
          {
            id: 'pickup',
            type: 'pickup',
            description: 'Picked up at logistics hub',
            recordedBy: 'Logistics',
            occurredAt: '2025-03-12T08:45:00Z'
          },
          {
            id: 'inspection',
            type: 'inspection',
            description: 'Pre-flight inspection logged',
            recordedBy: 'Ops',
            occurredAt: '2025-03-12T09:05:00Z'
          }
        ]
      },
      {
        id: 'RENT-1207',
        rentalNumber: 'RN-1207',
        status: 'inspection_pending',
        depositStatus: 'pending',
        quantity: 1,
        renterId: 'USR-2488',
        pickupAt: '2025-03-05T10:00:00Z',
        returnDueAt: '2025-03-16T12:00:00Z',
        depositAmount: 300,
        depositCurrency: 'GBP',
        dailyRate: 95,
        rateCurrency: 'GBP',
        item: {
          id: 'INV-214',
          name: 'Thermal camera',
          sku: 'TC-05',
          rentalRate: 95,
          rentalRateCurrency: 'GBP',
          depositAmount: 300,
          depositCurrency: 'GBP'
        },
        timeline: [
          {
            id: 'pickup',
            type: 'pickup',
            description: 'Collected by Avery Stone',
            recordedBy: 'Ops',
            occurredAt: '2025-03-05T10:10:00Z'
          },
          {
            id: 'return_due',
            type: 'return_due',
            description: 'Return booked',
            recordedBy: 'Automation',
            occurredAt: '2025-03-16T12:00:00Z'
          }
        ]
      }
    ],
    inventoryCatalogue: [
      { id: 'INV-810', name: 'Dehumidifier kit', sku: 'DH-02', rentalRate: 160, rentalRateCurrency: 'GBP', depositAmount: 400, depositCurrency: 'GBP' },
      { id: 'INV-214', name: 'Thermal camera', sku: 'TC-05', rentalRate: 95, rentalRateCurrency: 'GBP', depositAmount: 300, depositCurrency: 'GBP' },
      { id: 'INV-552', name: 'Floor scrubber', sku: 'FS-11', rentalRate: 120, rentalRateCurrency: 'GBP', depositAmount: 250, depositCurrency: 'GBP' }
    ],
    escrow: {
      currency: 'GBP',
      totals: {
        pending: 300,
        held: 800,
        released: 1250,
        forfeited: 0,
        partially_released: 120
      }
    }
  }
};

export default userRentalsSection;
