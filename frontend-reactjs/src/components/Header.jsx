import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Live Feed', href: '/feed' },
  { name: 'Services', href: '/services' },
  { name: 'Marketplace', href: '/services#marketplace' },
  { name: 'Explorer', href: '/search' }
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-glow">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Fixnado"
            className="h-[3.75rem] w-auto object-contain md:h-16"
            loading="lazy"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `transition-colors ${isActive ? 'text-primary' : 'text-slate-600 hover:text-accent'}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-full border border-accent text-accent font-semibold hover:bg-accent/10"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-accent text-white font-semibold shadow-lg shadow-accent/30 hover:bg-accent/90"
          >
            Get started
          </Link>
        </div>
        <button
          className="md:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Bars3Icon className="h-6 w-6 text-primary" />
        </button>
      </div>
      {open && (
        <div className="md:hidden px-6 pb-6 space-y-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `block text-base ${isActive ? 'text-primary font-semibold' : 'text-slate-600 hover:text-accent'}`
              }
              onClick={() => setOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
          <div className="flex gap-3 pt-4">
            <Link
              to="/login"
              className="flex-1 px-4 py-2 rounded-full border border-accent text-center text-accent font-semibold hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="flex-1 px-4 py-2 rounded-full bg-accent text-center text-white font-semibold shadow-lg shadow-accent/30 hover:bg-accent/90"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
