import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

function PersonalDetailsForm({
  form,
  timezoneOptions,
  languageOptions,
  onFieldChange,
  onSubmit,
  saving,
  status
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onFieldChange(name, value);
  };

  return (
    <SectionCard
      title="Personal profile"
      description="Manage how your crew profile appears across dispatch boards, provider dashboards, and compliance tools."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          First name
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Last name
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
            required
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Preferred name
          <input
            type="text"
            name="preferredName"
            value={form.preferredName}
            onChange={handleChange}
            placeholder="How teammates refer to you"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Crew title
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Lead technician"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Badge ID
          <input
            type="text"
            name="badgeId"
            value={form.badgeId}
            onChange={handleChange}
            placeholder="Crew badge or employee ID"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Region
          <input
            type="text"
            name="region"
            value={form.region}
            onChange={handleChange}
            placeholder="Primary operating region"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-primary">
        Profile summary
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          placeholder="Short line that appears in crew directories."
          rows={3}
          className="rounded-2xl border border-accent/20 px-4 py-3 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-primary">
        Bio
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Add highlights, training focus, or languages."
          rows={4}
          className="rounded-2xl border border-accent/20 px-4 py-3 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Work email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Avatar URL
          <input
            type="url"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="https://"
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Timezone
          <select
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          >
            {timezoneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-primary">
          Language
          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="rounded-xl border border-accent/20 px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
          >
            {languageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SectionCard>
  );
}

PersonalDetailsForm.propTypes = {
  form: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    preferredName: PropTypes.string,
    title: PropTypes.string,
    badgeId: PropTypes.string,
    region: PropTypes.string,
    summary: PropTypes.string,
    bio: PropTypes.string,
    email: PropTypes.string,
    avatarUrl: PropTypes.string,
    timezone: PropTypes.string,
    language: PropTypes.string
  }).isRequired,
  timezoneOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  languageOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

PersonalDetailsForm.defaultProps = {
  saving: false,
  status: null
};

export default PersonalDetailsForm;
