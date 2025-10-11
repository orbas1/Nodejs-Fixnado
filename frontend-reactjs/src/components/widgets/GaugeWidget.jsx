import PropTypes from 'prop-types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import Skeleton from '../ui/Skeleton.jsx';
import StatusPill from '../ui/StatusPill.jsx';
import './widgets.css';

export default function GaugeWidget({ value, target, max, caption, tone }) {
  const data = [
    { name: 'progress', value, fill: 'var(--fx-color-brand-primary)' },
    { name: 'remainder', value: max - value, fill: 'rgba(20,69,224,0.12)' }
  ];

  if (value === undefined) {
    return <Skeleton className="h-48" />;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: '220px', height: '160px' }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={20}
            startAngle={180}
            endAngle={0}
            data={data}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, max]}
              tick={false}
            />
            <RadialBar cornerRadius={20} background dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center">
        <p className="text-4xl font-semibold text-primary">{value}%</p>
        <p className="text-sm text-slate-600">Target {target}%</p>
        {caption ? <p className="mt-2 max-w-xs text-sm text-slate-500">{caption}</p> : null}
      </div>
      <StatusPill tone={tone}>{value >= target ? 'On Track' : 'Monitor'}</StatusPill>
    </div>
  );
}

GaugeWidget.propTypes = {
  value: PropTypes.number,
  target: PropTypes.number,
  max: PropTypes.number,
  caption: PropTypes.string,
  tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info'])
};

GaugeWidget.defaultProps = {
  value: undefined,
  target: 0,
  max: 100,
  caption: undefined,
  tone: 'info'
};
