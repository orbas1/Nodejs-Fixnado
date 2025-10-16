export function formatTimestamp(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (error) {
    return String(value);
  }
}

export function getOptionLabel(options, value, fallback) {
  const option = options.find((candidate) => candidate.value === value);
  return option?.label ?? fallback ?? value;
}
