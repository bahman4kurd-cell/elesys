import { AppLanguage } from './types';

const translations: Record<string, Record<AppLanguage, string>> = {
  'خولەکان:': { ckb: 'خولەکان:', kmr: 'Dema:', ar: 'الجولات:', en: 'Rounds:' },
  'ناوچەکان:': { ckb: 'ناوچەکان:', kmr: 'Herêm:', ar: 'الدوائر:', en: 'Districts:' },
  'کۆی دەنگ:': { ckb: 'کۆی دەنگ:', kmr: 'Dengên giştî:', ar: 'إجمالي الأصوات:', en: 'Total votes:' },
  'ناوچەکان (سەب تاب):': { ckb: 'ناوچەکان (سەب تاب):', kmr: 'Herêm (babetab):', ar: 'الدوائر (تبويبات):', en: 'Districts (sub-tabs):' },
  'سنووری لقی چوار': { ckb: 'سنووری لقی چوار', kmr: 'Sînorê Lîqê Çar', ar: 'حدود الفرع الرابع', en: 'Branch Four Boundary' },
  '+ زیادکردنی خول': { ckb: '+ زیادکردنی خول', kmr: '+ Zêdekirina demê', ar: '+ Add round', en: '+ Add round' },
  '+ زیادکردنی سەب تاب': { ckb: '+ زیادکردنی سەب تاب', kmr: '+ Zêdekirina babetabê', ar: '+ Add sub-tab', en: '+ Add sub-tab' },
  'ڕێکخستنەکان': { ckb: 'ڕێکخستنەکان', kmr: 'Mîheng', ar: 'الإعدادات', en: 'Settings' },
  'چوونەدەرەوە': { ckb: 'چوونەدەرەوە', kmr: 'Derketin', ar: 'تسجيل الخروج', en: 'Log out' },
  'ناوی بەکارهێنەر': { ckb: 'ناوی بەکارهێنەر', kmr: 'Navê bikarhêner', ar: 'اسم المستخدم', en: 'Username' },
  'وشەی نهێنی': { ckb: 'وشەی نهێنی', kmr: 'Şîfre', ar: 'كلمة المرور', en: 'Password' },
  'چوونەژوورەوە': { ckb: 'چوونەژوورەوە', kmr: 'Têketin', ar: 'تسجيل الدخول', en: 'Log in' },
};

export function applyPageLanguage(language: AppLanguage): () => void {
  // Source strings are Kurdish by default; no runtime translation pass is needed.
  if (language === 'ckb') {
    return () => {};
  }

  let translating = false;
  const translate = () => {
    if (translating) return;
    translating = true;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node as Text);
    nodes.forEach((textNode) => {
      const original = textNode.nodeValue || '';
      const value = original.trim();
      const entry = translations[value] || Object.values(translations).find((item) => Object.values(item).includes(value));
      const translated = entry?.[language];
      if (translated && value === original) textNode.nodeValue = translated;
    });
    translating = false;
  };
  translate();
  let rafId: number | null = null;
  const scheduleTranslate = () => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      translate();
    });
  };

  const observer = new MutationObserver(scheduleTranslate);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
