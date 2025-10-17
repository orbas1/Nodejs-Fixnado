import { StorefrontManagementProvider } from '../modules/storefrontManagement/StorefrontManagementProvider.jsx';
import StorefrontManagementWorkspace from '../modules/storefrontManagement/StorefrontManagementWorkspace.jsx';

export default function ProviderStorefrontControl() {
  return (
    <StorefrontManagementProvider>
      <StorefrontManagementWorkspace />
    </StorefrontManagementProvider>
  );
}
