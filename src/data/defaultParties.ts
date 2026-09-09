import { Party } from '../types';

export const DEFAULT_PARTIES: Party[] = [
  {
    id: 'pdk',
    name: 'پارتی دیموکراتی کوردستان',
    color: '#EAB308', // Yellow (زەرد)
    textColor: '#1E293B',
  },
  {
    id: 'ynk',
    name: 'یەکێتی',
    color: '#16A34A', // Green (سەوز)
    textColor: '#FFFFFF',
  },
  {
    id: 'newey-nwe',
    name: 'نەوەی نوێ',
    color: '#F97316', // Orange (پڕتەقاڵی)
    textColor: '#FFFFFF',
  },
  {
    id: 'yekgirtu',
    name: 'یەکگرتوی ئیسلامی',
    color: '#854D0E', // Brown (قاوەیی)
    textColor: '#FFFFFF',
  },
  {
    id: 'komal',
    name: 'کۆمەڵی دادگەری',
    color: '#C2410C', // Dark Orange (پڕتەقاڵی تۆخ)
    textColor: '#FFFFFF',
  },
  {
    id: 'gorran',
    name: 'بزوتنەوەی گۆڕان',
    color: '#3730A3', // Indigo / Navy (نیللی)
    textColor: '#FFFFFF',
  },
  {
    id: 'socialist',
    name: 'سۆسیالیست',
    color: '#38BDF8', // Light Blue (شینی کاڵ)
    textColor: '#0F172A',
  },
  {
    id: 'shiyuie',
    name: 'شیویعی',
    color: '#EF4444', // Red (سور)
    textColor: '#FFFFFF',
  },
  {
    id: 'bizutnewey-islami',
    name: 'بزوتنەوەی ئیسلامی',
    color: '#F8FAFC', // White (سپی)
    textColor: '#0F172A',
  },
  {
    id: 'hawpeymani',
    name: 'هاوپەیمانی',
    color: '#84CC16', // Light Green (سەوزی کاڵ)
    textColor: '#0F172A',
  },
  {
    id: 'serbexo',
    name: 'دەنگی سەربەخۆ',
    color: '#A855F7', // Purple (مۆر)
    textColor: '#FFFFFF',
  },
];

export const getPartyById = (id: string, customParties: Party[] = []): Party | undefined => {
  return [...DEFAULT_PARTIES, ...customParties].find((p) => p.id === id);
};
