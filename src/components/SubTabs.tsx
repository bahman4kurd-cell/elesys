import React, { useState } from 'react';
import { SubTab } from '../types';
import { MapPin, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { t } from '../i18n';

interface SubTabsProps {
  subTabs: SubTab[];
  activeSubTabId: string;
  onSelectSubTab: (subTabId: string) => void;
  onAddSubTab: (name: string) => void;
  onEditSubTab: (subTabId: string, newName: string) => void;
  onDeleteSubTab: (subTabId: string) => void;
}

export const SubTabs: React.FC<SubTabsProps> = ({
  subTabs,
  activeSubTabId,
  onSelectSubTab,
  onAddSubTab,
  onEditSubTab,
  onDeleteSubTab,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubTabName, setNewSubTabName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTabName.trim()) return;
    onAddSubTab(newSubTabName.trim());
    setNewSubTabName('');
    setShowAddModal(false);
  };

  const startEdit = (st: SubTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(st.id);
    setEditNameText(st.name);
  };

  const saveEdit = (stId: string) => {
    if (editNameText.trim()) {
      onEditSubTab(stId, editNameText.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (stId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی سەب تابی "${name}"؟`)) {
      onDeleteSubTab(stId);
    }
  };

  return (
    <div className="bg-[#1E293B] border-b border-slate-700/80 px-4 sm:px-6 py-1.5 no-print">
      <div className="w-full flex items-center justify-between gap-3 overflow-x-auto pb-0.5 scrollbar-thin">
        
        {/* Sub-tabs List */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 pl-1 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>{t('districtsLabel')}</span>
          </span>

          {subTabs.map((st) => {
            const isActive = activeSubTabId === st.id;
            const isEditing = editingId === st.id;

            if (isEditing) {
              return (
                <div
                  key={st.id}
                  className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editNameText}
                    onChange={(e) => setEditNameText(e.target.value)}
                    className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(st.id)} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-rose-400 hover:text-rose-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={st.id}
                onClick={() => onSelectSubTab(st.id)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600/25 text-blue-300 border border-blue-500/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <span>{st.name}</span>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                  <button
                    onClick={(e) => startEdit(st, e)}
                    title="دەستکاری ناو"
                    className="p-0.5 text-slate-400 hover:text-blue-300"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  {subTabs.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(st.id, st.name, e)}
                      title="سڕینەوە"
                      className="p-0.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        </div>

        {/* Add Sub-tab Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>{t('addSubTab')}</span>
        </button>

      </div>

      {/* Modal for adding new SubTab */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>زیادکردنی سەب تاب / ناوچەی هەڵبژاردن</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ناوی سەب تاب / ناوچە</label>
                <input
                  type="text"
                  value={newSubTabName}
                  onChange={(e) => setNewSubTabName(e.target.value)}
                  placeholder="وەک: ناوچەی هەولێر یان بنکەی ژمارە ١"
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer shadow-md"
                >
                  زیادکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
