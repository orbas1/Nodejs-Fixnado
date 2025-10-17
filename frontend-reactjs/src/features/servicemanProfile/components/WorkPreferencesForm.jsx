import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function WorkPreferencesForm({ form, onFieldChange, onSubmit, saving, status }) {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    onFieldChange(name, type === 'checkbox' ? checked : value);
  };

  return (
    <SectionCard
      title="Work preferences"
      description="Define availability defaults, travel radius, and whether you can lead or mentor other crew members."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Preferred shift start
          <input
            type="time"
            name="preferredShiftStart"
            value={form.preferredShiftStart}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Preferred shift end
          <input
            type="time"
            name="preferredShiftEnd"
            value={form.preferredShiftEnd}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Max jobs per day
          <input
            type="number"
            min="1"
            max="20"
            name="maxJobsPerDay"
            value={form.maxJobsPerDay}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Travel radius (km)
          <input
            type="number"
            min="5"
            max="250"
            name="travelRadiusKm"
            value={form.travelRadiusKm}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary shadow-sm">
          <input
            type="checkbox"
            name="crewLeadEligible"
            checked={form.crewLeadEligible}
            onChange={handleChange}
            className="h-4 w-4 rounded border-accent/40 text-primary focus:ring-accent"
          />
          Able to lead a crew on assignments
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary shadow-sm">
          <input
            type="checkbox"
            name="mentorEligible"
            checked={form.mentorEligible}
            onChange={handleChange}
            className="h-4 w-4 rounded border-accent/40 text-primary focus:ring-accent"
          />
          Available to mentor apprentices
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary shadow-sm">
          <input
            type="checkbox"
            name="remoteSupport"
            checked={form.remoteSupport}
            onChange={handleChange}
            className="h-4 w-4 rounded border-accent/40 text-primary focus:ring-accent"
          />
          Can provide remote troubleshooting
        </label>
      </div>
    </SectionCard>
  );
}

WorkPreferencesForm.propTypes = {
  form: PropTypes.shape({
    preferredShiftStart: PropTypes.string,
    preferredShiftEnd: PropTypes.string,
    maxJobsPerDay: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    travelRadiusKm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    crewLeadEligible: PropTypes.bool,
    mentorEligible: PropTypes.bool,
    remoteSupport: PropTypes.bool
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

WorkPreferencesForm.defaultProps = {
  saving: false,
  status: null
};

export default WorkPreferencesForm;
