import PropTypes from 'prop-types';
import { InlineBanner, Field, TextArea, TextInput, CheckboxField } from './FormControls.jsx';

const CustomerProfileSection = ({ profile, personaSummary, onChange, onCheckbox, onSubmit, status, saving }) => (
  <section className="space-y-6">
    <header className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Customer workspace</p>
      <h2 className="text-2xl font-semibold text-primary">Customer control centre overview</h2>
      <p className="text-sm text-slate-600">
        Configure customer-facing details, escalation preferences, and operational contacts so crews and Fixnado support can take
        action without friction.
      </p>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/50">{personaSummary}</p>
    </header>

    <form className="space-y-6" onSubmit={onSubmit}>
      <InlineBanner tone={status?.tone} message={status?.message} />
      <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-md">
        <h3 className="text-lg font-semibold text-primary">Profile & account</h3>
        <p className="mt-1 text-sm text-slate-600">These details populate booking receipts, invoices, and timeline cards.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field id="profile-preferredName" label="Preferred name" description="Shown on receipts and internal notes.">
            <TextInput
              id="profile-preferredName"
              value={profile.preferredName}
              onChange={(value) => onChange('preferredName', value)}
              placeholder="Catherine Rhodes"
            />
          </Field>
          <Field id="profile-jobTitle" label="Role" description="Displayed alongside communications and approvals.">
            <TextInput
              id="profile-jobTitle"
              value={profile.jobTitle}
              onChange={(value) => onChange('jobTitle', value)}
              placeholder="Facilities Director"
            />
          </Field>
          <Field id="profile-company" label="Organisation">
            <TextInput
              id="profile-company"
              value={profile.companyName}
              onChange={(value) => onChange('companyName', value)}
              placeholder="Brightside Residences"
            />
          </Field>
          <Field id="profile-email" label="Primary email" description="Used for booking confirmations and follow-ups.">
            <TextInput
              id="profile-email"
              type="email"
              value={profile.primaryEmail}
              onChange={(value) => onChange('primaryEmail', value)}
              placeholder="catherine@example.com"
            />
          </Field>
          <Field id="profile-phone" label="Primary phone" description="Visible to assigned crews for urgent coordination.">
            <TextInput
              id="profile-phone"
              value={profile.primaryPhone}
              onChange={(value) => onChange('primaryPhone', value)}
              placeholder="+44 7500 123456"
            />
          </Field>
          <Field id="profile-timezone" label="Timezone" description="Used for scheduling, SLAs, and dashboards.">
            <TextInput
              id="profile-timezone"
              value={profile.timezone}
              onChange={(value) => onChange('timezone', value)}
              placeholder="Europe/London"
            />
          </Field>
          <Field id="profile-locale" label="Locale" description="Impacts formatting for money, dates, and decimals.">
            <TextInput
              id="profile-locale"
              value={profile.locale}
              onChange={(value) => onChange('locale', value)}
              placeholder="en-GB"
            />
          </Field>
          <Field id="profile-currency" label="Preferred currency">
            <TextInput
              id="profile-currency"
              value={profile.defaultCurrency}
              onChange={(value) => onChange('defaultCurrency', value)}
              placeholder="GBP"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-md">
        <h3 className="text-lg font-semibold text-primary">Branding & notifications</h3>
        <p className="mt-1 text-sm text-slate-600">Tailor imagery and escalation rules to match the customer workspace.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field id="profile-avatar" label="Avatar" description="Square image used on dashboards and receipts.">
            <TextInput
              id="profile-avatar"
              value={profile.avatarUrl}
              onChange={(value) => onChange('avatarUrl', value)}
              placeholder="https://cdn.fixnado.com/assets/customer/avatar.png"
            />
          </Field>
          <Field id="profile-cover" label="Cover image" description="Wide banner for dashboards and overview screens.">
            <TextInput
              id="profile-cover"
              value={profile.coverImageUrl}
              onChange={(value) => onChange('coverImageUrl', value)}
              placeholder="https://cdn.fixnado.com/assets/customer/cover.jpg"
            />
          </Field>
          <Field id="profile-preferredContact" label="Preferred contact method" description="Displayed to crews and support reps.">
            <TextInput
              id="profile-preferredContact"
              value={profile.preferredContactMethod}
              onChange={(value) => onChange('preferredContactMethod', value)}
              placeholder="Call before site arrival"
            />
          </Field>
          <Field id="profile-billingEmail" label="Billing email" description="Used for invoices, escrow releases, and payment updates.">
            <TextInput
              id="profile-billingEmail"
              type="email"
              value={profile.billingEmail}
              onChange={(value) => onChange('billingEmail', value)}
              placeholder="accounts@brightside.co.uk"
            />
          </Field>
          <Field
            id="profile-supportNotes"
            label="Support notes"
            description="Context to help Fixnado support resolve incidents quickly."
          >
            <TextArea
              id="profile-supportNotes"
              rows={4}
              value={profile.supportNotes}
              onChange={(value) => onChange('supportNotes', value)}
              placeholder="Escalate urgent outages to Priya after 18:00. Weekend coverage via on-call rotation."
            />
          </Field>
          <Field
            id="profile-escalationWindow"
            label="Escalation window"
            description="Minutes to wait before raising an escalation when updates are overdue."
          >
            <TextInput
              id="profile-escalationWindow"
              type="number"
              value={profile.escalationWindowMinutes}
              onChange={(value) => onChange('escalationWindowMinutes', Number(value))}
              placeholder="120"
            />
          </Field>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <CheckboxField
            id="profile-marketing"
            checked={profile.marketingOptIn}
            onChange={(value) => onCheckbox('marketingOptIn', value)}
            label="Receive Fixnado updates"
            description="Product updates, training invites, and marketplace tips."
          />
          <CheckboxField
            id="profile-emailUpdates"
            checked={profile.notificationsEmailOptIn}
            onChange={(value) => onCheckbox('notificationsEmailOptIn', value)}
            label="Email notifications"
            description="Booking confirmations, timeline updates, and SLA alerts."
          />
          <CheckboxField
            id="profile-smsUpdates"
            checked={profile.notificationsSmsOptIn}
            onChange={(value) => onCheckbox('notificationsSmsOptIn', value)}
            label="SMS notifications"
            description="Dispatch changes, emergency notices, and on-site updates."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save customer profile'}
        </button>
      </div>
    </form>
  </section>
);

CustomerProfileSection.propTypes = {
  profile: PropTypes.shape({
    preferredName: PropTypes.string,
    companyName: PropTypes.string,
    jobTitle: PropTypes.string,
    primaryEmail: PropTypes.string,
    primaryPhone: PropTypes.string,
    preferredContactMethod: PropTypes.string,
    billingEmail: PropTypes.string,
    timezone: PropTypes.string,
    locale: PropTypes.string,
    defaultCurrency: PropTypes.string,
    avatarUrl: PropTypes.string,
    coverImageUrl: PropTypes.string,
    supportNotes: PropTypes.string,
    escalationWindowMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    marketingOptIn: PropTypes.bool,
    notificationsEmailOptIn: PropTypes.bool,
    notificationsSmsOptIn: PropTypes.bool
  }).isRequired,
  personaSummary: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onCheckbox: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'error', 'info']),
    message: PropTypes.string
  }),
  saving: PropTypes.bool
};

CustomerProfileSection.defaultProps = {
  status: null,
  saving: false
};

export default CustomerProfileSection;
