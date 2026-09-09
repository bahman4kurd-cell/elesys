import { AppLanguage } from './types';

export const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: 'ckb', label: 'کوردی سۆرانی' },
  { value: 'kmr', label: 'کوردی کرمانجی' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const translations: Record<string, Record<AppLanguage, string>> = {
  systemTitle: {
    ckb: 'سیستەمی شیکاری ئەنجامەکانی هەڵبژاردن',
    kmr: 'Sîstema analîza encamên hilbijartinê',
    ar: 'نظام تحليل نتائج الانتخابات',
    en: 'Election Results Analysis System',
  },
  systemSubtitle: {
    ckb: 'پەرلەمانی کوردستان، ئەنجومەنی نوێنەران و سنووری لقی چوار',
    kmr: 'Parlamentê Kurdistanê, Meclîsa Nûneran û Sînorê Lîqê Çar',
    ar: 'برلمان كردستان ومجلس النواب وحدود الفرع الرابع',
    en: 'Kurdistan Parliament, Council of Representatives and Branch Four Boundary',
  },
  rounds: { ckb: 'خولەکان:', kmr: 'Dema:', ar: 'الجولات:', en: 'Rounds:' },
  districts: { ckb: 'ناوچەکان:', kmr: 'Herêm:', ar: 'الدوائر:', en: 'Districts:' },
  totalVotes: { ckb: 'کۆی دەنگ:', kmr: 'Dengên giştî:', ar: 'إجمالي الأصوات:', en: 'Total votes:' },
  dashboard: { ckb: 'داشبۆردی گشتی چارتەکان', kmr: 'Panela giştî ya diagraman', ar: 'لوحة الرسوم العامة', en: 'General charts dashboard' },
  roundLabel: { ckb: 'خولەکان:', kmr: 'Dema:', ar: 'الجولات:', en: 'Rounds:' },
  districtsLabel: { ckb: 'ناوچەکان (سەب تاب):', kmr: 'Herêm (babetab):', ar: 'الدوائر (تبويبات):', en: 'Districts (sub-tabs):' },
  branchFour: { ckb: 'سنووری لقی چوار', kmr: 'Sînorê Lîqê Çar', ar: 'حدود الفرع الرابع', en: 'Branch Four Boundary' },
  addRound: { ckb: '+ زیادکردنی خول', kmr: '+ Zêdekirina demê', ar: '+ Add round', en: '+ Add round' },
  addSubTab: { ckb: '+ زیادکردنی سەب تاب', kmr: '+ Zêdekirina babetabê', ar: '+ إضافة تبويب', en: '+ Add sub-tab' },
  settings: { ckb: 'ڕێکخستنەکان', kmr: 'Mîheng', ar: 'الإعدادات', en: 'Settings' },
  logout: { ckb: 'چوونەدەرەوە', kmr: 'Derketin', ar: 'تسجيل الخروج', en: 'Log out' },
  languageTitle: { ckb: 'زمانەکانی سیستەم', kmr: 'Zimanên sîstemê', ar: 'لغات النظام', en: 'System languages' },
  languageHelp: { ckb: 'زمانێک هەڵبژێرە بۆ ڕووکاری سیستەم', kmr: 'Ji bo rûbera sîstemê zimanekî hilbijêre', ar: 'اختر لغة واجهة النظام', en: 'Choose the interface language' },
  loginTitle: { ckb: 'سیستەمی ئەنجامی هەڵبژاردنەکان', kmr: 'Sîstema encamên hilbijartinê', ar: 'نظام نتائج الانتخابات', en: 'Election Results System' },
  username: { ckb: 'ناوی بەکارهێنەر', kmr: 'Navê bikarhêner', ar: 'اسم المستخدم', en: 'Username' },
  password: { ckb: 'وشەی نهێنی', kmr: 'Şîfre', ar: 'كلمة المرور', en: 'Password' },
  login: { ckb: 'چوونەژوورەوە', kmr: 'Têketin', ar: 'تسجيل الدخول', en: 'Log in' },
};

export function getAppLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem('kurd_election_system_db_v1');
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed?.settings?.language || 'ckb';
  } catch {
    return 'ckb';
  }
}

export function t(key: keyof typeof translations, language = getAppLanguage()): string {
  const row = translations[key];
  if (!row) return key;
  return row[language] ?? row.ckb ?? row.en ?? key;
}
