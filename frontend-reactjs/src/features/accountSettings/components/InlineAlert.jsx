import PropTypes from 'prop-types';

function InlineAlert({ tone, message }) {
  if (!message) return null;
  const toneClass = tone === 'success' ? 'text-emerald-600' : 'text-rose-600';
  return <p className={`text-sm font-medium ${toneClass}`}>{message}</p>;
}

InlineAlert.propTypes = {
  tone: PropTypes.oneOf(['success', 'error']).isRequired,
  message: PropTypes.string
};

InlineAlert.defaultProps = {
  message: null
};

export default InlineAlert;
