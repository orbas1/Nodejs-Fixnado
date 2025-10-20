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
  'creationStudio.errors.loadFailure': 'تعذر تحميل مخططات الإنشاء. أعد المحاولة أو تواصل مع الدعم.',

  'errors.unexpected.title': 'حادث حرج',
  'errors.unexpected.headline': 'حدث خطأ أثناء التحميل.',
  'errors.unexpected.inlineHeadline': 'تعذّر تحميل هذا القسم',
  'errors.unexpected.inlineDescription': 'حدّث الصفحة أو جرّب لاحقاً؛ فريقنا يعمل على تحليل المشكلة الآن.',
  'errors.unexpected.description': 'حدث خطأ أثناء تحميل مساحة العمل. قمنا بتسجيل الحادث وإبلاغ فريق الهندسة.',
  'errors.unexpected.reference': 'معرّف المرجع',
  'errors.unexpected.actions.retry': 'إعادة تحميل Fixnado',
  'errors.unexpected.actions.contactSupport': 'مراسلة الدعم',
  'errors.unexpected.actions.statusPage': 'عرض صفحة الحالة',
  'errors.unexpected.actions.copyDetails': 'نسخ بيانات التشخيص',
  'errors.unexpected.actions.copied': 'تم نسخ بيانات التشخيص',
  'errors.unexpected.detailsToggle': 'عرض التفاصيل التقنية',

  'notFound.code': '404 — الصفحة غير موجودة',
  'notFound.title': 'لم نتمكن من العثور على هذه الصفحة.',
  'notFound.description': 'العنوان {path} غير متاح أو تم نقله.',
  'notFound.reference': 'رمز التتبع',
  'notFound.actions.dashboard': 'فتح لوحات التحكم',
  'notFound.actions.supportCentre': 'الانتقال إلى مركز الاتصالات',
  'notFound.actions.home': 'العودة إلى الرئيسية',
  'notFound.actions.explore': 'استكشاف الخدمات',
  'notFound.secondary.title': 'هل تحتاج إلى شيء آخر؟',
  'notFound.secondary.description': 'اطّلع على المستندات القانونية أو راسل {email} للحصول على المساعدة.',
  'notFound.secondary.privacy': 'سياسة الخصوصية',
  'notFound.secondary.terms': 'شروط الخدمة',
  'notFound.secondary.contact': 'الاتصال بالدعم',
  'notFound.auditTrail.title': 'ما تم تسجيله',
  'notFound.auditTrail.copy': 'قمنا بتسجيل هذا الخطأ في سجل التدقيق. شارك رمز التتبع مع الدعم لتسريع المعالجة.'
};

export const arSA = {
  metadata: {
    ...enGB.metadata,
    id: 'ar-SA',
    name: 'العربية (السعودية)',
    language: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    htmlLang: 'ar',
    direction: 'rtl',
    currency: 'SAR',
    numberLocale: 'ar-SA',
    dateLocale: 'ar-SA'
  },
  messages
};
