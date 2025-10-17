import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MapPinIcon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool
    })
  ).isRequired
};

function JobCard({ job, onBid, onPreview }) {
  const deadline = job.bidDeadline ? new Date(job.bidDeadline).toLocaleString() : 'No deadline';
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:border-primary/40">
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Opportunity</p>
          <h3 className="text-lg font-semibold text-primary">{job.title}</h3>
          {job.category ? <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{job.category}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onPreview(job)}>
            View details
          </Button>
          <Button size="sm" onClick={() => onBid(job)}>
            Create bid
          </Button>
        </div>
      </header>
      {job.description ? <p className="text-sm text-slate-600">{job.description}</p> : null}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {job.zone ? (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            {job.zone.name}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {deadline}
        </span>
        {job.budgetLabel ? <span>{job.budgetLabel}</span> : null}
        {job.allowOutOfZone ? <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Open to OOO</span> : null}
      </div>
      {job.media?.length ? (
        <div className="flex gap-3 overflow-x-auto rounded-2xl bg-slate-50/80 p-3">
          {job.media.map((media) => (
            <figure key={media.id} className="flex h-20 w-28 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
              <PhotoIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
              <figcaption className="mt-1 truncate px-2">{media.url}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {job.tags?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {job.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    bidDeadline: PropTypes.string,
    budgetLabel: PropTypes.string,
    allowOutOfZone: PropTypes.bool,
    zone: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired
      })
    ),
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onBid: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired
};

export default function OpportunitiesTable({
  jobs,
  loading,
  filters,
  categories,
  zones,
  onFilterChange,
  onBid,
  onPreview
}) {
  const [form, setForm] = useState(() => ({ ...filters }));

  useEffect(() => {
    setForm({ ...filters });
  }, [filters]);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'All categories' }, ...categories],
    [categories]
  );

  const zoneOptions = useMemo(() => [{ value: '', label: 'All zones' }, ...zones], [zones]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onFilterChange?.(form);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <section id="provider-custom-jobs-opportunities" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Job opportunities</h2>
          <p className="text-sm text-slate-500">Live tenders and briefs matched to your coverage.</p>
        </div>
      </header>
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)_minmax(0,220px)_auto]"
      >
        <TextInput
          label="Search"
          placeholder="Search by title or description"
          name="search"
          value={form.search}
          onChange={handleInputChange}
        />
        <SelectField
          label="Zone"
          name="zoneId"
          value={form.zoneId}
          onChange={(value) => setForm((current) => ({ ...current, zoneId: value }))}
          options={zoneOptions}
        />
        <SelectField
          label="Category"
          name="category"
          value={form.category}
          onChange={(value) => setForm((current) => ({ ...current, category: value }))}
          options={categoryOptions}
        />
        <div className="flex items-end">
          <Button type="submit" variant="primary">
            Apply filters
          </Button>
        </div>
      </form>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
          No matching opportunities. Adjust filters or refresh later.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onBid={onBid} onPreview={onPreview} />
          ))}
        </div>
      )}
    </section>
  );
}

OpportunitiesTable.propTypes = {
  jobs: PropTypes.arrayOf(JobCard.propTypes.job),
  loading: PropTypes.bool,
  filters: PropTypes.shape({
    search: PropTypes.string,
    zoneId: PropTypes.string,
    category: PropTypes.string
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  onFilterChange: PropTypes.func,
  onBid: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired
};

OpportunitiesTable.defaultProps = {
  jobs: [],
  loading: false,
  filters: { search: '', zoneId: '', category: '' },
  categories: [],
  zones: [],
  onFilterChange: undefined
};
