import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  ArrowLeftOnRectangleIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import DashboardOverview from './DashboardOverview.jsx';
import DashboardSection from './DashboardSection.jsx';

const createSearchIndex = (roleConfig) =>
  roleConfig.navigation.flatMap((section) => {
    const entries = [
      {
        id: section.id,
        type: 'section',
        label: section.label,
        description: section.description,
        targetSection: section.id
      }
    ];

    if (section.type === 'grid' && section.data?.cards) {
      entries.push(
        ...section.data.cards.map((card) => ({
          id: `${section.id}-${card.title}`,
          type: 'card',
          label: card.title,
          description: card.details.join(' • '),
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'board' && section.data?.columns) {
      section.data.columns.forEach((column) => {
        entries.push({
          id: `${section.id}-${column.title}`,
          type: 'column',
          label: `${column.title} • ${section.label}`,
          description: `${column.items.length} work items`,
          targetSection: section.id
        });
        column.items.forEach((item) => {
          entries.push({
            id: `${section.id}-${item.title}`,
            type: 'item',
            label: item.title,
            description: [item.owner, item.value, item.eta].filter(Boolean).join(' • '),
            targetSection: section.id
          });
        });
      });
    }

    if (section.type === 'table' && section.data?.rows) {
      entries.push(
        ...section.data.rows.map((row, index) => ({
          id: `${section.id}-row-${index}`,
          type: 'record',
          label: row[1] ?? row[0],
          description: row.join(' • '),
          targetSection: section.id
        }))
      );
    }

    if (section.type === 'list' && section.data?.items) {
      entries.push(
        ...section.data.items.map((item) => ({
          id: `${section.id}-${item.title}`,
          type: 'configuration',
          label: item.title,
          description: item.description,
          targetSection: section.id
        }))
      );
    }

    return entries;
  });

const resultBadge = {
  section: 'Section',
  card: 'Summary',
  column: 'Stage',
  item: 'Work Item',
  record: 'Record',
  configuration: 'Setting'
};

const DashboardLayout = ({ roleConfig, registeredRoles }) => {
  const [selectedSection, setSelectedSection] = useState(roleConfig.navigation[0]?.id ?? 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSection(roleConfig.navigation[0]?.id ?? 'overview');
    setSearchQuery('');
    setSearchResults([]);
  }, [roleConfig]);

  const searchIndex = useMemo(() => createSearchIndex(roleConfig), [roleConfig]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const lowered = searchQuery.toLowerCase();
    const results = searchIndex
      .filter((entry) => entry.label.toLowerCase().includes(lowered) || entry.description.toLowerCase().includes(lowered))
      .slice(0, 8);
    setSearchResults(results);
  }, [searchQuery, searchIndex]);

  const activeSection = roleConfig.navigation.find((item) => item.id === selectedSection) ?? roleConfig.navigation[0];

  const renderSection = () => {
    if (!activeSection) return null;
    if (activeSection.type === 'overview') {
      return <DashboardOverview analytics={activeSection.analytics} />;
    }
    return <DashboardSection section={activeSection} />;
  };

  const registeredOptions = registeredRoles.filter((role) => role.registered);

  const handleResultClick = (result) => {
    setSelectedSection(result.targetSection);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="p-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Bars3BottomLeftIcon className="h-8 w-8 text-accent" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fixnado</p>
              <p className="text-lg font-semibold text-slate-900">{roleConfig.name}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{roleConfig.headline}</p>
          <div className="mt-6 space-y-2">
            <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="roleSwitcher">
              Switch dashboard
            </label>
            <select
              id="roleSwitcher"
              value={roleConfig.id}
              onChange={(event) => navigate(`/dashboards/${event.target.value}`)}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {registeredOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {roleConfig.navigation.map((item) => {
            const isActive = item.id === activeSection?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSection(item.id)}
                className={`w-full text-left rounded-xl px-4 py-3 transition-colors border ${
                  isActive
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-slate-200">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/20"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" /> Return to Fixnado.com
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{activeSection?.label ?? roleConfig.name}</h1>
              <p className="text-sm text-slate-600 max-w-2xl">{roleConfig.persona}</p>
            </div>
            <div className="relative w-full lg:w-96">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search jobs, orders, analytics, automations..."
                className="w-full rounded-full bg-white border border-slate-200 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {searchResults.length > 0 && (
                <div className="absolute inset-x-0 top-14 z-20 rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => handleResultClick(result)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-100"
                        >
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {resultBadge[result.type] ?? 'Result'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{result.label}</p>
                            <p className="text-xs text-slate-500">{result.description}</p>
                          </div>
                          <ArrowTopRightOnSquareIcon className="mt-1 h-4 w-4 text-slate-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-10">
          <div className="mx-auto max-w-6xl space-y-8">{renderSection()}</div>
        </div>
      </main>
    </div>
  );
};

DashboardLayout.propTypes = {
  roleConfig: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    persona: PropTypes.string,
    headline: PropTypes.string,
    navigation: PropTypes.array.isRequired
  }).isRequired,
  registeredRoles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      registered: PropTypes.bool
    })
  ).isRequired
};

export default DashboardLayout;
