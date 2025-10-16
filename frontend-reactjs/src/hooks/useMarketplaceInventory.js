import { useCallback, useEffect, useState } from 'react';

const INVENTORY_STORAGE_KEY = 'fixnado:marketplaceInventory';
const INVENTORY_EVENT = 'fixnado:marketplace:inventory';

const DEFAULT_STATE = Object.freeze({
  saved: [],
  purchases: []
});

function normaliseInventory(value) {
  if (!value || typeof value !== 'object') {
    return { saved: [], purchases: [] };
  }
  const saved = Array.isArray(value.saved) ? value.saved : [];
  const purchases = Array.isArray(value.purchases) ? value.purchases : [];
  return { saved, purchases };
}

function readInventory() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE };
  }

  try {
    const stored = window.localStorage?.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }
    return normaliseInventory(JSON.parse(stored));
  } catch (error) {
    console.warn('[useMarketplaceInventory] unable to parse stored inventory', error);
    return { ...DEFAULT_STATE };
  }
}

function writeInventory(next) {
  if (typeof window === 'undefined') {
    return next;
  }
  try {
    window.localStorage?.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: next }));
  } catch (error) {
    console.warn('[useMarketplaceInventory] unable to persist inventory state', error);
  }
  return next;
}

export function useMarketplaceInventory() {
  const [inventory, setInventory] = useState(() => readInventory());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === INVENTORY_STORAGE_KEY) {
        setInventory(readInventory());
      }
    };

    const handleEvent = (event) => {
      if (event?.detail) {
        setInventory(normaliseInventory(event.detail));
      } else {
        setInventory(readInventory());
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(INVENTORY_EVENT, handleEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(INVENTORY_EVENT, handleEvent);
    };
  }, []);

  const updateInventory = useCallback((updater) => {
    setInventory((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return writeInventory(normaliseInventory(next));
    });
  }, []);

  const saveListing = useCallback((listing) => {
    if (!listing?.id) {
      return;
    }
    updateInventory((current) => {
      const exists = current.saved.some((item) => item.id === listing.id);
      if (exists) {
        return current;
      }
      return {
        ...current,
        saved: [...current.saved, { ...listing, savedAt: new Date().toISOString() }]
      };
    });
  }, [updateInventory]);

  const removeSavedListing = useCallback((listingId) => {
    updateInventory((current) => ({
      ...current,
      saved: current.saved.filter((item) => item.id !== listingId)
    }));
  }, [updateInventory]);

  const recordPurchase = useCallback((listing, quantity = 1) => {
    if (!listing?.id) {
      return;
    }
    updateInventory((current) => ({
      saved: current.saved.filter((item) => item.id !== listing.id),
      purchases: [
        ...current.purchases,
        {
          id: listing.id,
          title: listing.title,
          pricePerDay: listing.pricePerDay ?? null,
          purchasePrice: listing.purchasePrice ?? null,
          quantity,
          purchasedAt: new Date().toISOString()
        }
      ]
    }));
  }, [updateInventory]);

  return {
    saved: inventory.saved,
    purchases: inventory.purchases,
    saveListing,
    removeSavedListing,
    recordPurchase
  };
}

export default useMarketplaceInventory;
