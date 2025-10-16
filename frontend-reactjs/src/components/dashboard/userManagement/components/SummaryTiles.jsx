import PropTypes from 'prop-types';
import { Card } from '../../../ui/index.js';

function SummaryTile({ label, value, helper, icon: Icon }) {
  return (
    <Card className="flex items-center gap-4 border border-slate-200/80 bg-white/95 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {Icon ? <Icon className="h-6 w-6" aria-hidden="true" /> : '👤'}
      </div>
      <div>
        <p className="text-sm font-semibold text-primary">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
    </Card>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  icon: PropTypes.elementType
};

SummaryTile.defaultProps = {
  helper: undefined,
  icon: undefined
};

function SummaryTiles({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((tile) => (
        <SummaryTile key={tile.label} {...tile} />
      ))}
    </div>
  );
}

SummaryTiles.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      helper: PropTypes.string,
      icon: PropTypes.elementType
    })
  )
};

SummaryTiles.defaultProps = {
  stats: []
};

export default SummaryTiles;
