import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Terms from '../Terms.jsx';
import termsDocument from '../../data/legal/uk_terms.json';

describe('Terms page', () => {
  it('renders metadata and all sections', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Terms and Conditions/i })).toBeInTheDocument();
    expect(screen.getByText(termsDocument.effectiveDate)).toBeInTheDocument();
    termsDocument.sections.forEach((section) => {
      expect(screen.getByRole('heading', { name: section.title })).toBeInTheDocument();
      if (section.summary) {
        expect(screen.getByText(section.summary, { exact: false })).toBeInTheDocument();
      }
    });
    expect(screen.getByText(termsDocument.acceptance.statement)).toBeInTheDocument();
  });
});
