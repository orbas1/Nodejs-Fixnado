import ProviderOnboardingProvider from '../modules/providerOnboarding/ProviderOnboardingProvider.jsx';
import OnboardingManagementWorkspace from '../modules/providerOnboarding/OnboardingManagementWorkspace.jsx';

export default function ProviderOnboardingManagement() {
  return (
    <ProviderOnboardingProvider>
      <OnboardingManagementWorkspace />
    </ProviderOnboardingProvider>
  );
}
