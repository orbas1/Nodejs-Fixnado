import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';

const footerLinks = [
  { title: 'Company', items: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Support', items: ['Help Center', 'Safety', 'Escrow', 'Disputes'] },
  { title: 'Marketplace', items: ['Services', 'Live Feed', 'Tool Rentals', 'Materials'] }
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Fixnado"
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span className="text-xl font-semibold">Fixnado</span>
          </div>
          <p className="mt-4 text-sm text-slate-200">
            Fixnado connects households, businesses, and skilled professionals to get custom jobs done fast.
          </p>
        </div>
        {footerLinks.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {column.items.map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-300">
          <span>© {new Date().getFullYear()} Fixnado. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="#">Privacy</Link>
            <Link to="#">Terms</Link>
            <Link to="#">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
