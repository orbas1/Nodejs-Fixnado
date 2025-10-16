import PropTypes from 'prop-types';
import { StatusPill } from '../../../components/ui/index.js';

export default function FeedbackToast({ feedback, error }) {
  if (!feedback && !error) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {feedback ? <StatusPill tone={feedback.tone}>{feedback.message}</StatusPill> : null}
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
    </div>
  );
}

FeedbackToast.propTypes = {
  feedback: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'danger', 'warning', 'info']).isRequired,
    message: PropTypes.string.isRequired
  }),
  error: PropTypes.string
};
