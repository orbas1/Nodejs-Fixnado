import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import Skeleton from '../ui/Skeleton.jsx';
import './widgets.css';

function TooltipContent({ active, payload, label, valueFormatter, targetKey, valueKey }) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload.find((entry) => entry.dataKey === valueKey);
  const target = payload.find((entry) => entry.dataKey === targetKey);

  return (
    <div className="fx-widget__tooltip">
      <p className="font-semibold">{label}</p>
      {value ? <p>{valueFormatter(value.value)}</p> : null}
      {target ? <p className="mt-1 text-slate-200">Target: {valueFormatter(target.value)}</p> : null}
    </div>
  );
}

TooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  valueFormatter: PropTypes.func.isRequired,
  targetKey: PropTypes.string,
  valueKey: PropTypes.string.isRequired
};

TooltipContent.defaultProps = {
  active: false,
  payload: undefined,
  label: undefined,
  targetKey: undefined
};

export default function TrendChart({
  data,
  valueKey,
  targetKey,
  color,
  targetColor,
  yAxisFormatter,
  tooltipFormatter,
  referenceTarget,
  height
}) {
  if (!data?.length) {
    return <Skeleton className="h-40" />;
  }

  return (
    <div className="fx-widget__chart-container" data-size={height === 320 ? 'lg' : 'md'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="85%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(148, 163, 184, 0.35)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'var(--fx-color-text-tertiary)' }}
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            width={60}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: 'var(--fx-color-text-tertiary)' }}
          />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.08, strokeWidth: 40 }}
            content={
              <TooltipContent
                valueFormatter={tooltipFormatter}
                targetKey={targetKey}
                valueKey={valueKey}
              />
            }
          />
          {referenceTarget ? (
            <ReferenceLine
              y={referenceTarget}
              stroke={targetColor}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Target', position: 'insideTopRight', fill: targetColor }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey={valueKey}
            stroke={color}
            strokeWidth={3}
            fill="url(#trendGradient)"
          />
          {targetKey ? (
            <Area
              type="monotone"
              dataKey={targetKey}
              stroke={targetColor}
              strokeDasharray="6 6"
              fill="transparent"
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

TrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number
    })
  ),
  valueKey: PropTypes.string,
  targetKey: PropTypes.string,
  color: PropTypes.string,
  targetColor: PropTypes.string,
  yAxisFormatter: PropTypes.func,
  tooltipFormatter: PropTypes.func,
  referenceTarget: PropTypes.number,
  height: PropTypes.number
};

TrendChart.defaultProps = {
  data: undefined,
  valueKey: 'value',
  targetKey: undefined,
  color: 'var(--fx-color-brand-primary)',
  targetColor: 'var(--fx-color-success)',
  yAxisFormatter: (value) => `${value}`,
  tooltipFormatter: (value) => value,
  referenceTarget: undefined,
  height: 260
};
