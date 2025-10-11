import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Skeleton from '../ui/Skeleton.jsx';
import './widgets.css';

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="fx-widget__tooltip">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="mt-1">
          {item.name}: <strong>{item.value}</strong>
        </p>
      ))}
    </div>
  );
}

TooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

TooltipContent.defaultProps = {
  active: false,
  payload: undefined,
  label: undefined
};

export default function ComparisonBarChart({ data, primaryKey, secondaryKey, primaryColor, secondaryColor }) {
  if (!data?.length) {
    return <Skeleton className="h-40" />;
  }

  return (
    <div className="fx-widget__chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="rgba(148,163,184,0.3)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--fx-color-text-tertiary)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--fx-color-text-tertiary)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(15, 23, 42, 0.06)' }} />
          <Bar dataKey={primaryKey} name="Resolved" radius={[10, 10, 10, 10]} fill={primaryColor} barSize={18} />
          <Bar dataKey={secondaryKey} name="Escalated" radius={[10, 10, 10, 10]} fill={secondaryColor} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

ComparisonBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      resolved: PropTypes.number,
      escalated: PropTypes.number
    })
  ),
  primaryKey: PropTypes.string,
  secondaryKey: PropTypes.string,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string
};

ComparisonBarChart.defaultProps = {
  data: undefined,
  primaryKey: 'resolved',
  secondaryKey: 'escalated',
  primaryColor: 'var(--fx-color-brand-primary)',
  secondaryColor: 'var(--fx-color-danger)'
};
