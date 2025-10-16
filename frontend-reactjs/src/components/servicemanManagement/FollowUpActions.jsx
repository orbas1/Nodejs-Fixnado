import PropTypes from 'prop-types';

export default function FollowUpActions({ actions }) {
  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold text-primary">Oversight actions</h3>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {(actions ?? []).map((action) => (
          <li key={action} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

FollowUpActions.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string)
};

FollowUpActions.defaultProps = {
  actions: undefined
};
