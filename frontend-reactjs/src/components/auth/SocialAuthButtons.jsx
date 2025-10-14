import PropTypes from 'prop-types';
import clsx from 'clsx';

function GoogleLogo(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.62l6.84-6.84C36.94 2.55 30.88 0 24 0 14.72 0 6.64 5.26 2.56 12.9l7.96 6.19C12.26 12.43 17.58 9.5 24 9.5z"
      />
      <path
        fill="#34A853"
        d="M46.1 24.5c0-1.63-.15-3.2-.44-4.7H24v9.04h12.38c-.53 2.7-2.12 4.98-4.5 6.52l7.04 5.46C43.05 37.02 46.1 31.38 46.1 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.52 28.62a13.99 13.99 0 0 1-.73-4.12c0-1.43.26-2.8.73-4.12L2.56 12.2C1.32 16.75 0 20.26 0 24c0 3.74 1.32 7.25 3.56 9.81l6.96-5.19z"
      />
      <path
        fill="#4285F4"
        d="M24 48c6.48 0 11.9-2.14 15.87-5.8l-7.04-5.46c-2.02 1.37-4.6 2.17-8.83 2.17-6.42 0-11.74-3.93-13.68-9.44l-7.96 6.19C6.64 42.74 14.72 48 24 48z"
      />
    </svg>
  );
}

function FacebookLogo(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.5 22v-8.21h2.74l.41-3.2h-3.15V8.62c0-.93.26-1.55 1.6-1.55h1.71V4.18c-.3-.04-1.34-.13-2.54-.13-2.52 0-4.25 1.54-4.25 4.38v2.44H6.7v3.2h2.32V22z"
      />
    </svg>
  );
}

function LinkedInLogo(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55V15c0-1.3-.02-2.97-1.81-2.97-1.81 0-2.09 1.41-2.09 2.88v5.54H9.45V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"
      />
    </svg>
  );
}

function XLogo(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="m19.71 3 2.79 0-6.08 6.94 7.11 10.06h-5.58l-3.66-5.24-4.19 5.24H2.29l6.46-7.65L1.93 3h5.72l3.3 4.77z"
      />
    </svg>
  );
}

const PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    accent: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
    iconWrapperClass: 'border border-slate-200 bg-white',
    icon: GoogleLogo
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    accent: 'bg-[#1877F2] text-white hover:bg-[#125bd4]',
    iconWrapperClass: 'bg-white/15 text-white',
    icon: FacebookLogo
  },
  {
    id: 'linkedin',
    label: 'Continue with LinkedIn',
    accent: 'bg-[#0A66C2] text-white hover:bg-[#084d99]',
    iconWrapperClass: 'bg-white/15 text-white',
    icon: LinkedInLogo
  },
  {
    id: 'x',
    label: 'Continue with X',
    accent: 'bg-black text-white hover:bg-slate-900',
    iconWrapperClass: 'bg-white/20 text-white',
    icon: XLogo
  }
];

function SocialAuthButtons({ onSelect, className }) {
  return (
    <div className={clsx('flex flex-col items-center space-y-3', className)}>
      {PROVIDERS.map((provider) => {
        const Icon = provider.icon;
        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelect(provider.id)}
            className={clsx(
              'flex h-12 w-2/3 items-center justify-center gap-3 rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
              provider.accent
            )}
          >
            <span
              className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                provider.iconWrapperClass
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="truncate">{provider.label}</span>
          </button>
        );
      })}
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
