export const providerFinanceSection = {
  id: 'finance',
  icon: 'finance',
  label: 'Revenue & Billing',
  menuLabel: 'Finance',
  description: 'Cashflow pacing, invoice status, and margin insights.',
  type: 'grid',
  data: {
    cards: [
      {
        title: 'Cash position',
        details: ['£212k cash on hand', '£58k payable in 10 days', '£312k receivables'],
        accent: 'from-emerald-100 via-white to-white'
      },
      {
        title: 'Invoice health',
        details: ['18 invoices this month', '2 invoices >10 days', 'Average payment 6.2 days'],
        accent: 'from-sky-100 via-white to-white'
      },
      {
        title: 'Margin focus',
        details: ['Gross margin 41%', 'Labour share 46%', 'Material cost +6% vs plan'],
        accent: 'from-amber-100 via-white to-white'
      }
    ]
  }
};

export default providerFinanceSection;
