import { ProviderInventoryProvider } from '../modules/providerInventory/ProviderInventoryProvider.jsx';
import ProviderInventoryWorkspace from '../modules/providerInventory/ProviderInventoryWorkspace.jsx';

export default function ProviderInventory() {
  return (
    <ProviderInventoryProvider>
      <ProviderInventoryWorkspace />
    </ProviderInventoryProvider>
  );
}
