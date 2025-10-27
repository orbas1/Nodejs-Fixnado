import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function TabbedSection({ heading, description, tabs }) {
  const enabledTabs = useMemo(() => tabs.filter((tab) => tab && tab.content), [tabs]);
  const [activeTab, setActiveTab] = useState(enabledTabs[0]?.id ?? null);

  useEffect(() => {
    if (!enabledTabs.length) {
      setActiveTab(null);
      return;
    }
    if (!enabledTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(enabledTabs[0].id);
    }
  }, [activeTab, enabledTabs]);

  if (!enabledTabs.length) {
    return null;
  }

  const active = enabledTabs.find((tab) => tab.id === activeTab) ?? enabledTabs[0];

  return (
    <div className="flex flex-col gap-8">
      {enabledTabs.length > 1 ? (
        <div className="provider-dashboard__toolbar" role="tablist" aria-label={heading}>
          {enabledTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={tab.id === active.id}
              aria-controls={`${tab.id}-panel`}
              className={clsx(
                'transition',
                tab.id === active.id
                  ? 'border-[var(--provider-accent)] bg-[var(--provider-accent)] text-[var(--provider-text-primary)] shadow-lg shadow-[rgba(91,124,250,0.35)]'
                  : 'text-[var(--provider-text-secondary)]'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
      <div
        id={`${active.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${active.id}-tab`}
        className="flex flex-col gap-10"
      >
        {active.content}
      </div>
    </div>
  );
}

TabbedSection.propTypes = {
  heading: PropTypes.string.isRequired,
  description: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.node
    })
  ).isRequired
};

TabbedSection.defaultProps = {
  description: null
};
