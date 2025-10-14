import PropTypes from 'prop-types';
import clsx from 'clsx';

const PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    accent: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
    badgeClass: 'bg-[#4285F4]/10 text-[#4285F4]',
    badgeContent: 'G'
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    accent: 'bg-[#1877F2] text-white hover:bg-[#125bd4]',
    badgeClass: 'bg-white/20 text-white',
    badgeContent: 'f'
  },
  {
    id: 'linkedin',
    label: 'Continue with LinkedIn',
    accent: 'bg-[#0A66C2] text-white hover:bg-[#084d99]',
    badgeClass: 'bg-white/20 text-white',
    badgeContent: 'in'
  },
  {
    id: 'x',
    label: 'Continue with X',
    accent: 'bg-black text-white hover:bg-slate-900',
    badgeClass: 'bg-white/20 text-white',
    badgeContent: '𝕏'
  }
];

function SocialAuthButtons({ onSelect, className }) {
  return (
    <div className={clsx('space-y-3', className)}>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => onSelect(provider.id)}
          className={clsx(
            'flex h-12 w-full items-center justify-center gap-3 rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
            provider.accent
          )}
        >
          <span
            className={clsx(
              'inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-base font-bold uppercase tracking-wide',
              provider.badgeClass
            )}
          >
            {provider.badgeContent}
          </span>
          <span className="truncate">{provider.label}</span>
        </button>
      ))}
    </div>
  );
}

SocialAuthButtons.propTypes = {
  onSelect: PropTypes.func,
  className: PropTypes.string
};

SocialAuthButtons.defaultProps = {
  onSelect: () => {},
  className: undefined
};

export default SocialAuthButtons;
