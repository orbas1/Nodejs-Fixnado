import PropTypes from 'prop-types';

export default function StorefrontStatCard({ label, value, caption }) {
  return (
    <article className="provider-dashboard__card">
      <p className="provider-dashboard__card-label">{label}</p>
      <p className="provider-dashboard__card-title text-2xl">{value}</p>
      {caption ? <p className="provider-dashboard__card-meta">{caption}</p> : null}
    </article>
  );
}

StorefrontStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string
};

StorefrontStatCard.defaultProps = {
  caption: null
};
