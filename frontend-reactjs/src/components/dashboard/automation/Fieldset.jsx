import PropTypes from 'prop-types';

export default function Fieldset({ title, description, children }) {
  return (
    <fieldset className="rounded-3xl border border-accent/10 bg-white/90 p-5 shadow-inner">
      <legend className="text-sm font-semibold uppercase tracking-widest text-primary/70">{title}</legend>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

Fieldset.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired
};

Fieldset.defaultProps = {
  description: undefined
};
