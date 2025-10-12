import PropTypes from 'prop-types';
import { useLocale } from '../../hooks/useLocale.js';

export default function SkipToContent({ targetId }) {
  const { t } = useLocale();

  return (
    <a className="skip-nav-link" href={`#${targetId}`} data-qa="skip-to-content">
      {t('nav.skip')}
    </a>
  );
}

SkipToContent.propTypes = {
  targetId: PropTypes.string
};

SkipToContent.defaultProps = {
  targetId: 'main-content'
};

