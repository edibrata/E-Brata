import { useState } from 'react';
import { useAppStore } from '@/store';
import { DataProjek, DimensiProjek } from '@/types';
import { 
  DAFTAR_8_DIMENSI, 
  BANK_SUBDIMENSI_SD, 
  DimensiKokurikulerNama 
} from '@/data/kokurikuler2025';
import { Plus, Trash2, ChevronDown, Layers } from 'lucide-react';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function DataProjekView() {
  const { state, updateState } = useAppStore();
  const { projek, dimensiProjek } = state;
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleAddProjek = () => {
    const id = 'koku-' + Date.now();
    const newProjek: DataProjek = {
      id,
      tema: '', // Default kosong, dipandu oleh placeholder
      deskripsi: ''
    };
    
    // Default 1 blok dimensi baru dalam keadaan bersih (belum memilih dimensi)
    const defaultDim: DimensiProjek = {
      id: 'dim-' + Date.now(),
      projekId: id,
      nama: '',
      subdimensi: []
    };

    updateState('projek', [...projek, newProjek]);
    updateState('dimensiProjek', [...dimensiProjek, defaultDim]);
  };

  const handleDeleteProjek = (id: string, tema: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kegiatan Kokurikuler',
      message: `Apakah Anda yakin ingin menghapus kegiatan "${tema || 'Kegiatan Baru'}" beserta seluruh dimensi dan subdimensinya? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        updateState('projek', projek.filter(p => p.id !== id));
        updateState('dimensiProjek', dimensiProjek.filter(d => d.projekId !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateProjekTema = (id: string, value: string) => {
    updateState('projek', projek.map(p => p.id === id ? { ...p, tema: value } : p));
  };

  const handleAddDimensi = (projekId: string) => {
    const newDim: DimensiProjek = {
      id: 'dim-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      projekId,
      nama: '', // Default belum memilih dimensi
      subdimensi: []
    };
    updateState('dimensiProjek', [...dimensiProjek, newDim]);
  };

  const handleDeleteDimensi = (id: string, nama: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Dimensi Fokus',
      message: `Apakah Anda yakin ingin menghapus ${nama ? `dimensi "${nama}"` : 'blok dimensi ini'}?`,
      onConfirm: () => {
        updateState('dimensiProjek', dimensiProjek.filter(d => d.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleChangeDimensiName = (dimId: string, newDimName: string) => {
    updateState('dimensiProjek', dimensiProjek.map(d => {
      if (d.id !== dimId) return d;
      return {
        ...d,
        nama: newDimName,
        subdimensi: [] // Bersih, tidak langsung mencentang otomatis
      };
    }));
  };

  const handleToggleSubdimensi = (dimId: string, subdimName: string) => {
    updateState('dimensiProjek', dimensiProjek.map(d => {
      if (d.id !== dimId) return d;
      const current = d.subdimensi || [];
      const updated = current.includes(subdimName)
        ? current.filter(s => s !== subdimName)
        : [...current, subdimName];
      return { ...d, subdimensi: updated };
    }));
  };

  const toggleCollapse = (id: string) => {
    setCollapsedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Modal Konfirmasi Internal (Aman di iFrame) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">{confirmModal.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 p-3 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Compact Header */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
            <Layers size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Perencanaan Kokurikuler</h1>
          </div>
        </div>

        <button
          onClick={handleAddProjek}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Daftar Kegiatan Kokurikuler */}
      {projek.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers size={24} />
          </div>
          <h2 className="text-sm font-bold text-slate-700">Belum ada kegiatan kokurikuler yang direncanakan</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Klik tombol &quot;Tambah Kegiatan&quot; di atas untuk merencanakan kegiatan baru beserta dimensi sasarannya.
          </p>
          <button
            onClick={handleAddProjek}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> Tambah Kegiatan Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projek.map((p, idx) => {
            const dims = dimensiProjek.filter(d => d.projekId === p.id);
            const totalSubdims = dims.reduce((acc, d) => acc + (d.subdimensi?.length || 0), 0);
            const isCollapsed = !!collapsedCards[p.id];

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Kartu Kegiatan (Persis Pola HTML) */}
                <div className="bg-slate-50/90 p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-white text-sky-800 border border-slate-200 shrink-0">
                      Kegiatan {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={p.tema}
                      onChange={(e) => handleUpdateProjekTema(p.id, e.target.value)}
                      className="w-full text-base font-bold text-slate-800 bg-transparent focus:bg-white focus:ring-1 focus:ring-sky-500 border border-transparent focus:border-sky-300 rounded-md px-2 py-1 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Nama Kegiatan Baru..."
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full hidden sm:inline">
                      {dims.length} Dimensi • {totalSubdims} Subdimensi
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProjek(p.id, p.tema)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus kegiatan ini"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(p.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      title={isCollapsed ? 'Buka rincian kegiatan' : 'Tutup rincian kegiatan'}
                    >
                      <ChevronDown size={17} className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                </div>

                {/* Body Kartu: Blok Dimensi & Subdimensi */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    {dims.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                        Belum ada dimensi fokus untuk kegiatan ini. Klik &quot;+ Tambah Dimensi Fokus&quot; di bawah.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dims.map((d) => {
                          const currentDimName = d.nama as DimensiKokurikulerNama;
                          const availableSubdims = currentDimName ? (BANK_SUBDIMENSI_SD[currentDimName] || []) : [];
                          const selectedSubdims = d.subdimensi || [];

                          return (
                            <div 
                              key={d.id} 
                              className="p-4 border border-slate-200 rounded-lg bg-slate-50/40 space-y-3"
                            >
                              {/* Header Dimensi Block */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <label className="text-xs font-bold text-slate-600 shrink-0">
                                    Dimensi Fokus:
                                  </label>
                                  <select
                                    value={d.nama || ''}
                                    onChange={(e) => handleChangeDimensiName(d.id, e.target.value)}
                                    className="w-full sm:w-auto flex-1 max-w-md bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                                  >
                                    <option value="">-- Pilih Dimensi --</option>
                                    {DAFTAR_8_DIMENSI.map(dim => (
                                      <option key={dim} value={dim}>{dim}</option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteDimensi(d.id, d.nama)}
                                  className="text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors cursor-pointer"
                                  title="Hapus dimensi ini"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {/* Checklist Subdimensi atau Petunjuk Pemilihan */}
                              {!d.nama ? (
                                <div className="p-3 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                  Silakan pilih Dimensi terlebih dahulu untuk memilih Subdimensi fokus.
                                </div>
                              ) : (
                                <div className="p-3 bg-white border border-slate-200/80 rounded-lg space-y-2.5">
                                  <p className="text-xs text-slate-500 font-semibold">
                                    Pilih satu atau lebih Subdimensi fokus:
                                  </p>

                                  <div className="space-y-2.5">
                                    {availableSubdims.map((sub) => {
                                      const isChecked = selectedSubdims.includes(sub.name);

                                      return (
                                        <div 
                                          key={sub.name}
                                          className={`p-3 border rounded-lg transition-all ${
                                            isChecked 
                                              ? 'border-sky-300 bg-sky-50/20' 
                                              : 'border-slate-200 bg-white hover:bg-slate-50'
                                          }`}
                                        >
                                          <label className="flex items-start text-xs font-bold text-slate-800 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => handleToggleSubdimensi(d.id, sub.name)}
                                              className="h-4 w-4 mt-0.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500 shrink-0 cursor-pointer"
                                            />
                                            <span className="ml-2.5 flex-1">{sub.name}</span>
                                          </label>

                                          {/* Uraian Capaian: Otomatis tampil rapi saat subdimensi dipilih (persis perilaku HTML) */}
                                          {isChecked && (
                                            <div className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed pl-2.5 border-l-2 border-sky-300">
                                              <div className="font-bold text-slate-700 mb-1">Uraian Capaian:</div>
                                              <div className="text-amber-800 border-l-2 border-amber-400 pl-2 bg-amber-50/40 py-0.5 rounded-r">
                                                <strong>Berkembang:</strong> {sub.berk}
                                              </div>
                                              <div className="text-emerald-800 border-l-2 border-emerald-400 pl-2 bg-emerald-50/40 py-0.5 rounded-r">
                                                <strong>Cakap:</strong> {sub.cakap}
                                              </div>
                                              <div className="text-sky-800 border-l-2 border-sky-400 pl-2 bg-sky-50/40 py-0.5 rounded-r">
                                                <strong>Mahir:</strong> {sub.mahir}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tombol Tambah Dimensi Fokus */}
                    <button
                      type="button"
                      onClick={() => handleAddDimensi(p.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Tambah Dimensi Fokus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
