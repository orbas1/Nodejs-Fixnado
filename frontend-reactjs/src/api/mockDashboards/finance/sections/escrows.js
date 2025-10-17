export const financeEscrowsSection = {
  id: 'escrows',
  icon: 'pipeline',
  label: 'Escrow Pipeline',
  menuLabel: 'Escrows',
  description: 'Track escrow balances and release readiness per contract.',
  type: 'table',
  data: {
    headers: ['Escrow ID', 'Client', 'Balance', 'Status', 'Release window'],
    rows: [
      ['ESC-7712', 'City Works Co-op', '£46,800', 'Clearing verification', 'Releases 18 Mar'],
      ['ESC-7698', 'Metro Build Guild', '£32,400', 'Docs received', 'Releases 16 Mar'],
      ['ESC-7682', 'Harbour Resorts', '£21,900', 'Awaiting QA sign-off', 'Releases 22 Mar'],
      ['ESC-7655', 'Northline Manufacturing', '£18,600', 'Hold – billing dispute', 'Manual review'],
      ['ESC-7641', 'Atlas Logistics', '£12,200', 'Release scheduled', 'Releases 15 Mar']
    ]
  }
};

export default financeEscrowsSection;
