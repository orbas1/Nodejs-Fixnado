export const createWindow = () => ({
  label: 'Next 30 days',
  start: '2025-03-01T00:00:00Z',
  end: '2025-03-30T23:59:59Z',
  timezone: (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
    } catch {
      return 'Europe/London';
    }
  })()
});

export default { createWindow };
