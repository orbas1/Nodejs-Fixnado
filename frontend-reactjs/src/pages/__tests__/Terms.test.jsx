import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../api/legalClient.js', () => ({
  getPublishedLegalDocument: vi.fn()
}));

const { getPublishedLegalDocument } = await import('../../api/legalClient.js');

import Terms from '../Terms.jsx';

describe('Terms page', () => {
  const policy = {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'Our promise to protect your data.',
    owner: 'Legal Team',
    contactEmail: 'privacy@fixnado.test',
    contactPhone: '+44 1234 567890',
    contactUrl: 'https://fixnado.test/legal/privacy',
    version: {
      hero: {
        eyebrow: 'Legal Library',
        title: 'Privacy Policy',
        summary: 'How we handle your information.'
      },
      effectiveAt: '2024-05-01T09:00:00.000Z',
      publishedAt: '2024-05-02T09:00:00.000Z',
      sections: [
        {
          id: 'introduction',
          title: 'Introduction',
          summary: 'What this policy covers',
          body: ['This explains the basics of the policy.']
        },
        {
          id: 'data-usage',
          title: 'How we use data',
          summary: 'Transparency matters',
          body: ['We only use data to provide services.', 'You can opt out at any time.']
        }
      ],
      attachments: [
        {
          id: 'attachment-1',
          label: 'Supervisory authority letter',
          description: 'Latest ICO correspondence',
          url: 'https://fixnado.test/legal/ico-letter.pdf'
        }
      ],
      contact: {
        email: 'privacy@fixnado.test',
        phone: '+44 1234 567890',
        url: 'https://fixnado.test/legal/privacy'
      }
    }
  };

  function clonePolicy() {
    return JSON.parse(JSON.stringify(policy));
  }

  beforeEach(() => {
    getPublishedLegalDocument.mockResolvedValue(clonePolicy());
    window.print = vi.fn();
  });

  it('renders dynamic policy details for the requested slug', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/legal/privacy']}>
        <Routes>
          <Route path="/legal/:slug" element={<Terms />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(policy.version.hero.summary)).toBeInTheDocument();

    const firstSection = policy.version.sections[0];
    expect(await screen.findByRole('heading', { name: firstSection.title })).toBeInTheDocument();
    if (firstSection.summary) {
      expect(screen.getByText(firstSection.summary, { exact: false })).toBeInTheDocument();
    }
    firstSection.body.forEach((paragraph) => {
      expect(screen.queryByText(paragraph)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Read' }));

    const secondSection = policy.version.sections[1];
    secondSection.body.forEach((paragraph) => {
      expect(screen.queryByText(paragraph)).not.toBeInTheDocument();
    });

    const sectionNavButton = screen.getByRole('button', { name: secondSection.title });
    await user.click(sectionNavButton);

    expect(await screen.findByRole('heading', { name: secondSection.title })).toBeInTheDocument();
    if (secondSection.summary) {
      expect(screen.getByText(secondSection.summary, { exact: false })).toBeInTheDocument();
    }
    secondSection.body.forEach((paragraph) => {
      expect(screen.queryByText(paragraph)).not.toBeInTheDocument();
    });

    const openButton = screen.getByRole('button', { name: 'Open' });
    await user.click(openButton);

    await waitFor(() => {
      secondSection.body.forEach((paragraph) => {
        expect(screen.getByText(paragraph)).toBeInTheDocument();
      });
    });

    const doneButton = screen.getByRole('button', { name: 'Done' });
    await user.click(doneButton);

    await user.click(screen.getByRole('button', { name: 'Info' }));
    expect(screen.getByText('Supervisory authority letter')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Help' }));
    const supportPanel = screen.getByRole('heading', { name: 'Talk with us' }).closest('article');
    const helpers = within(supportPanel);
    expect(helpers.getByRole('link', { name: /Email/ })).toHaveAttribute(
      'href',
      `mailto:${policy.version.contact.email}`
    );
    expect(helpers.getByRole('link', { name: /Site/ })).toHaveAttribute('href', policy.version.contact.url);
  });

  it('prints the policy when download button is activated', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/legal/privacy']}>
        <Routes>
          <Route path="/legal/:slug" element={<Terms />} />
        </Routes>
      </MemoryRouter>
    );

    const exportButton = await screen.findByRole('button', { name: /export/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(window.print).toHaveBeenCalledTimes(1);
    });
  });
});
