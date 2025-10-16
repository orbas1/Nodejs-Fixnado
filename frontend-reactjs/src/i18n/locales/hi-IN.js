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
  'nav.languageSelector': 'भाषा',
  'nav.creationStudio': 'क्रिएशन स्टूडियो',
  'nav.creationStudioDescription': 'अनुपालन ऑटोमेशन के साथ सेवाएँ, स्टोरफ्रंट और अभियान तैयार करें।',
  'roles.provider': 'प्रोवाइडर संचालन',
  'roles.enterprise': 'एंटरप्राइज संचालन',
  'roles.admin': 'प्लेटफ़ॉर्म प्रशासन',
  'creationStudio.guard.restricted': 'सीमित क्षेत्र',
  'creationStudio.guard.title': 'आपकी भूमिका को क्रिएशन अनुमति चाहिए',
  'creationStudio.guard.body': 'क्रिएशन स्टूडियो केवल {roles} के लिए उपलब्ध है। अपने Fixnado प्रशासक से पहुँच का अनुरोध करें।',
  'creationStudio.guard.help': 'तुरंत एक्सेस चाहिए? {email} पर लिखें और हमारी ऑपरेशंस टीम आपको सक्षम करेगी।',
  'creationStudio.errors.loadFailure': 'क्रिएशन ब्लूप्रिंट लोड नहीं हो पाए। दोबारा प्रयास करें या सहायता से संपर्क करें।'
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
