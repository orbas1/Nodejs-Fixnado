import PropTypes from 'prop-types';

function FormStatus({ status }) {
  if (!status?.message) {
    return null;
  }

  const toneClasses = status.type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>
      {status.message}
    </div>
  );
}

FormStatus.propTypes = {
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

FormStatus.defaultProps = {
  status: null
};

export default FormStatus;
