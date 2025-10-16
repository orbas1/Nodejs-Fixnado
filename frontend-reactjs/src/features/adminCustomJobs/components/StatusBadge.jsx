import PropTypes from 'prop-types';
import { StatusPill } from '../../../components/ui/index.js';
import { STATUS_CONFIG } from '../constants.js';

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}

StatusBadge.propTypes = {
  status: PropTypes.string
};
