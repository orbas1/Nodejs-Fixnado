import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../components/ui/Spinner.jsx';
import PersonalDetailsForm from './components/PersonalDetailsForm.jsx';
import ContactPreferencesForm from './components/ContactPreferencesForm.jsx';
import WorkPreferencesForm from './components/WorkPreferencesForm.jsx';
import SkillsCertificationsForm from './components/SkillsCertificationsForm.jsx';
import AvailabilityTemplateForm from './components/AvailabilityTemplateForm.jsx';
import EquipmentAssignmentsForm from './components/EquipmentAssignmentsForm.jsx';
import DocumentsManager from './components/DocumentsManager.jsx';
import useServicemanProfileSettings from '../../hooks/useServicemanProfileSettings.js';

const LANGUAGE_OPTIONS = ['en-GB', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
const DEFAULT_AVAILABILITY = Object.freeze({
  monday: { available: true, start: '08:00', end: '17:00' },
  tuesday: { available: true, start: '08:00', end: '17:00' },
  wednesday: { available: true, start: '08:00', end: '17:00' },
  thursday: { available: true, start: '08:00', end: '17:00' },
  friday: { available: true, start: '08:00', end: '17:00' },
  saturday: { available: false, start: null, end: null },
  sunday: { available: false, start: null, end: null }
});

const buildTimezoneOptions = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (error) {
      console.warn('[servicemanProfile] Unable to enumerate timezones', error);
    }
  }
  return ['Europe/London', 'UTC', 'America/New_York', 'America/Los_Angeles'];
};

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(36).slice(2, 10)}`;
};

const cloneAvailability = (template) => {
  const source = template && Object.keys(template).length ? template : DEFAULT_AVAILABILITY;
  return JSON.parse(JSON.stringify(source));
};

function ServicemanProfileSettingsSection({ section }) {
  const {
    data,
    loading,
    error,
    saving,
    refresh,
    saveProfile,
    saveContact,
    saveWork,
    saveSkills,
    saveAvailability,
    saveEquipment,
    saveDocuments
  } = useServicemanProfileSettings();

  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);

  const [profileForm, setProfileForm] = useState(null);
  const [contactForm, setContactForm] = useState(null);
  const [workForm, setWorkForm] = useState(null);
  const [skillsForm, setSkillsForm] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState(DEFAULT_AVAILABILITY);
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [documentItems, setDocumentItems] = useState([]);

  const [profileStatus, setProfileStatus] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);
  const [workStatus, setWorkStatus] = useState(null);
  const [skillsStatus, setSkillsStatus] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [equipmentStatus, setEquipmentStatus] = useState(null);
  const [documentsStatus, setDocumentsStatus] = useState(null);

  useEffect(() => {
    if (!data) return;
    setProfileForm({
      firstName: data.profile?.firstName ?? '',
      lastName: data.profile?.lastName ?? '',
      preferredName: data.profile?.preferredName ?? '',
      title: data.profile?.title ?? '',
      badgeId: data.profile?.badgeId ?? '',
      region: data.profile?.region ?? '',
      summary: data.profile?.summary ?? '',
      bio: data.profile?.bio ?? '',
      avatarUrl: data.profile?.avatarUrl ?? '',
      email: data.profile?.email ?? '',
      timezone: data.profile?.timezone && timezoneOptions.includes(data.profile.timezone)
        ? data.profile.timezone
        : timezoneOptions[0],
      language: data.profile?.language && LANGUAGE_OPTIONS.includes(data.profile.language)
        ? data.profile.language
        : LANGUAGE_OPTIONS[0]
    });
    setContactForm({
      phoneNumber: data.contact?.phoneNumber ?? '',
      email: data.contact?.email ?? data.profile?.email ?? '',
      emergencyContacts: (data.contact?.emergencyContacts ?? []).map((contact) => ({
        id: contact.id ?? createLocalId(),
        name: contact.name ?? '',
        relationship: contact.relationship ?? '',
        phoneNumber: contact.phoneNumber ?? '',
        email: contact.email ?? ''
      }))
    });
    setWorkForm({
      preferredShiftStart: data.workPreferences?.preferredShiftStart ?? '08:00',
      preferredShiftEnd: data.workPreferences?.preferredShiftEnd ?? '17:00',
      maxJobsPerDay: data.workPreferences?.maxJobsPerDay ?? 5,
      travelRadiusKm: data.workPreferences?.travelRadiusKm ?? 25,
      crewLeadEligible: Boolean(data.workPreferences?.crewLeadEligible),
      mentorEligible: Boolean(data.workPreferences?.mentorEligible),
      remoteSupport: Boolean(data.workPreferences?.remoteSupport)
    });
    setSkillsForm({
      specialties: Array.isArray(data.skills?.specialties)
        ? [...data.skills.specialties]
        : [],
      certifications: Array.isArray(data.skills?.certifications)
        ? data.skills.certifications.map((cert) => ({
            id: cert.id ?? createLocalId(),
            name: cert.name ?? '',
            issuer: cert.issuer ?? '',
            issuedOn: cert.issuedOn ?? '',
            expiresOn: cert.expiresOn ?? '',
            credentialUrl: cert.credentialUrl ?? ''
          }))
        : []
    });
    setAvailabilityForm(cloneAvailability(data.availability?.template));
    setEquipmentItems(
      Array.isArray(data.equipment)
        ? data.equipment.map((item) => ({
            id: item.id ?? createLocalId(),
            name: item.name ?? '',
            status: item.status ?? '',
            serialNumber: item.serialNumber ?? '',
            assignedOn: item.assignedOn ?? '',
            notes: item.notes ?? ''
          }))
        : []
    );
    setDocumentItems(
      Array.isArray(data.documents)
        ? data.documents.map((doc) => ({
            id: doc.id ?? createLocalId(),
            name: doc.name ?? '',
            type: doc.type ?? '',
            url: doc.url ?? '',
            expiresOn: doc.expiresOn ?? '',
            notes: doc.notes ?? ''
          }))
        : []
    );
    setProfileStatus(null);
    setContactStatus(null);
    setWorkStatus(null);
    setSkillsStatus(null);
    setAvailabilityStatus(null);
    setEquipmentStatus(null);
    setDocumentsStatus(null);
  }, [data, timezoneOptions]);

  const lastUpdatedDisplay = useMemo(() => {
    const iso = data?.metadata?.lastUpdatedAt;
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString();
    } catch (caught) {
      console.warn('[servicemanProfile] Unable to format timestamp', caught);
      return iso;
    }
  }, [data]);

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleContactFieldChange = (field, value) => {
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  const handleContactChange = (index, field, value) => {
    setContactForm((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.map((contact, position) =>
        position === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleAddContact = () => {
    setContactForm((current) => ({
      ...current,
      emergencyContacts: [
        ...current.emergencyContacts,
        { id: createLocalId(), name: '', relationship: '', phoneNumber: '', email: '' }
      ]
    }));
  };

  const handleRemoveContact = (index) => {
    setContactForm((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.filter((_, position) => position !== index)
    }));
  };

  const handleWorkChange = (field, value) => {
    setWorkForm((current) => ({ ...current, [field]: value }));
  };

  const handleSpecialtyChange = (index, value) => {
    setSkillsForm((current) => ({
      ...current,
      specialties: current.specialties.map((entry, position) => (position === index ? value : entry))
    }));
  };

  const handleAddSpecialty = () => {
    setSkillsForm((current) => ({ ...current, specialties: [...current.specialties, ''] }));
  };

  const handleRemoveSpecialty = (index) => {
    setSkillsForm((current) => ({
      ...current,
      specialties: current.specialties.filter((_, position) => position !== index)
    }));
  };

  const handleCertificationChange = (index, field, value) => {
    setSkillsForm((current) => ({
      ...current,
      certifications: current.certifications.map((certification, position) =>
        position === index ? { ...certification, [field]: value } : certification
      )
    }));
  };

  const handleAddCertification = () => {
    setSkillsForm((current) => ({
      ...current,
      certifications: [
        ...current.certifications,
        { id: createLocalId(), name: '', issuer: '', issuedOn: '', expiresOn: '', credentialUrl: '' }
      ]
    }));
  };

  const handleRemoveCertification = (index) => {
    setSkillsForm((current) => ({
      ...current,
      certifications: current.certifications.filter((_, position) => position !== index)
    }));
  };

  const handleToggleDay = (day, available) => {
    setAvailabilityForm((current) => ({
      ...current,
      [day]: {
        available,
        start: available ? current[day]?.start ?? DEFAULT_AVAILABILITY[day].start : null,
        end: available ? current[day]?.end ?? DEFAULT_AVAILABILITY[day].end : null
      }
    }));
  };

  const handleAvailabilityTimeChange = (day, field, value) => {
    setAvailabilityForm((current) => ({
      ...current,
      [day]: { ...current[day], [field]: value }
    }));
  };

  const handleEquipmentChange = (index, field, value) => {
    setEquipmentItems((current) =>
      current.map((item, position) => (position === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddEquipment = () => {
    setEquipmentItems((current) => [
      ...current,
      { id: createLocalId(), name: '', status: '', serialNumber: '', assignedOn: '', notes: '' }
    ]);
  };

  const handleRemoveEquipment = (index) => {
    setEquipmentItems((current) => current.filter((_, position) => position !== index));
  };

  const handleDocumentChange = (index, field, value) => {
    setDocumentItems((current) =>
      current.map((document, position) => (position === index ? { ...document, [field]: value } : document))
    );
  };

  const handleAddDocument = () => {
    setDocumentItems((current) => [
      ...current,
      { id: createLocalId(), name: '', type: '', url: '', expiresOn: '', notes: '' }
    ]);
  };

  const handleRemoveDocument = (index) => {
    setDocumentItems((current) => current.filter((_, position) => position !== index));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm) return;
    setProfileStatus(null);
    try {
      await saveProfile(profileForm);
      setProfileStatus({ type: 'success', message: 'Profile details saved.' });
    } catch (caught) {
      setProfileStatus({
        type: 'error',
        message: caught?.message || 'Unable to update profile details.'
      });
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (!contactForm) return;
    setContactStatus(null);
    try {
      await saveContact({
        phoneNumber: contactForm.phoneNumber,
        email: contactForm.email,
        emergencyContacts: contactForm.emergencyContacts
      });
      setContactStatus({ type: 'success', message: 'Contact preferences updated.' });
    } catch (caught) {
      setContactStatus({
        type: 'error',
        message: caught?.message || 'Unable to save contact preferences.'
      });
    }
  };

  const handleWorkSubmit = async (event) => {
    event.preventDefault();
    if (!workForm) return;
    setWorkStatus(null);
    try {
      await saveWork({
        preferredShiftStart: workForm.preferredShiftStart,
        preferredShiftEnd: workForm.preferredShiftEnd,
        maxJobsPerDay: workForm.maxJobsPerDay,
        travelRadiusKm: workForm.travelRadiusKm,
        crewLeadEligible: workForm.crewLeadEligible,
        mentorEligible: workForm.mentorEligible,
        remoteSupport: workForm.remoteSupport
      });
      setWorkStatus({ type: 'success', message: 'Work preferences saved.' });
    } catch (caught) {
      setWorkStatus({
        type: 'error',
        message: caught?.message || 'Unable to update work preferences.'
      });
    }
  };

  const handleSkillsSubmit = async (event) => {
    event.preventDefault();
    if (!skillsForm) return;
    setSkillsStatus(null);
    try {
      await saveSkills({
        specialties: skillsForm.specialties,
        certifications: skillsForm.certifications
      });
      setSkillsStatus({ type: 'success', message: 'Skills and certifications updated.' });
    } catch (caught) {
      setSkillsStatus({
        type: 'error',
        message: caught?.message || 'Unable to save skills and certifications.'
      });
    }
  };

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault();
    setAvailabilityStatus(null);
    try {
      await saveAvailability({ template: availabilityForm });
      setAvailabilityStatus({ type: 'success', message: 'Availability template saved.' });
    } catch (caught) {
      setAvailabilityStatus({
        type: 'error',
        message: caught?.message || 'Unable to update availability template.'
      });
    }
  };

  const handleEquipmentSubmit = async (event) => {
    event.preventDefault();
    setEquipmentStatus(null);
    try {
      await saveEquipment(equipmentItems);
      setEquipmentStatus({ type: 'success', message: 'Equipment assignments saved.' });
    } catch (caught) {
      setEquipmentStatus({
        type: 'error',
        message: caught?.message || 'Unable to save equipment assignments.'
      });
    }
  };

  const handleDocumentsSubmit = async (event) => {
    event.preventDefault();
    setDocumentsStatus(null);
    try {
      await saveDocuments(documentItems);
      setDocumentsStatus({ type: 'success', message: 'Documents updated.' });
    } catch (caught) {
      setDocumentsStatus({
        type: 'error',
        message: caught?.message || 'Unable to save documents.'
      });
    }
  };

  const overallSaving = saving.profile || saving.contact || saving.work || saving.skills || saving.availability || saving.equipment || saving.documents;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary">{section?.label ?? 'Profile Settings'}</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            {section?.description ??
              'Maintain a production-ready crew profile with identity, escalation, equipment, and credential data.'}
          </p>
          {section?.data?.helper ? (
            <p className="mt-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 text-xs text-primary/80">
              {section.data.helper}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          {lastUpdatedDisplay ? (
            <p className="text-xs text-slate-500">Last updated {lastUpdatedDisplay}</p>
          ) : null}
          <button
            type="button"
            onClick={() => refresh().catch(() => {})}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={overallSaving || loading}
          >
            Refresh data
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center justify-center rounded-2xl border border-accent/10 bg-white/80 py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-8">
          {profileForm ? (
            <PersonalDetailsForm
              form={profileForm}
              timezoneOptions={timezoneOptions}
              languageOptions={LANGUAGE_OPTIONS}
              onFieldChange={handleProfileChange}
              onSubmit={handleProfileSubmit}
              saving={saving.profile}
              status={profileStatus}
            />
          ) : null}

          {contactForm ? (
            <ContactPreferencesForm
              form={contactForm}
              onFieldChange={handleContactFieldChange}
              onContactChange={handleContactChange}
              onAddContact={handleAddContact}
              onRemoveContact={handleRemoveContact}
              onSubmit={handleContactSubmit}
              saving={saving.contact}
              status={contactStatus}
            />
          ) : null}

          {workForm ? (
            <WorkPreferencesForm
              form={workForm}
              onFieldChange={handleWorkChange}
              onSubmit={handleWorkSubmit}
              saving={saving.work}
              status={workStatus}
            />
          ) : null}

          {skillsForm ? (
            <SkillsCertificationsForm
              form={skillsForm}
              onSpecialtyChange={handleSpecialtyChange}
              onAddSpecialty={handleAddSpecialty}
              onRemoveSpecialty={handleRemoveSpecialty}
              onCertificationChange={handleCertificationChange}
              onAddCertification={handleAddCertification}
              onRemoveCertification={handleRemoveCertification}
              onSubmit={handleSkillsSubmit}
              saving={saving.skills}
              status={skillsStatus}
            />
          ) : null}

          <AvailabilityTemplateForm
            form={availabilityForm}
            onToggleDay={handleToggleDay}
            onTimeChange={handleAvailabilityTimeChange}
            onSubmit={handleAvailabilitySubmit}
            saving={saving.availability}
            status={availabilityStatus}
          />

          <EquipmentAssignmentsForm
            items={equipmentItems}
            onItemChange={handleEquipmentChange}
            onAddItem={handleAddEquipment}
            onRemoveItem={handleRemoveEquipment}
            onSubmit={handleEquipmentSubmit}
            saving={saving.equipment}
            status={equipmentStatus}
          />

          <DocumentsManager
            documents={documentItems}
            onDocumentChange={handleDocumentChange}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            onSubmit={handleDocumentsSubmit}
            saving={saving.documents}
            status={documentsStatus}
          />
        </div>
      )}
    </div>
  );
}

ServicemanProfileSettingsSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.object
  })
};

ServicemanProfileSettingsSection.defaultProps = {
  section: null
};

export default ServicemanProfileSettingsSection;
