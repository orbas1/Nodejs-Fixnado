import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AppErrorBoundary from '../AppErrorBoundary.jsx';
import { LocaleProvider } from '../../../providers/LocaleProvider.jsx';

vi.mock('../../../utils/errorReporting.js', () => ({
  reportClientError: vi.fn().mockResolvedValue(true)
}));

function Wrapper({ children }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      },
      configurable: true
    });

    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: vi.fn().mockReturnValue('test-reference')
      },
      configurable: true
    });
  });

  it('renders children when no error occurs', () => {
    render(
      <Wrapper>
        <AppErrorBoundary>
          <p>hello world</p>
        </AppErrorBoundary>
      </Wrapper>
    );

    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('shows fallback UI when an error is thrown', async () => {
    const Boom = () => {
      throw new Error('Kaboom');
    };

    render(
      <Wrapper>
        <AppErrorBoundary>
          <Boom />
        </AppErrorBoundary>
      </Wrapper>
    );

    expect(await screen.findByText(/We hit a snag/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeVisible();
  });

  it('resets when resetKeys change', async () => {
    const { rerender } = render(
      <Wrapper>
        <AppErrorBoundary resetKeys={[0]}>
          <ThrowOnRender />
        </AppErrorBoundary>
      </Wrapper>
    );

    expect(await screen.findByText(/We hit a snag/i)).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AppErrorBoundary resetKeys={[1]}>
          <p>Recovered</p>
        </AppErrorBoundary>
      </Wrapper>
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

function ThrowOnRender() {
  throw new Error('render failure');
}
