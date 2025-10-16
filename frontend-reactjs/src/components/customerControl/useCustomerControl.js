import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCustomerOverview,
  saveCustomerProfile,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  createCustomerLocation,
  updateCustomerLocation,
  deleteCustomerLocation,
  createCustomerCoupon,
  updateCustomerCoupon,
  deleteCustomerCoupon
} from '../../api/customerControlClient.js';
import { contactTemplate, couponTemplate, defaultProfile, locationTemplate } from './constants.js';

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

const normaliseCoupon = (coupon) => {
  const discountValue = Number.parseFloat(coupon?.discountValue);
  const minOrderTotal = Number.parseFloat(coupon?.minOrderTotal);
  const toDateInput = (value) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  };

  return {
    ...couponTemplate,
    ...(coupon ?? {}),
    name: coupon?.name ?? '',
    code: coupon?.code ?? '',
    description: coupon?.description ?? '',
    discountType: coupon?.discountType ?? couponTemplate.discountType,
    discountValue: Number.isFinite(discountValue) ? Number(discountValue.toFixed(2)) : couponTemplate.discountValue,
    currency: coupon?.currency ?? '',
    minOrderTotal: Number.isFinite(minOrderTotal) ? Number(minOrderTotal.toFixed(2)) : '',
    startsAt: toDateInput(coupon?.startsAt),
    expiresAt: toDateInput(coupon?.expiresAt),
    maxRedemptions:
      coupon?.maxRedemptions === null || coupon?.maxRedemptions === undefined
        ? ''
        : `${coupon.maxRedemptions}`,
    maxRedemptionsPerCustomer:
      coupon?.maxRedemptionsPerCustomer === null || coupon?.maxRedemptionsPerCustomer === undefined
        ? ''
        : `${coupon.maxRedemptionsPerCustomer}`,
    autoApply: Boolean(coupon?.autoApply),
    status: coupon?.status ?? couponTemplate.status,
    lifecycleStatus: coupon?.lifecycleStatus ?? couponTemplate.lifecycleStatus,
    imageUrl: coupon?.imageUrl ?? '',
    termsUrl: coupon?.termsUrl ?? '',
    internalNotes: coupon?.internalNotes ?? '',
    createdAt: coupon?.createdAt ?? null,
    updatedAt: coupon?.updatedAt ?? null
  };
};

const toIsoDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' && value.includes('T')) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === 'string') {
    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const date = endOfDay
        ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 0))
        : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
};

const decimalOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Number.parseFloat(numeric.toFixed(2));
};

const integerOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const trimOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
};

const prepareCouponPayload = (form) => {
  const name = `${form.name ?? ''}`.trim();
  const code = `${form.code ?? ''}`.trim().toUpperCase();
  const status = `${form.status ?? ''}`.trim().toLowerCase() || 'draft';
  const discountValue = Number.parseFloat(form.discountValue ?? 0);

  return {
    name,
    code,
    description: trimOrNull(form.description),
    discountType: form.discountType,
    discountValue: Number.isFinite(discountValue) ? Number.parseFloat(discountValue.toFixed(2)) : 0,
    currency:
      form.discountType === 'fixed'
        ? (() => {
            const currency = trimOrNull(form.currency);
            return currency ? currency.toUpperCase() : null;
          })()
        : null,
    minOrderTotal: decimalOrNull(form.minOrderTotal),
    startsAt: toIsoDate(form.startsAt, false),
    expiresAt: toIsoDate(form.expiresAt, true),
    maxRedemptions: integerOrNull(form.maxRedemptions),
    maxRedemptionsPerCustomer: integerOrNull(form.maxRedemptionsPerCustomer),
    autoApply: Boolean(form.autoApply),
    status,
    imageUrl: trimOrNull(form.imageUrl),
    termsUrl: trimOrNull(form.termsUrl),
    internalNotes: trimOrNull(form.internalNotes)
  };
};

export const useCustomerControl = () => {
  const [profile, setProfile] = useState(defaultProfile);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profileStatus, setProfileStatus] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [couponStatus, setCouponStatus] = useState(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      try {
        const data = await fetchCustomerOverview({ signal });
        if (signal?.aborted) return;
        setProfile(normaliseProfile(data.profile));
        setContacts(Array.isArray(data.contacts) ? data.contacts.map(normaliseContact) : []);
        setLocations(Array.isArray(data.locations) ? data.locations.map(normaliseLocation) : []);
        setCoupons(Array.isArray(data.coupons) ? data.coupons.map(normaliseCoupon) : []);
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
    setCouponStatus(null);
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

  const openCreateCoupon = useCallback(() => {
    setActiveCoupon(normaliseCoupon(couponTemplate));
    setCouponStatus(null);
    setCouponModalOpen(true);
  }, []);

  const openEditCoupon = useCallback((coupon) => {
    setActiveCoupon(normaliseCoupon(coupon));
    setCouponStatus(null);
    setCouponModalOpen(true);
  }, []);

  const closeCouponModal = useCallback(() => {
    setCouponModalOpen(false);
    setActiveCoupon(null);
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

  const handleCouponSubmit = useCallback(
    async (form) => {
      setCouponSaving(true);
      try {
        const payload = prepareCouponPayload(form);
        if (form.id) {
          const { coupon } = await updateCustomerCoupon(form.id, payload);
          setCoupons((previous) => previous.map((item) => (item.id === coupon.id ? normaliseCoupon(coupon) : item)));
          setCouponStatus({ tone: 'success', message: 'Coupon updated.' });
        } else {
          const { coupon } = await createCustomerCoupon(payload);
          setCoupons((previous) => [normaliseCoupon(coupon), ...previous]);
          setCouponStatus({ tone: 'success', message: 'Coupon created.' });
        }
        setCouponModalOpen(false);
        setActiveCoupon(null);
      } catch (caught) {
        setCouponStatus({ tone: 'error', message: caught?.message || 'Unable to save coupon.' });
      } finally {
        setCouponSaving(false);
      }
    },
    []
  );

  const handleDeleteCoupon = useCallback(async (couponId) => {
    setCouponSaving(true);
    try {
      await deleteCustomerCoupon(couponId);
      setCoupons((previous) => previous.filter((coupon) => coupon.id !== couponId));
      setCouponStatus({ tone: 'success', message: 'Coupon removed.' });
    } catch (caught) {
      setCouponStatus({ tone: 'error', message: caught?.message || 'Unable to remove coupon.' });
    } finally {
      setCouponSaving(false);
    }
  }, []);

  const personaSummary = useMemo(() => {
    const contactCount = contacts.length;
    const locationCount = locations.length;
    const couponCount = coupons.length;
    return `${contactCount} team contact${contactCount === 1 ? '' : 's'} • ${locationCount} location${
      locationCount === 1 ? '' : 's'
    } • ${couponCount} coupon${couponCount === 1 ? '' : 's'}`;
  }, [contacts.length, locations.length, coupons.length]);

  return {
    state: {
      loading,
      error,
      profile,
      contacts,
      locations,
      coupons,
      personaSummary,
      profileStatus,
      contactStatus,
      locationStatus,
      couponStatus,
      profileSaving,
      contactSaving,
      locationSaving,
      couponSaving,
      contactModalOpen,
      locationModalOpen,
      activeContact,
      activeLocation,
      couponModalOpen,
      activeCoupon
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
      handleDeleteLocation,
      openCreateCoupon,
      openEditCoupon,
      closeCouponModal,
      handleCouponSubmit,
      handleDeleteCoupon
    }
  };
};

export default useCustomerControl;
