import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ToolSalesManagement from '../ToolSalesManagement.jsx';

vi.mock('../../../api/panelClient.js', () => ({
  getProviderToolSales: vi.fn().mockResolvedValue({
    data: {
      summary: {
        totalListings: 1,
        draft: 0,
        published: 1,
        suspended: 0,
        totalQuantity: 8,
        activeCoupons: 1
      },
      listings: [
        {
          id: 'listing-1',
          name: 'Impact Driver Pro',
          tagline: 'Cordless torque champion',
          description: 'Engineered for rapid-fire anchor installs across tight ceilings.',
          heroImageUrl: 'https://cdn.fixnado.example/tools/impact-driver.jpg',
          showcaseVideoUrl: 'https://cdn.fixnado.example/tools/impact-driver.mp4',
          galleryImages: ['https://cdn.fixnado.example/tools/gallery-1.jpg'],
          tags: ['Power tools'],
          keywordTags: ['driver', 'impact'],
          listing: {
            status: 'approved',
            availability: 'buy',
            pricePerDay: 75,
            purchasePrice: 340,
            insuredOnly: false
          },
          inventory: {
            quantityOnHand: 10,
            quantityReserved: 2,
            safetyStock: 1
          },
          coupons: [
            {
              id: 'coupon-1',
              name: 'Launch offer',
              code: 'LAUNCH10',
              status: 'active',
              discountType: 'percentage',
              discountValue: 10
            }
          ],
          metrics: {
            quantityAvailable: 8,
            activeCoupons: 1
          }
        }
      ]
    }
  }),
  createProviderToolSale: vi.fn().mockResolvedValue({ data: {} }),
  updateProviderToolSale: vi.fn().mockResolvedValue({ data: {} }),
  deleteProviderToolSale: vi.fn().mockResolvedValue({ data: {} }),
  createProviderToolSaleCoupon: vi.fn().mockResolvedValue({ data: {} }),
  updateProviderToolSaleCoupon: vi.fn().mockResolvedValue({ data: {} }),
  deleteProviderToolSaleCoupon: vi.fn().mockResolvedValue({ data: {} })
}));

describe('ToolSalesManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary metrics and listings', async () => {
    render(<ToolSalesManagement initialData={undefined} />);

    expect(screen.getByText('Tool sale management')).toBeInTheDocument();
    expect(await screen.findByText('Total listings')).toBeInTheDocument();
    expect(await screen.findByText('Impact Driver Pro')).toBeInTheDocument();
    expect(await screen.findByText('Manage coupons (1)')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Watch showcase' })).toHaveAttribute(
      'href',
      'https://cdn.fixnado.example/tools/impact-driver.mp4'
    );
  });

  it('opens the create listing modal when requested', async () => {
    const user = userEvent.setup();
    render(<ToolSalesManagement initialData={{ summary: { totalListings: 0 }, listings: [] }} />);

    await user.click(screen.getByRole('button', { name: 'Create tool listing' }));

    expect(await screen.findByRole('heading', { name: 'Create tool listing' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
