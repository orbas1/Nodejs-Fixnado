import ProviderDeploymentProvider from '../modules/providerDeployment/ProviderDeploymentProvider.jsx';
import ProviderDeploymentWorkspace from '../modules/providerDeployment/ProviderDeploymentWorkspace.jsx';

export default function ProviderDeploymentManagement() {
  return (
    <ProviderDeploymentProvider>
      <ProviderDeploymentWorkspace />
    </ProviderDeploymentProvider>
  );
}
