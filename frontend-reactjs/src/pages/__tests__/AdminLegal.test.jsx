import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../api/legalAdminClient.js', () => {
  return {
    listAdminLegalDocuments: vi.fn(),
    getAdminLegalDocument: vi.fn(),
    createAdminLegalDocument: vi.fn(),
    createAdminLegalDraft: vi.fn(),
    updateAdminLegalDraft: vi.fn(),
    updateAdminLegalDocument: vi.fn(),
    publishAdminLegalVersion: vi.fn(),
    archiveAdminLegalDraft: vi.fn(),
    deleteAdminLegalDocument: vi.fn()
  };
});

const legalAdminClient = await import('../../api/legalAdminClient.js');

import AdminLegal from '../AdminLegal.jsx';

describe('AdminLegal page', () => {
  const summaryFixture = {
    documents: [
      {
        id: 'doc-1',
        slug: 'terms-of-service',
        title: 'Terms of Service',
        summary: 'Our core agreement',
        heroImageUrl: null,
        owner: 'Legal team',
        contactEmail: 'legal@fixnado.test',
        contactPhone: '+44123456789',
        contactUrl: 'https://fixnado.test/legal/terms',
        reviewCadence: 'Quarterly',
        statusLabel: 'Draft v2 awaiting review',
        publishedVersion: null,
        draftVersion: {
          id: 'ver-2',
          version: 2,
          updatedAt: '2024-04-10T12:00:00.000Z',
          changeNotes: 'Refreshed consumer duties',
          effectiveAt: '2024-04-15T12:00:00.000Z'
        },
        health: {
          nextEffective: '2024-04-15T12:00:00.000Z',
          lastPublished: null,
          reviewCadence: 'Quarterly'
        },
        previewPath: '/legal/terms-of-service'
      }
    ],
    stats: { publishedCount: 0, draftCount: 1 },
    timeline: [
      {
        id: 'timeline-1',
        documentId: 'doc-1',
        slug: 'terms-of-service',
        title: 'Terms of Service',
        version: 2,
        status: 'draft',
        updatedAt: '2024-04-10T12:00:00.000Z',
        actor: 'legal@fixnado.test'
      }
    ]
  };

  const detailFixture = {
    id: 'doc-1',
    slug: 'terms-of-service',
    title: 'Terms of Service',
    summary: 'Our core agreement',
    heroImageUrl: null,
    owner: 'Legal team',
    contactEmail: 'legal@fixnado.test',
    contactPhone: '+44123456789',
    contactUrl: 'https://fixnado.test/legal/terms',
    reviewCadence: 'Quarterly',
    currentVersion: {
      id: 'ver-1',
      documentId: 'doc-1',
      version: 1,
      status: 'published',
      changeNotes: 'Original launch',
      attachments: [],
      content: {
        hero: {
          eyebrow: 'Legal library',
          title: 'Terms of Service',
          summary: 'Our promise to customers'
        },
        sections: [],
        attachments: []
      },
      publishedAt: '2024-03-15T09:00:00.000Z'
    },
    draftVersion: {
      id: 'ver-2',
      documentId: 'doc-1',
      version: 2,
      status: 'draft',
      changeNotes: 'Refreshed consumer duties',
      updatedAt: '2024-04-10T12:00:00.000Z',
      attachments: [],
      content: {
        hero: {
          eyebrow: 'Legal library',
          title: 'Terms of Service',
          summary: 'Our promise to customers'
        },
        sections: [],
        attachments: []
      }
    },
    versions: [
      {
        id: 'ver-2',
        documentId: 'doc-1',
        version: 2,
        status: 'draft',
        changeNotes: 'Refreshed consumer duties',
        updatedAt: '2024-04-10T12:00:00.000Z'
      },
      {
        id: 'ver-1',
        documentId: 'doc-1',
        version: 1,
        status: 'published',
        changeNotes: 'Original launch',
        updatedAt: '2024-03-15T09:00:00.000Z'
      }
    ]
  };


  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function resetMocks() {
    Object.values(legalAdminClient).forEach((fn) => {
      if (typeof fn.mockReset === 'function') {
        fn.mockReset();
      }
    });
  }

  beforeEach(() => {
    resetMocks();
    legalAdminClient.listAdminLegalDocuments.mockResolvedValue(clone(summaryFixture));
    legalAdminClient.getAdminLegalDocument.mockResolvedValue(clone(detailFixture));
    legalAdminClient.createAdminLegalDocument.mockImplementation(async () => clone(detailFixture));
    legalAdminClient.updateAdminLegalDocument.mockImplementation(async () => clone(detailFixture));
  });

  function renderPage(initialPath = '/admin/legal/terms-of-service') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/legal/:slug" element={<AdminLegal />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('opens the create modal and previews slug updates', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Document metadata')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new policy/i }));
    expect(await screen.findByRole('heading', { name: 'Create legal policy' })).toBeInTheDocument();

    const slugInput = screen.getByLabelText('Policy slug');
    await user.type(slugInput, ' Annual Update');

    expect(screen.getByText('Preview: /legal/annual-update')).toBeInTheDocument();
  });

  it('adds attachment rows when requested', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('No attachments yet. Link supporting artefacts or compliance PDFs here.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add attachment/i }));

    expect(screen.getByLabelText('Label')).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });

  it('duplicates and reorders sections', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Sections')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add section/i }));

    const headingInput = screen.getByLabelText('Heading');
    await user.type(headingInput, 'Eligibility');

    await user.click(screen.getByRole('button', { name: /duplicate section 1/i }));

    const headings = screen.getAllByLabelText('Heading');
    expect(headings).toHaveLength(2);
    expect(headings[1]).toHaveValue('Eligibility (Copy)');

    await user.click(screen.getByRole('button', { name: /move section 2 up/i }));

    const reorderedHeadings = screen.getAllByLabelText('Heading');
    expect(reorderedHeadings[0]).toHaveValue('Eligibility (Copy)');
  });

  it('offers live preview access from the publishing card', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: /preview live policy/i })).toHaveAttribute(
      'href',
      '/legal/terms-of-service'
    );
  });

  it('renders version history with statuses', async () => {
    renderPage();

    expect(await screen.findByText('Version history')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getAllByText(/draft|published/i).length).toBeGreaterThan(0);
    });
  });
});
