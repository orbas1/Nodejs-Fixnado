import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import Textarea from './Textarea.jsx';

const TextArea = forwardRef(function TextArea(props, ref) {
  return <Textarea {...props} ref={ref} />;
});

TextArea.displayName = 'TextArea';

TextArea.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  rows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  textareaClassName: PropTypes.string
};

TextArea.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  rows: 4,
  className: undefined,
  textareaClassName: undefined
};

export default TextArea;
