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

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (typeof window.ResizeObserver !== 'function') {
    class ResizeObserverMock {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {}

      unobserve() {}

      disconnect() {}
    }

    window.ResizeObserver = ResizeObserverMock;
    global.ResizeObserver = ResizeObserverMock;
  }
}
