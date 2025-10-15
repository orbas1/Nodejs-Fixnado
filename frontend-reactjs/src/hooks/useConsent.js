import { useConsentContext } from '../providers/ConsentProvider.jsx';

export function useConsent() {
  return useConsentContext();
}

export default useConsent;
