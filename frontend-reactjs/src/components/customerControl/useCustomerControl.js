import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCustomerOverview,
  saveCustomerProfile,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  createCustomerLocation,
  updateCustomerLocation,
  deleteCustomerLocation
} from '../../api/customerControlClient.js';
import { contactTemplate, defaultProfile, locationTemplate } from './constants.js';

const normaliseProfile = (profile) => ({
  ...defaultProfile,
  ...(profile ?? {}),
  escalationWindowMinutes: Number.isFinite(profile?.escalationWindowMinutes)
    ? profile.escalationWindowMinutes
    : defaultProfile.escalationWindowMinutes,
  marketingOptIn: Boolean(profile?.marketingOptIn),
  notificationsEmailOptIn:
    profile?.notificationsEmailOptIn === undefined
      ? defaultProfile.notificationsEmailOptIn
      : Boolean(profile?.notificationsEmailOptIn),
  notificationsSmsOptIn: Boolean(profile?.notificationsSmsOptIn)
});

const normaliseContact = (contact) => ({
  ...contactTemplate,
  ...(contact ?? {}),
  isPrimary: Boolean(contact?.isPrimary)
});

const normaliseLocation = (location) => ({
  ...locationTemplate,
  ...(location ?? {}),
  isPrimary: Boolean(location?.isPrimary)
});

export const useCustomerControl = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profileStatus, setProfileStatus] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      try {
        const data = await fetchCustomerOverview({ signal });
        if (signal?.aborted) return;
        setProfile(normaliseProfile(data.profile));
        setContacts(Array.isArray(data.contacts) ? data.contacts.map(normaliseContact) : []);
        setLocations(Array.isArray(data.locations) ? data.locations.map(normaliseLocation) : []);
        setError(null);
      } catch (caught) {
        if (signal?.aborted) return;
        setError(caught?.message || 'Unable to load customer overview');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadOverview({ signal: controller.signal });
    return () => controller.abort();
  }, [loadOverview]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadOverview();
  }, [loadOverview]);

  const handleProfileChange = useCallback((field, value) => {
    setProfile((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleProfileCheckbox = useCallback((field, value) => {
    setProfile((previous) => ({ ...previous, [field]: Boolean(value) }));
  }, []);

  const handleProfileSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProfileSaving(true);
      setProfileStatus(null);
      try {
        const { profile: savedProfile } = await saveCustomerProfile(profile);
        setProfile(normaliseProfile(savedProfile));
        setProfileStatus({ tone: 'success', message: 'Customer profile updated successfully.' });
      } catch (caught) {
        setProfileStatus({ tone: 'error', message: caught?.message || 'Unable to save profile.' });
      } finally {
        setProfileSaving(false);
      }
    },
    [profile]
  );

  const openCreateContact = useCallback(() => {
    setActiveContact(normaliseContact(contactTemplate));
    setContactStatus(null);
    setContactModalOpen(true);
  }, []);

  const openEditContact = useCallback((contact) => {
    setActiveContact(normaliseContact(contact));
    setContactStatus(null);
    setContactModalOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setContactModalOpen(false);
    setActiveContact(null);
  }, []);

  const handleContactSubmit = useCallback(
    async (form) => {
      setContactSaving(true);
      try {
        if (form.id) {
          const { contact } = await updateCustomerContact(form.id, form);
          setContacts((previous) => previous.map((item) => (item.id === contact.id ? normaliseContact(contact) : item)));
          setContactStatus({ tone: 'success', message: 'Contact updated.' });
        } else {
          const { contact } = await createCustomerContact(form);
          setContacts((previous) => [...previous, normaliseContact(contact)]);
          setContactStatus({ tone: 'success', message: 'Contact added.' });
        }
        setContactModalOpen(false);
        setActiveContact(null);
      } catch (caught) {
        setContactStatus({ tone: 'error', message: caught?.message || 'Unable to save contact.' });
      } finally {
        setContactSaving(false);
      }
    },
    []
  );

  const handleDeleteContact = useCallback(async (contactId) => {
    setContactSaving(true);
    try {
      await deleteCustomerContact(contactId);
      setContacts((previous) => previous.filter((contact) => contact.id !== contactId));
      setContactStatus({ tone: 'success', message: 'Contact removed.' });
    } catch (caught) {
      setContactStatus({ tone: 'error', message: caught?.message || 'Unable to remove contact.' });
    } finally {
      setContactSaving(false);
    }
  }, []);

  const openCreateLocation = useCallback(() => {
    setActiveLocation(normaliseLocation(locationTemplate));
    setLocationStatus(null);
    setLocationModalOpen(true);
  }, []);

  const openEditLocation = useCallback((location) => {
    setActiveLocation(normaliseLocation(location));
    setLocationStatus(null);
    setLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setLocationModalOpen(false);
    setActiveLocation(null);
  }, []);

  const handleLocationSubmit = useCallback(async (form) => {
    setLocationSaving(true);
    try {
      if (form.id) {
        const { location } = await updateCustomerLocation(form.id, form);
        setLocations((previous) => previous.map((item) => (item.id === location.id ? normaliseLocation(location) : item)));
        setLocationStatus({ tone: 'success', message: 'Location updated.' });
      } else {
        const { location } = await createCustomerLocation(form);
        setLocations((previous) => [...previous, normaliseLocation(location)]);
        setLocationStatus({ tone: 'success', message: 'Location added.' });
      }
      setLocationModalOpen(false);
      setActiveLocation(null);
    } catch (caught) {
      setLocationStatus({ tone: 'error', message: caught?.message || 'Unable to save location.' });
    } finally {
      setLocationSaving(false);
    }
  }, []);

  const handleDeleteLocation = useCallback(async (locationId) => {
    setLocationSaving(true);
    try {
      await deleteCustomerLocation(locationId);
      setLocations((previous) => previous.filter((location) => location.id !== locationId));
      setLocationStatus({ tone: 'success', message: 'Location removed.' });
    } catch (caught) {
      setLocationStatus({ tone: 'error', message: caught?.message || 'Unable to remove location.' });
    } finally {
      setLocationSaving(false);
    }
  }, []);

  const personaSummary = useMemo(() => {
    const contactCount = contacts.length;
    const locationCount = locations.length;
    return `${contactCount} team contact${contactCount === 1 ? '' : 's'} • ${locationCount} location${
      locationCount === 1 ? '' : 's'
    }`;
  }, [contacts.length, locations.length]);

  return {
    state: {
      loading,
      error,
      profile,
      contacts,
      locations,
      personaSummary,
      profileStatus,
      contactStatus,
      locationStatus,
      profileSaving,
      contactSaving,
      locationSaving,
      contactModalOpen,
      locationModalOpen,
      activeContact,
      activeLocation
    },
    actions: {
      reload,
      handleProfileChange,
      handleProfileCheckbox,
      handleProfileSubmit,
      openCreateContact,
      openEditContact,
      closeContactModal,
      handleContactSubmit,
      handleDeleteContact,
      openCreateLocation,
      openEditLocation,
      closeLocationModal,
      handleLocationSubmit,
      handleDeleteLocation
    }
  };
};

export default useCustomerControl;
