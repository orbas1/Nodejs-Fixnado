import PropTypes from 'prop-types';
import { SECTION_DESCRIPTION_CLASS, SECTION_HEADER_CLASS, SECTION_TITLE_CLASS } from './constants.js';

export default function SectionHeader({ label, description }) {
  return (
    <div className={SECTION_HEADER_CLASS}>
      <h2 className={SECTION_TITLE_CLASS}>{label}</h2>
      <p className={SECTION_DESCRIPTION_CLASS}>{description}</p>
    </div>
  );
}

SectionHeader.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string
};

SectionHeader.defaultProps = {
  description: undefined
};
