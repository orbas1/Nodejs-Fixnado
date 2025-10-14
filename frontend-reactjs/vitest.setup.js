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
    const createRect = (target) => {
      if (target && typeof target.getBoundingClientRect === 'function') {
        return target.getBoundingClientRect();
      }

      return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    };

    class ResizeObserverMock {
      constructor(callback = () => {}) {
        this.callback = callback;
        this.observedElements = new Set();
      }

      observe(target) {
        this.observedElements.add(target);
        if (typeof this.callback === 'function') {
          this.callback(
            [
              {
                target,
                contentRect: createRect(target)
              }
            ],
            this
          );
        }
      }

      unobserve(target) {
        this.observedElements.delete(target);
      }

      disconnect() {
        this.observedElements.clear();
      }
    }

    window.ResizeObserver = ResizeObserverMock;
    globalThis.ResizeObserver = ResizeObserverMock;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}
