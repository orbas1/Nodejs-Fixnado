export function resolveRiskTone(risk) {
  const value = typeof risk === 'string' ? risk.toLowerCase() : '';
  if (value.includes('critical') || value.includes('risk')) return 'danger';
  if (value.includes('warning') || value.includes('watch')) return 'warning';
  if (value.includes('hold') || value.includes('paused')) return 'info';
  return 'success';
}
