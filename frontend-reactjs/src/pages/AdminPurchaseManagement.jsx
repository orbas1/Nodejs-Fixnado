import { PurchaseManagementProvider } from '../modules/purchaseManagement/PurchaseManagementProvider.jsx';
import PurchaseManagementWorkspace from '../modules/purchaseManagement/PurchaseManagementWorkspace.jsx';

export default function AdminPurchaseManagement() {
  return (
    <PurchaseManagementProvider>
      <PurchaseManagementWorkspace />
    </PurchaseManagementProvider>
  );
}
