import PropTypes from 'prop-types';
import usePersona from '../hooks/usePersona.js';

const PERSONA_LABELS = {
  customer: 'Customer',
  provider: 'Provider',
  serviceman: 'Serviceman',
  enterprise: 'Enterprise',
  admin: 'Admin'
};

export default function PersonaSwitcher({ variant = 'desktop' }) {
  const { persona, setPersona, availablePersonas } = usePersona();

  return (
    <label className={`relative ${variant === 'desktop' ? 'hidden md:flex' : 'flex md:hidden'} items-center gap-2`}>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Persona
      </span>
      <select
        value={persona}
        onChange={(event) => setPersona(event.target.value)}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {availablePersonas.map((option) => (
          <option key={option} value={option}>
            {PERSONA_LABELS[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

PersonaSwitcher.propTypes = {
  variant: PropTypes.oneOf(['desktop', 'mobile'])
};

