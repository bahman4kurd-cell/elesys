import React from 'react';

interface LegendPayload {
  value?: string;
  color?: string;
  payload?: { name?: string; color?: string };
}

interface ChartLegendProps {
  payload?: LegendPayload[];
}

function detectTheme(): 'dark' | 'gray' | 'light' | 'government' {
  if (typeof document === 'undefined') return 'government';
  const className = document.body.className || '';
  if (className.includes('theme-light')) return 'light';
  if (className.includes('theme-gray')) return 'gray';
  if (className.includes('theme-dark')) return 'dark';
  return 'government';
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ payload = [] }) => {
  const theme = detectTheme();
  const textClass = theme === 'light' || theme === 'government' ? 'text-slate-700' : 'text-slate-200';

  return (
    <div className="w-full px-2 pt-3" dir="rtl">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(145px,1fr))] gap-x-4 gap-y-2 text-xs">
        {payload.map((entry, index) => {
          const label = entry.value || entry.payload?.name || '';
          const color = entry.color || entry.payload?.color || '#94A3B8';
          return (
            <div key={`${label}-${index}`} className="min-w-0 flex items-center gap-2 leading-5">
              <span className="w-3 h-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span
                className={`min-w-0 truncate font-bold ${textClass}`}
                title={label}
                style={{
                  textShadow: theme === 'light' || theme === 'government'
                    ? '0 1px 0 rgba(255,255,255,0.85), 0 0 1px rgba(15,23,42,0.35)'
                    : '0 1px 0 rgba(2,6,23,0.9), 0 0 1px rgba(255,255,255,0.2)',
                  WebkitTextStroke: theme === 'light' || theme === 'government' ? '0.5px rgba(15,23,42,0.35)' : '0.5px rgba(255,255,255,0.2)',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
