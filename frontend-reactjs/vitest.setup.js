import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    });
  }

  if (typeof window.ResizeObserver !== 'function') {
    window.ResizeObserver = class {
      constructor(callback = () => {}) {
        this.callback = callback;
      }

      observe() {}

      unobserve() {}

      disconnect() {}
    };
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}
