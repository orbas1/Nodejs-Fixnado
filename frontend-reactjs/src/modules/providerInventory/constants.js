export const ITEM_TYPES = [
  { value: 'tool', label: 'Tool' },
  { value: 'material', label: 'Material' }
];

export const FULFILMENT_TYPES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'rental', label: 'Rental' },
  { value: 'hybrid', label: 'Rental or purchase' }
];

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'retired', label: 'Retired' }
];

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_service', label: 'Needs service' }
];

export const SUPPLIER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export function createEmptyItemForm() {
  return {
    id: null,
    companyId: '',
    name: '',
    sku: '',
    categoryId: '',
    category: '',
    unitType: 'unit',
    itemType: 'tool',
    fulfilmentType: 'purchase',
    status: 'active',
    tagline: '',
    description: '',
    quantityOnHand: '0',
    quantityReserved: '0',
    safetyStock: '0',
    rentalRate: '',
    rentalRateCurrency: 'GBP',
    depositAmount: '',
    depositCurrency: 'GBP',
    purchasePrice: '',
    purchasePriceCurrency: 'GBP',
    replacementCost: '',
    insuranceRequired: false,
    conditionRating: 'good',
    locationZoneId: '',
    tagIds: [],
    metadata: {}
  };
}

export function createEmptyCategoryForm() {
  return {
    id: null,
    companyId: '',
    name: '',
    description: '',
    sortOrder: '0',
    status: 'active'
  };
}

export function createEmptyTagForm() {
  return {
    id: null,
    companyId: '',
    name: '',
    color: '',
    description: '',
    status: 'active'
  };
}

export function createEmptyZoneForm() {
  return {
    id: null,
    companyId: '',
    name: '',
    code: '',
    description: '',
    status: 'active'
  };
}

export function createEmptySupplierLinkForm() {
  return {
    id: null,
    supplierId: '',
    unitPrice: '',
    currency: 'GBP',
    minimumOrderQuantity: '1',
    leadTimeDays: '',
    isPrimary: false,
    status: 'active',
    notes: ''
  };
}

export function createEmptyMediaForm() {
  return {
    id: null,
    url: '',
    altText: '',
    caption: '',
    sortOrder: '0'
  };
}
