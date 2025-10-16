import { enGB } from './en-GB.js';

const messages = {
  ...enGB.messages,
  'nav.home': 'الرئيسية',
  'nav.solutions': 'الحلول',
  'nav.tools': 'الأدوات',
  'nav.industries': 'القطاعات',
  'nav.platform': 'المنصة',
  'nav.materials': 'المواد',
  'nav.resources': 'الموارد',
  'nav.dashboards': 'لوحات التحكم',
  'nav.providerConsole': 'وحدة مزود الخدمة',
  'nav.providerStorefront': 'الواجهة والعروض',
  'nav.enterpriseAnalytics': 'تحليلات المؤسسة',
  'nav.businessFronts': 'واجهات الأعمال',
  'nav.geoMatching': 'المطابقة الجغرافية',
  'nav.communications': 'الاتصالات',
  'nav.login': 'تسجيل الدخول',
  'nav.register': 'التسجيل',
  'nav.getStarted': 'ابدأ الآن',
  'nav.languageSelector': 'اللغة',
  'nav.creationStudio': 'استوديو الإنشاء',
  'nav.creationStudioDescription': 'أنشئ الخدمات والواجهات والحملات مع أتمتة الامتثال.',
  'roles.provider': 'تشغيل المزود',
  'roles.enterprise': 'تشغيل المؤسسة',
  'roles.admin': 'إدارة المنصة',
  'creationStudio.guard.restricted': 'منطقة مقيدة',
  'creationStudio.guard.title': 'دورك يحتاج إلى صلاحيات إنشاء',
  'creationStudio.guard.body': 'استوديو الإنشاء متاح فقط لـ {roles}. اطلب التمكين من مسؤول Fixnado.',
  'creationStudio.guard.help': 'تحتاج وصولاً سريعاً؟ راسل {email} وسيتولى فريق العمليات تفعيلك.',
  'creationStudio.errors.loadFailure': 'تعذر تحميل مخططات الإنشاء. أعد المحاولة أو تواصل مع الدعم.'
};

export const arSA = {
  metadata: {
    ...enGB.metadata,
    id: 'ar-SA',
    name: 'العربية (السعودية)',
    htmlLang: 'ar',
    direction: 'rtl',
    currency: 'SAR',
    numberLocale: 'ar-SA',
    dateLocale: 'ar-SA'
  },
  messages
};
