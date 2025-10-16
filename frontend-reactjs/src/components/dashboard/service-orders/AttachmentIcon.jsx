import PropTypes from 'prop-types';
import { ClipboardDocumentListIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';

function AttachmentIcon({ type }) {
  if (type === 'image') {
    return <PhotoIcon className="h-4 w-4 text-primary" aria-hidden="true" />;
  }
  if (type === 'document') {
    return <ClipboardDocumentListIcon className="h-4 w-4 text-primary" aria-hidden="true" />;
  }
  return <LinkIcon className="h-4 w-4 text-primary" aria-hidden="true" />;
}

AttachmentIcon.propTypes = {
  type: PropTypes.string
};

AttachmentIcon.defaultProps = {
  type: 'link'
};

export default AttachmentIcon;
