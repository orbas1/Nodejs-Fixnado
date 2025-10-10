import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';

const footerLinks = [
  { title: 'Company', items: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Support', items: ['Help Center', 'Safety', 'Escrow', 'Disputes'] },
  { title: 'Marketplace', items: ['Services', 'Live Feed', 'Tool Rentals', 'Materials'] }
];

export default function Footer() {
  return (
    <footer className="bg-white text-slate-700 border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <img
            src={LOGO_URL}
            alt="Fixnado"
            className="h-[3.75rem] w-auto object-contain"
            loading="lazy"
          />
          <p className="mt-4 text-sm text-slate-500">
            Fixnado connects households, enterprises, and skilled professionals to orchestrate custom jobs with precision.
          </p>
        </div>
        {footerLinks.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {column.items.map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-accent">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>© {new Date().getFullYear()} Fixnado. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-accent">Privacy</Link>
            <Link to="#" className="hover:text-accent">Terms</Link>
            <Link to="#" className="hover:text-accent">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
