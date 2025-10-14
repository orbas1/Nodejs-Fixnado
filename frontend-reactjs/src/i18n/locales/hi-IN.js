import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'मुखपृष्ठ',
  'nav.solutions': 'समाधान',
  'nav.tools': 'उपकरण',
  'nav.industries': 'उद्योग',
  'nav.platform': 'प्लेटफ़ॉर्म',
  'nav.materials': 'सामग्री',
  'nav.resources': 'संसाधन',
  'nav.dashboards': 'डैशबोर्ड',
  'nav.providerConsole': 'प्रदाता कंसोल',
  'nav.providerStorefront': 'स्टोरफ़्रंट और सूचनाएँ',
  'nav.enterpriseAnalytics': 'उद्यम विश्लेषण',
  'nav.businessFronts': 'व्यवसाय फ्रंट',
  'nav.geoMatching': 'भौगोलिक मिलान',
  'nav.communications': 'संचार',
  'nav.login': 'लॉगिन',
  'nav.register': 'पंजीकरण',
  'nav.getStarted': 'शुरू करें',
  'nav.languageSelector': 'भाषा'
};

export const hiIN = {
  metadata: {
    ...enGB.metadata,
    id: 'hi-IN',
    name: 'हिन्दी (भारत)',
    htmlLang: 'hi-IN',
    direction: 'ltr',
    currency: 'INR',
    numberLocale: 'hi-IN',
    dateLocale: 'hi-IN'
  },
  messages
};
