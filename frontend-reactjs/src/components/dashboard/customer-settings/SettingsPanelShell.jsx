import PropTypes from 'prop-types';

function SettingsPanelShell({ title, description, children, actions = null, id }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id={id}>
      <header className="space-y-2">
        <h3 className="text-xl font-semibold text-primary">{title}</h3>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        {actions}
      </header>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

SettingsPanelShell.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  id: PropTypes.string
};

export default SettingsPanelShell;
