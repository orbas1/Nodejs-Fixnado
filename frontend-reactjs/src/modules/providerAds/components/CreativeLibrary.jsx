import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

function CreativeRow({ creative, onEdit, onDelete, disabled }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-secondary/60" data-qa={`provider-ads-creative-${creative.id || creative.name}`}>
      <td className="px-4 py-3 text-sm text-slate-600">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-primary">{creative.name}</span>
          <span className="text-xs text-slate-500">{creative.headline || creative.callToAction || '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{creative.format}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{creative.status}</td>
      <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[12rem]">
        <a href={creative.assetUrl} className="text-primary underline" target="_blank" rel="noreferrer">
          {creative.assetUrl}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{creative.flightName || 'Campaign level'}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button size="xs" variant="ghost" onClick={() => onEdit(creative)} disabled={disabled}>
            Edit
          </Button>
          <Button size="xs" variant="ghost" tone="danger" onClick={() => onDelete(creative)} disabled={disabled}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

CreativeRow.propTypes = {
  creative: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    format: PropTypes.string,
    status: PropTypes.string,
    assetUrl: PropTypes.string,
    flightName: PropTypes.string,
    headline: PropTypes.string,
    callToAction: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

CreativeRow.defaultProps = {
  disabled: false
};

export default function CreativeLibrary({
  campaigns,
  creatives,
  onCreateCreative,
  onEditCreative,
  onDeleteCreative,
  busy
}) {
  const creativesByCampaign = useMemo(() => {
    return creatives.reduce((acc, creative) => {
      const campaignId = creative.campaignId || 'unassigned';
      if (!acc.has(campaignId)) {
        acc.set(campaignId, []);
      }
      acc.get(campaignId).push(creative);
      return acc;
    }, new Map());
  }, [creatives]);

  const orphanCreatives = creativesByCampaign.get('unassigned') || [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Creative library</h3>
        <div className="flex flex-wrap gap-2">
          {campaigns.map((campaign) => (
            <Button
              key={campaign.id}
              size="xs"
              variant="secondary"
              onClick={() => onCreateCreative(campaign)}
              disabled={busy}
            >
              Add creative for {campaign.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Creative
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Format
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Asset URL
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flight
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => {
              const campaignCreatives = creativesByCampaign.get(campaign.id) || [];
              if (campaignCreatives.length === 0) {
                return (
                  <tr key={`empty-${campaign.id}`} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={6}>
                      No creatives configured for {campaign.name}. Use the buttons above to add assets.
                    </td>
                  </tr>
                );
              }
              return campaignCreatives.map((creative) => (
                <CreativeRow
                  key={`${campaign.id}-${creative.id}`}
                  creative={creative}
                  onEdit={onEditCreative}
                  onDelete={(item) => onDeleteCreative(item.campaignId, item.id)}
                  disabled={busy}
                />
              ));
            })}
            {orphanCreatives.length
              ? orphanCreatives.map((creative) => (
                  <CreativeRow
                    key={`orphan-${creative.id}`}
                    creative={creative}
                    onEdit={onEditCreative}
                    onDelete={(item) => onDeleteCreative(item.campaignId, item.id)}
                    disabled={busy}
                  />
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

CreativeLibrary.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      flights: PropTypes.array
    })
  ).isRequired,
  creatives: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreateCreative: PropTypes.func.isRequired,
  onEditCreative: PropTypes.func.isRequired,
  onDeleteCreative: PropTypes.func.isRequired,
  busy: PropTypes.bool
};

CreativeLibrary.defaultProps = {
  busy: false
};
