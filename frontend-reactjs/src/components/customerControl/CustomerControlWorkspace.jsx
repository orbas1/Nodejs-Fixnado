import CustomerProfileSection from './CustomerProfileSection.jsx';
import CustomerContactsSection from './CustomerContactsSection.jsx';
import CustomerLocationsSection from './CustomerLocationsSection.jsx';
import useCustomerControl from './useCustomerControl.js';

const CustomerControlWorkspace = () => {
  const {
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
  } = useCustomerControl();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-full bg-primary/10" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-3xl bg-primary/10" />
          <div className="h-56 animate-pulse rounded-3xl bg-primary/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold">We couldn’t load the customer overview tools.</p>
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <CustomerProfileSection
        profile={profile}
        personaSummary={personaSummary}
        onChange={handleProfileChange}
        onCheckbox={handleProfileCheckbox}
        onSubmit={handleProfileSubmit}
        status={profileStatus}
        saving={profileSaving}
      />

      <CustomerContactsSection
        contacts={contacts}
        status={contactStatus}
        saving={contactSaving}
        onCreate={openCreateContact}
        onEdit={openEditContact}
        onDelete={handleDeleteContact}
        modalOpen={contactModalOpen}
        activeContact={activeContact}
        onCloseModal={closeContactModal}
        onSubmit={handleContactSubmit}
      />

      <CustomerLocationsSection
        locations={locations}
        status={locationStatus}
        saving={locationSaving}
        onCreate={openCreateLocation}
        onEdit={openEditLocation}
        onDelete={handleDeleteLocation}
        modalOpen={locationModalOpen}
        activeLocation={activeLocation}
        onCloseModal={closeLocationModal}
        onSubmit={handleLocationSubmit}
      />
    </div>
  );
};

export default CustomerControlWorkspace;
