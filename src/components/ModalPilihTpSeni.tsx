import React, { useState, useMemo } from 'react';
import { defaultTpSeniRupa } from '../data/defaultTpSeniRupa';
import { defaultTpSeniMusik } from '../data/defaultTpSeniMusik';
import { defaultTpSeniTari } from '../data/defaultTpSeniTari';
import { defaultTpSeniTeater } from '../data/defaultTpSeniTeater';
import { X, Sparkles, Palette, Music, Check, CheckSquare, Square, Search, Layers } from 'lucide-react';

export interface SelectedArtTp {
  kode: string;
  deskripsi: string;
  branchId: 'rupa' | 'musik' | 'tari' | 'teater';
  branchLabel: string;
  branchTag: string;
}

interface ModalPilihTpSeniProps {
  isOpen: boolean;
  onClose: () => void;
  mapelNama: string;
  mapelKode: string;
  kelas: string;
  semester: string;
  existingTpCount: number;
  onApply: (selectedTps: { kode: string; deskripsi: string }[], mode: 'replace' | 'append') => void;
}

export const ModalPilihTpSeni: React.FC<ModalPilihTpSeniProps> = ({
  isOpen,
  onClose,
  mapelNama,
  mapelKode,
  kelas,
  semester,
  existingTpCount,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState<'rupa' | 'musik' | 'tari' | 'teater'>('rupa');
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedArtTp>>({});
  const [includeTag, setIncludeTag] = useState<boolean>(true);
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>(existingTpCount > 0 ? 'append' : 'replace');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const branches = useMemo(() => [
    { id: 'rupa' as const, label: 'Seni Rupa', tag: 'Rupa', data: defaultTpSeniRupa, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'musik' as const, label: 'Seni Musik', tag: 'Musik', data: defaultTpSeniMusik, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'tari' as const, label: 'Seni Tari', tag: 'Tari', data: defaultTpSeniTari, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'teater' as const, label: 'Seni Teater', tag: 'Teater', data: defaultTpSeniTeater, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  ], []);

  // Normalize semester
  const semKey = (String(semester).includes('2') || String(semester).toLowerCase().includes('genap')) ? '2' : '1';

  // Get TP items for current active branch
  const currentBranch = branches.find(b => b.id === activeTab)!;
  const rawBranchItems = (currentBranch.data[kelas] && currentBranch.data[kelas][semKey]) || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return rawBranchItems;
    const q = searchQuery.toLowerCase();
    return rawBranchItems.filter(item => 
      item.kode.toLowerCase().includes(q) || 
      item.deskripsi.toLowerCase().includes(q)
    );
  }, [rawBranchItems, searchQuery]);

  // Count selections per branch
  const selectionCounts = useMemo(() => {
    const counts: Record<string, number> = { rupa: 0, musik: 0, tari: 0, teater: 0 };
    (Object.values(selectedMap) as SelectedArtTp[]).forEach(item => {
      counts[item.branchId] = (counts[item.branchId] || 0) + 1;
    });
    return counts;
  }, [selectedMap]);

  const totalSelectedCount = Object.keys(selectedMap).length;

  const toggleItem = (item: { kode: string; deskripsi: string }, branch: typeof currentBranch) => {
    const key = `${branch.id}_${item.kode}`;
    setSelectedMap(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          kode: item.kode,
          deskripsi: item.deskripsi,
          branchId: branch.id,
          branchLabel: branch.label,
          branchTag: branch.tag
        };
      }
      return next;
    });
  };

  const handleSelectAllInBranch = () => {
    setSelectedMap(prev => {
      const next = { ...prev };
      filteredItems.forEach(item => {
        const key = `${currentBranch.id}_${item.kode}`;
        next[key] = {
          kode: item.kode,
          deskripsi: item.deskripsi,
          branchId: currentBranch.id,
          branchLabel: currentBranch.label,
          branchTag: currentBranch.tag
        };
      });
      return next;
    });
  };

  const handleDeselectAllInBranch = () => {
    setSelectedMap(prev => {
      const next = { ...prev };
      filteredItems.forEach(item => {
        const key = `${currentBranch.id}_${item.kode}`;
        delete next[key];
      });
      return next;
    });
  };

  const handleApply = () => {
    const items: SelectedArtTp[] = Object.values(selectedMap);
    if (items.length === 0) return;

    const baseOffset = applyMode === 'append' ? existingTpCount : 0;
    const formattedTps = items.map((item, idx) => {
      const tpNumber = baseOffset + idx + 1;
      const cleanKode = `TP.${mapelKode || 'SDB'}.${tpNumber}`;
      const finalDeskripsi = includeTag 
        ? `[${item.branchTag}] ${item.deskripsi.replace(/^\[.*?\]\s*/, '')}`
        : item.deskripsi.replace(/^\[.*?\]\s*/, '');

      return {
        kode: cleanKode,
        deskripsi: finalDeskripsi
      };
    });

    onApply(formattedTps, applyMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Pilih TP Seni dan Budaya
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Opsi Multi-Seni
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapel: <span className="font-semibold text-slate-700">{mapelNama}</span> • Kelas <span className="font-semibold text-slate-700">{kelas}</span> • Semester <span className="font-semibold text-slate-700">{semKey}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="px-5 pt-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {branches.map(branch => {
              const isSelected = activeTab === branch.id;
              const count = selectionCounts[branch.id];
              return (
                <button
                  key={branch.id}
                  onClick={() => {
                    setActiveTab(branch.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span>{branch.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH & BATCH ACTIONS */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={`Cari TP ${currentBranch.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllInBranch}
              disabled={filteredItems.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 font-semibold text-[11px] transition shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
              Pilih Semua ({currentBranch.tag})
            </button>
            <button
              onClick={handleDeselectAllInBranch}
              disabled={selectionCounts[currentBranch.id] === 0}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-600 font-semibold text-[11px] transition shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              Batal Pilih ({currentBranch.tag})
            </button>
          </div>
        </div>

        {/* CONTENT LIST */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-50/30">
          {rawBranchItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Belum ada TP default untuk {currentBranch.label} di Kelas {kelas} Semester {semKey}.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-xs">Tidak ada TP yang cocok dengan kata kunci &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const key = `${currentBranch.id}_${item.kode}`;
              const isChecked = !!selectedMap[key];

              return (
                <div
                  key={key}
                  onClick={() => toggleItem(item, currentBranch)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked 
                      ? 'bg-indigo-50/60 border-indigo-300 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                        Kode: {item.kode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentBranch.color}`}>
                        {currentBranch.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Tag toggle */}
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={includeTag}
                onChange={(e) => setIncludeTag(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs">
                Sertakan tanda cabang di deskripsi (contoh: <code className="font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">[Rupa]</code>, <code className="font-semibold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">[Musik]</code>)
              </span>
            </label>

            {/* Mode selection if existing TPs exist */}
            {existingTpCount > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setApplyMode('append')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    applyMode === 'append' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  + Tambahkan ke TP yang ada ({existingTpCount})
                </button>
                <button
                  type="button"
                  onClick={() => setApplyMode('replace')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    applyMode === 'replace' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Timpa/Ganti Semua TP Lama
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Total terpilih: <span className="font-bold text-indigo-600 text-sm">{totalSelectedCount}</span> TP
              {totalSelectedCount > 0 && (
                <span className="ml-2 text-slate-400">
                  ({(Object.entries(selectionCounts) as [string, number][]).filter(([, c]) => c > 0).map(([b, c]) => `${branches.find(x => x.id === b)?.tag}: ${c}`).join(', ')})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={totalSelectedCount === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-sm shadow-indigo-100 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Terapkan {totalSelectedCount} TP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
