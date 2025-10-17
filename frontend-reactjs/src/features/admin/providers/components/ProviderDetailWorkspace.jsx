import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput, FormField, Checkbox, StatusPill, Spinner } from '../../../../components/ui/index.js';
import ProviderTaxManagementPanel from './ProviderTaxManagementPanel.jsx';
import { resolveStatusTone } from './ProviderSummaryGrid.jsx';
import ProviderDocumentsSection from './documents/ProviderDocumentsSection.jsx';

function TextArea({ id, value, onChange, rows = 4 }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
    />
  );
}

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number
};

TextArea.defaultProps = {
  rows: 4
};

function ProviderLinks({ links }) {
  if (!links) {
    return null;
  }

  const buttons = [
    links.storefront
      ? {
          label: 'Open storefront',
          href: links.storefront,
          tone: 'secondary'
        }
      : null,
    links.dashboard
      ? {
          label: 'Open provider dashboard',
          href: links.dashboard,
          tone: 'ghost'
        }
      : null,
    links.compliance
      ? {
          label: 'Open compliance records',
          href: links.compliance,
          tone: 'ghost'
        }
      : null
  ].filter(Boolean);

  if (!buttons.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buttons.map((button) => (
        <Button
          key={button.href}
          size="sm"
          variant={button.tone}
          onClick={() => window.open(button.href, '_blank', 'noopener')}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

ProviderLinks.propTypes = {
  links: PropTypes.shape({
    storefront: PropTypes.string,
    dashboard: PropTypes.string,
    compliance: PropTypes.string
  })
};

ProviderLinks.defaultProps = {
  links: null
};

function ProviderDetailWorkspace({ selected, enums, detailLoading, detailError, handlers }) {
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    tradingName: '',
    status: 'prospect',
    onboardingStage: 'intake',
    tier: 'standard',
    riskRating: 'medium',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    logoUrl: '',
    heroImageUrl: '',
    operationsNotes: '',
    coverageNotes: '',
    storefrontSlug: ''
  });
  const [companyForm, setCompanyForm] = useState({
    contactName: '',
    contactEmail: '',
    serviceRegions: '',
    marketplaceIntent: '',
    verified: false,
    insuredSellerStatus: 'not_started',
    insuredSellerBadgeVisible: false,
    complianceScore: 0,
    regionId: ''
  });
  const [profileMessage, setProfileMessage] = useState(null);
  const [companyMessage, setCompanyMessage] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [companyError, setCompanyError] = useState(null);

  const [contactForm, setContactForm] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    role: '',
    type: 'operations',
    isPrimary: false,
    notes: ''
  });
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState(null);

  const [coverageForm, setCoverageForm] = useState({
    id: null,
    zoneId: '',
    coverageType: 'primary',
    slaMinutes: 240,
    maxCapacity: 0,
    notes: ''
  });
  const [savingCoverage, setSavingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
  const [archiveMessage, setArchiveMessage] = useState(null);

  useEffect(() => {
    if (!selected) {
      return;
    }

    setProfileForm({
      displayName: selected.profile?.displayName ?? '',
      tradingName: selected.profile?.tradingName ?? '',
      status: selected.profile?.status ?? enums.statuses?.[0]?.value ?? 'prospect',
      onboardingStage: selected.profile?.onboardingStage ?? enums.onboardingStages?.[0]?.value ?? 'intake',
      tier: selected.profile?.tier ?? enums.tiers?.[0]?.value ?? 'standard',
      riskRating: selected.profile?.riskRating ?? enums.riskLevels?.[0]?.value ?? 'medium',
      supportEmail: selected.profile?.supportEmail ?? '',
      supportPhone: selected.profile?.supportPhone ?? '',
      websiteUrl: selected.profile?.websiteUrl ?? '',
      logoUrl: selected.profile?.logoUrl ?? '',
      heroImageUrl: selected.profile?.heroImageUrl ?? '',
      operationsNotes: selected.profile?.operationsNotes ?? '',
      coverageNotes: selected.profile?.coverageNotes ?? '',
      storefrontSlug: selected.profile?.storefrontSlug ?? ''
    });
    setCompanyForm({
      contactName: selected.company?.contactName ?? '',
      contactEmail: selected.company?.contactEmail ?? '',
      serviceRegions: selected.company?.serviceRegions ?? '',
      marketplaceIntent: selected.company?.marketplaceIntent ?? '',
      verified: Boolean(selected.company?.verified),
      insuredSellerStatus: selected.company?.insuredSellerStatus ?? enums.insuredStatuses?.[0]?.value ?? 'not_started',
      insuredSellerBadgeVisible: Boolean(selected.company?.insuredSellerBadgeVisible),
      complianceScore: selected.company?.complianceScore ?? 0,
      regionId: selected.company?.regionId ?? enums.regions?.[0]?.id ?? ''
    });
    setProfileMessage(null);
    setCompanyMessage(null);
    setProfileError(null);
    setCompanyError(null);
    setContactForm({
      id: null,
      name: '',
      email: '',
      phone: '',
      role: '',
      type: 'operations',
      isPrimary: false,
      notes: ''
    });
    setCoverageForm({
      id: null,
      zoneId: enums.zones?.[0]?.id ?? '',
      coverageType: enums.coverageTypes?.[0]?.value ?? 'primary',
      slaMinutes: 240,
      maxCapacity: 0,
      notes: ''
    });
    setArchiveReason('');
    setArchiveError(null);
    setArchiveMessage(null);
    setArchiving(false);
  }, [selected, enums]);

  const handleSaveProfile = async () => {
    if (!selected?.company?.id) return;
    try {
      setSavingProfile(true);
      setProfileError(null);
      await handlers.onUpdateProvider?.(selected.company.id, { profile: profileForm });
      setProfileMessage('Profile saved successfully');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!selected?.company?.id) return;
    try {
      setSavingCompany(true);
      setCompanyError(null);
      await handlers.onUpdateProvider?.(selected.company.id, { company: companyForm });
      setCompanyMessage('Company settings saved');
    } catch (error) {
      setCompanyError(error instanceof Error ? error.message : 'Unable to save company settings');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!selected?.company?.id) return;
    try {
      setSavingContact(true);
      setContactError(null);
      await handlers.onUpsertContact?.(selected.company.id, contactForm.id, {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        role: contactForm.role,
        type: contactForm.type,
        isPrimary: contactForm.isPrimary,
        notes: contactForm.notes
      });
      setContactForm({
        id: null,
        name: '',
        email: '',
        phone: '',
        role: '',
        type: 'operations',
        isPrimary: false,
        notes: ''
      });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Unable to save contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleCoverageSubmit = async (event) => {
    event.preventDefault();
    if (!selected?.company?.id) return;
    try {
      setSavingCoverage(true);
      setCoverageError(null);
      await handlers.onUpsertCoverage?.(selected.company.id, coverageForm.id, {
        zoneId: coverageForm.zoneId,
        coverageType: coverageForm.coverageType,
        slaMinutes: Number.parseInt(coverageForm.slaMinutes, 10) || 0,
        maxCapacity: Number.parseInt(coverageForm.maxCapacity, 10) || 0,
        notes: coverageForm.notes
      });
      setCoverageForm({
        id: null,
        zoneId: enums.zones?.[0]?.id ?? '',
        coverageType: enums.coverageTypes?.[0]?.value ?? 'primary',
        slaMinutes: 240,
        maxCapacity: 0,
        notes: ''
      });
    } catch (error) {
      setCoverageError(error instanceof Error ? error.message : 'Unable to save coverage');
    } finally {
      setSavingCoverage(false);
    }
  };

  const handleArchiveProvider = async () => {
    if (!selected?.company?.id) return;
    try {
      setArchiving(true);
      setArchiveError(null);
      setArchiveMessage(null);
      const result = await handlers.onArchiveProvider?.(selected.company.id, {
        reason: archiveReason.trim() ? archiveReason.trim() : undefined
      });
      if (result?.profile?.status === 'archived') {
        setArchiveMessage('Provider archived successfully');
      } else {
        setArchiveMessage('Archive request submitted');
      }
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : 'Unable to archive provider');
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!selected?.company?.id) return;
    try {
      await handlers.onDeleteContact?.(selected.company.id, contactId);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Unable to delete contact');
    }
  };

  const handleDeleteCoverage = async (coverageId) => {
    if (!selected?.company?.id) return;
    try {
      await handlers.onDeleteCoverage?.(selected.company.id, coverageId);
    } catch (error) {
      setCoverageError(error instanceof Error ? error.message : 'Unable to delete coverage');
    }
  };

  const selectedContacts = selected?.contacts ?? [];
  const selectedCoverage = selected?.coverage ?? [];
  const selectedDocuments = selected?.documents ?? [];
  const isArchived = selected?.profile?.status === 'archived';
  const canArchive = Boolean(handlers.onArchiveProvider);

  return (
    <div className="space-y-6">
      {detailError ? (
        <StatusPill tone="danger">{detailError.message ?? 'Unable to load provider details'}</StatusPill>
      ) : null}
      {!selected ? (
        <div className="rounded-2xl border border-dashed border-accent/40 bg-secondary/40 p-6 text-sm text-slate-600">
          Select a provider from the directory to view and edit profile details.
        </div>
      ) : (
        <Fragment>
          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-primary">{selected.profile?.displayName}</h3>
                  <StatusPill tone={resolveStatusTone(selected.profile?.status)}>
                    {selected.profile?.status?.replace(/_/g, ' ') ?? 'Status'}
                  </StatusPill>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.profile?.tradingName ? `${selected.profile.tradingName} • ` : ''}
                  {selected.company?.region?.name ?? 'No region assigned'}
                </p>
              </div>
              <ProviderLinks links={selected.links} />
            </div>
            {detailLoading ? (
              <div className="mt-4 rounded-xl border border-dashed border-accent/30 bg-secondary/40 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Loading provider detail…
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Profile</h4>
                {profileMessage ? <StatusPill tone="success">{profileMessage}</StatusPill> : null}
              </div>
              {profileError ? <StatusPill tone="danger">{profileError}</StatusPill> : null}
              <div className="space-y-4">
                <FormField id="profile-display" label="Display name">
                  <TextInput
                    id="profile-display"
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-trading" label="Trading name">
                  <TextInput
                    id="profile-trading"
                    value={profileForm.tradingName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, tradingName: event.target.value }))}
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="profile-status" label="Status">
                    <select
                      id="profile-status"
                      value={profileForm.status}
                      onChange={(event) => setProfileForm((current) => ({ ...current, status: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {enums.statuses?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="profile-stage" label="Onboarding stage">
                    <select
                      id="profile-stage"
                      value={profileForm.onboardingStage}
                      onChange={(event) => setProfileForm((current) => ({ ...current, onboardingStage: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {enums.onboardingStages?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="profile-tier" label="Tier">
                    <select
                      id="profile-tier"
                      value={profileForm.tier}
                      onChange={(event) => setProfileForm((current) => ({ ...current, tier: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {enums.tiers?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField id="profile-risk" label="Risk level">
                    <select
                      id="profile-risk"
                      value={profileForm.riskRating}
                      onChange={(event) => setProfileForm((current) => ({ ...current, riskRating: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {enums.riskLevels?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField id="profile-support-email" label="Support email">
                  <TextInput
                    id="profile-support-email"
                    type="email"
                    value={profileForm.supportEmail}
                    onChange={(event) => setProfileForm((current) => ({ ...current, supportEmail: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-support-phone" label="Support phone">
                  <TextInput
                    id="profile-support-phone"
                    value={profileForm.supportPhone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, supportPhone: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-website" label="Website URL">
                  <TextInput
                    id="profile-website"
                    value={profileForm.websiteUrl}
                    onChange={(event) => setProfileForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-logo" label="Logo URL">
                  <TextInput
                    id="profile-logo"
                    value={profileForm.logoUrl}
                    onChange={(event) => setProfileForm((current) => ({ ...current, logoUrl: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-hero" label="Hero image URL">
                  <TextInput
                    id="profile-hero"
                    value={profileForm.heroImageUrl}
                    onChange={(event) => setProfileForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-operations" label="Operations notes">
                  <TextArea
                    id="profile-operations"
                    value={profileForm.operationsNotes}
                    onChange={(event) => setProfileForm((current) => ({ ...current, operationsNotes: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-coverage-notes" label="Coverage notes">
                  <TextArea
                    id="profile-coverage-notes"
                    value={profileForm.coverageNotes}
                    onChange={(event) => setProfileForm((current) => ({ ...current, coverageNotes: event.target.value }))}
                  />
                </FormField>
                <FormField id="profile-storefront" label="Storefront slug" hint="Used for provider storefront URL">
                  <TextInput
                    id="profile-storefront"
                    value={profileForm.storefrontSlug}
                    onChange={(event) => setProfileForm((current) => ({ ...current, storefrontSlug: event.target.value }))}
                  />
                </FormField>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="primary" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Company</h4>
                {companyMessage ? <StatusPill tone="success">{companyMessage}</StatusPill> : null}
              </div>
              {companyError ? <StatusPill tone="danger">{companyError}</StatusPill> : null}
              <div className="space-y-4">
                <FormField id="company-contact-name" label="Primary contact">
                  <TextInput
                    id="company-contact-name"
                    value={companyForm.contactName}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, contactName: event.target.value }))}
                  />
                </FormField>
                <FormField id="company-contact-email" label="Contact email">
                  <TextInput
                    id="company-contact-email"
                    type="email"
                    value={companyForm.contactEmail}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, contactEmail: event.target.value }))}
                  />
                </FormField>
                <FormField id="company-service-regions" label="Service regions">
                  <TextInput
                    id="company-service-regions"
                    value={companyForm.serviceRegions}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, serviceRegions: event.target.value }))}
                  />
                </FormField>
                <FormField id="company-intent" label="Marketplace intent">
                  <TextArea
                    id="company-intent"
                    rows={3}
                    value={companyForm.marketplaceIntent}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, marketplaceIntent: event.target.value }))}
                  />
                </FormField>
                <Checkbox
                  label="Verified provider"
                  checked={companyForm.verified}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, verified: event.target.checked }))}
                />
                <Checkbox
                  label="Show insured badge"
                  checked={companyForm.insuredSellerBadgeVisible}
                  onChange={(event) =>
                    setCompanyForm((current) => ({ ...current, insuredSellerBadgeVisible: event.target.checked }))
                  }
                />
                <FormField id="company-insured-status" label="Insurance status">
                  <select
                    id="company-insured-status"
                    value={companyForm.insuredSellerStatus}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, insuredSellerStatus: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {enums.insuredStatuses?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="company-compliance" label="Compliance score">
                  <TextInput
                    id="company-compliance"
                    type="number"
                    step="0.1"
                    value={companyForm.complianceScore}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, complianceScore: event.target.value }))}
                  />
                </FormField>
                <FormField id="company-region" label="Primary region">
                  <select
                    id="company-region"
                    value={companyForm.regionId}
                    onChange={(event) => setCompanyForm((current) => ({ ...current, regionId: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {enums.regions?.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="primary" onClick={handleSaveCompany} disabled={savingCompany}>
                    {savingCompany ? 'Saving…' : 'Save company'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Team contacts</h4>
                {contactError ? <StatusPill tone="danger">{contactError}</StatusPill> : null}
              </div>
              <ul className="space-y-3">
                {selectedContacts.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-accent/30 p-4 text-sm text-slate-500">
                    No contacts captured yet.
                  </li>
                ) : null}
                {selectedContacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">{contact.name}</p>
                        <p className="text-xs text-slate-500">
                          {contact.role ? `${contact.role} • ` : ''}
                          {contact.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.isPrimary ? <StatusPill tone="info">Primary</StatusPill> : null}
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            setContactForm({
                              id: contact.id,
                              name: contact.name ?? '',
                              email: contact.email ?? '',
                              phone: contact.phone ?? '',
                              role: contact.role ?? '',
                              type: contact.type ?? 'operations',
                              isPrimary: Boolean(contact.isPrimary),
                              notes: contact.notes ?? ''
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDeleteContact(contact.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-xs text-slate-500">
                      {contact.email ? <span>{contact.email}</span> : null}
                      {contact.phone ? <span>{contact.phone}</span> : null}
                      {contact.notes ? <span>{contact.notes}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleContactSubmit} className="mt-4 space-y-3 rounded-xl border border-dashed border-accent/40 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">Add or update contact</h5>
                <FormField id="contact-name" label="Name">
                  <TextInput
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </FormField>
                <FormField id="contact-role" label="Role">
                  <TextInput
                    id="contact-role"
                    value={contactForm.role}
                    onChange={(event) => setContactForm((current) => ({ ...current, role: event.target.value }))}
                  />
                </FormField>
                <FormField id="contact-email" label="Email">
                  <TextInput
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </FormField>
                <FormField id="contact-phone" label="Phone">
                  <TextInput
                    id="contact-phone"
                    value={contactForm.phone}
                    onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </FormField>
                <FormField id="contact-type" label="Type">
                  <select
                    id="contact-type"
                    value={contactForm.type}
                    onChange={(event) => setContactForm((current) => ({ ...current, type: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {['owner', 'operations', 'finance', 'compliance', 'support', 'sales', 'other'].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>
                <Checkbox
                  label="Primary contact"
                  checked={contactForm.isPrimary}
                  onChange={(event) => setContactForm((current) => ({ ...current, isPrimary: event.target.checked }))}
                />
                <FormField id="contact-notes" label="Notes">
                  <TextArea
                    id="contact-notes"
                    rows={3}
                    value={contactForm.notes}
                    onChange={(event) => setContactForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </FormField>
                <div className="flex items-center justify-end gap-2">
                  {contactForm.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setContactForm({
                          id: null,
                          name: '',
                          email: '',
                          phone: '',
                          role: '',
                          type: 'operations',
                          isPrimary: false,
                          notes: ''
                        })
                      }
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                  <Button type="submit" size="sm" disabled={savingContact}>
                    {savingContact ? 'Saving…' : contactForm.id ? 'Update contact' : 'Add contact'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Coverage zones</h4>
                {coverageError ? <StatusPill tone="danger">{coverageError}</StatusPill> : null}
              </div>
              <ul className="space-y-3">
                {selectedCoverage.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-accent/30 p-4 text-sm text-slate-500">
                    No coverage zones assigned yet.
                  </li>
                ) : null}
                {selectedCoverage.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">{entry.zone?.name ?? 'Coverage zone'}</p>
                        <p className="text-xs text-slate-500">
                          {entry.coverageTypeLabel ?? entry.coverageType} • SLA {entry.slaMinutes} mins • Capacity {entry.maxCapacity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            setCoverageForm({
                              id: entry.id,
                              zoneId: entry.zoneId,
                              coverageType: entry.coverageType,
                              slaMinutes: entry.slaMinutes,
                              maxCapacity: entry.maxCapacity,
                              notes: entry.notes ?? ''
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDeleteCoverage(entry.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    {entry.notes ? <p className="mt-1 text-xs text-slate-500">{entry.notes}</p> : null}
                  </li>
                ))}
              </ul>
              <form onSubmit={handleCoverageSubmit} className="mt-4 space-y-3 rounded-xl border border-dashed border-accent/40 p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">Add or update coverage</h5>
                <FormField id="coverage-zone" label="Zone">
                  <select
                    id="coverage-zone"
                    value={coverageForm.zoneId}
                    onChange={(event) => setCoverageForm((current) => ({ ...current, zoneId: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="" disabled>
                      Select zone
                    </option>
                    {enums.zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="coverage-type" label="Coverage type">
                  <select
                    id="coverage-type"
                    value={coverageForm.coverageType}
                    onChange={(event) => setCoverageForm((current) => ({ ...current, coverageType: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {enums.coverageTypes?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField id="coverage-sla" label="SLA minutes">
                    <TextInput
                      id="coverage-sla"
                      type="number"
                      value={coverageForm.slaMinutes}
                      onChange={(event) => setCoverageForm((current) => ({ ...current, slaMinutes: event.target.value }))}
                    />
                  </FormField>
                  <FormField id="coverage-capacity" label="Max capacity">
                    <TextInput
                      id="coverage-capacity"
                      type="number"
                      value={coverageForm.maxCapacity}
                      onChange={(event) => setCoverageForm((current) => ({ ...current, maxCapacity: event.target.value }))}
                    />
                  </FormField>
                </div>
                <FormField id="coverage-notes" label="Notes">
                  <TextArea
                    id="coverage-notes"
                    rows={3}
                    value={coverageForm.notes}
                    onChange={(event) => setCoverageForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </FormField>
                <div className="flex items-center justify-end gap-2">
                  {coverageForm.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setCoverageForm({
                          id: null,
                          zoneId: enums.zones?.[0]?.id ?? '',
                          coverageType: enums.coverageTypes?.[0]?.value ?? 'primary',
                          slaMinutes: 240,
                          maxCapacity: 0,
                          notes: ''
                        })
                      }
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                  <Button type="submit" size="sm" disabled={savingCoverage}>
                    {savingCoverage ? 'Saving…' : coverageForm.id ? 'Update coverage' : 'Add coverage'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <ProviderTaxManagementPanel
            companyId={selected.company?.id ?? null}
            taxProfile={selected.taxProfile}
            taxFilings={selected.taxFilings ?? []}
            taxStats={selected.taxStats}
            enums={{
              taxRegistrationStatuses: enums.taxRegistrationStatuses,
              taxAccountingMethods: enums.taxAccountingMethods,
              taxFilingFrequencies: enums.taxFilingFrequencies,
              taxFilingStatuses: enums.taxFilingStatuses
            }}
            handlers={{
              onUpdateTaxProfile: handlers.onUpdateTaxProfile,
              onCreateTaxFiling: handlers.onCreateTaxFiling,
              onUpdateTaxFiling: handlers.onUpdateTaxFiling,
              onDeleteTaxFiling: handlers.onDeleteTaxFiling
            }}
            disabled={!selected?.company?.id}
          />

          <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Compliance documents</h4>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Document</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                        No compliance documents uploaded yet.
                      </td>
                    </tr>
                  ) : null}
                  {selectedDocuments.map((document) => (
                    <tr key={document.id}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-primary">{document.type}</div>
                        <div className="text-xs text-slate-500">{document.fileName}</div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill tone={document.status === 'approved' ? 'success' : 'warning'}>
                          {document.status}
                        </StatusPill>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {document.expiryAt ? new Date(document.expiryAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {document.downloadUrl ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => window.open(document.downloadUrl, '_blank', 'noopener')}
                          >
                            Download
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">No download</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ProviderDocumentsSection
            companyId={selected?.company?.id}
            company={selected?.company}
            documents={selectedDocuments}
            handlers={handlers}
            links={selected?.links}
          />

          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-rose-600">Archive provider</h4>
              {archiveMessage ? <StatusPill tone={isArchived ? 'neutral' : 'warning'}>{archiveMessage}</StatusPill> : null}
            </div>
            <p className="text-sm text-slate-600">
              Archiving removes marketplace visibility, revokes dashboard access, and freezes billing for this SME. You can
              restore access later by updating their status from archived.
            </p>
            {archiveError ? (
              <div className="mt-3">
                <StatusPill tone="danger">{archiveError}</StatusPill>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              <FormField id="archive-reason" label="Reason for archive">
                <TextArea
                  id="archive-reason"
                  rows={3}
                  value={archiveReason}
                  onChange={(event) => setArchiveReason(event.target.value)}
                />
              </FormField>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Provide context so operations have a clear audit trail for this decision.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  loading={archiving}
                  disabled={archiving || isArchived || !canArchive}
                  title={!canArchive ? 'Archive permissions are not available' : undefined}
                  onClick={handleArchiveProvider}
                >
                  {isArchived ? 'Provider archived' : 'Archive provider'}
                </Button>
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}

ProviderDetailWorkspace.propTypes = {
  selected: PropTypes.shape({
    company: PropTypes.shape({
      id: PropTypes.string,
      region: PropTypes.object,
      regionId: PropTypes.string,
      contactName: PropTypes.string,
      contactEmail: PropTypes.string,
      serviceRegions: PropTypes.string,
      marketplaceIntent: PropTypes.string,
      verified: PropTypes.bool,
      insuredSellerStatus: PropTypes.string,
      insuredSellerBadgeVisible: PropTypes.bool,
      complianceScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    profile: PropTypes.shape({
      displayName: PropTypes.string,
      tradingName: PropTypes.string,
      status: PropTypes.string,
      onboardingStage: PropTypes.string,
      tier: PropTypes.string,
      riskRating: PropTypes.string,
      supportEmail: PropTypes.string,
      supportPhone: PropTypes.string,
      websiteUrl: PropTypes.string,
      logoUrl: PropTypes.string,
      heroImageUrl: PropTypes.string,
      operationsNotes: PropTypes.string,
      coverageNotes: PropTypes.string,
      storefrontSlug: PropTypes.string
    }),
    links: PropTypes.object,
    contacts: PropTypes.array,
    coverage: PropTypes.array,
    documents: PropTypes.array,
    taxProfile: PropTypes.object,
    taxFilings: PropTypes.array,
    taxStats: PropTypes.object
  }),
  enums: PropTypes.shape({
    statuses: PropTypes.array,
    onboardingStages: PropTypes.array,
    tiers: PropTypes.array,
    riskLevels: PropTypes.array,
    coverageTypes: PropTypes.array,
    insuredStatuses: PropTypes.array,
    taxRegistrationStatuses: PropTypes.array,
    taxAccountingMethods: PropTypes.array,
    taxFilingFrequencies: PropTypes.array,
    taxFilingStatuses: PropTypes.array,
    regions: PropTypes.array,
    zones: PropTypes.array
  }),
  detailLoading: PropTypes.bool,
  detailError: PropTypes.instanceOf(Error),
  handlers: PropTypes.shape({
    onUpdateProvider: PropTypes.func,
    onUpsertContact: PropTypes.func,
    onDeleteContact: PropTypes.func,
    onUpsertCoverage: PropTypes.func,
    onDeleteCoverage: PropTypes.func,
    onArchiveProvider: PropTypes.func,
    onUpdateTaxProfile: PropTypes.func,
    onCreateTaxFiling: PropTypes.func,
    onUpdateTaxFiling: PropTypes.func,
    onDeleteTaxFiling: PropTypes.func,
    onFetchComplianceSummary: PropTypes.func,
    onSubmitComplianceDocument: PropTypes.func,
    onReviewComplianceDocument: PropTypes.func,
    onEvaluateCompliance: PropTypes.func,
    onToggleComplianceBadge: PropTypes.func,
    onSuspendCompliance: PropTypes.func
  })
};

ProviderDetailWorkspace.defaultProps = {
  selected: null,
  enums: {},
  detailLoading: false,
  detailError: null,
  handlers: {}
};

export default ProviderDetailWorkspace;
