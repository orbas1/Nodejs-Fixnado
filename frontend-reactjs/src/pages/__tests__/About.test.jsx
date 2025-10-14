import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from '../About.jsx';

describe('About page', () => {
  it('renders mission and trust content with enterprise signals', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Building the trusted infrastructure for complex fix and response programmes/i
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/Operational discipline/i)).toBeInTheDocument();
    expect(screen.getByText(/ISO 27001 & SOC 2 Type II/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-the-sun coverage/i)).toBeInTheDocument();

    const stats = screen.getAllByText(/programme|specialists|payouts|centres/i, { selector: 'p' });
    expect(stats.length).toBeGreaterThanOrEqual(4);
  });

  it('provides launch readiness call to action', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Explore live dashboards/i })).toHaveAttribute('href', '/dashboards');
    expect(screen.getByRole('link', { name: /Schedule readiness review/i })).toHaveAttribute(
      'href',
      '/communications'
    );
  });
});
