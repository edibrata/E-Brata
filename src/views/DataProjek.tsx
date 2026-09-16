import { useAppStore } from '@/store';
import { DataProjek, DimensiProjek } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export default function DataProjekView() {
  const { state, updateState } = useAppStore();
  const { projek, dimensiProjek } = state;

  const handleAddProjek = () => {
    const p: DataProjek = {
      id: 'p' + Date.now(),
      tema: 'Tema Baru...',
      deskripsi: 'Deskripsi Projek...'
    };
    updateState('projek', [...projek, p]);
  };

  const handleDeleteProjek = (id: string) => {
    if (confirm('Yakin ingin menghapus projek ini beserta dimensinya?')) {
      updateState('projek', projek.filter(p => p.id !== id));
      updateState('dimensiProjek', dimensiProjek.filter(d => d.projekId !== id));
    }
  };

  const handleUpdateProjek = (id: string, field: keyof DataProjek, value: string) => {
    updateState('projek', projek.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddDimensi = (projekId: string) => {
    const d: DimensiProjek = {
      id: 'd' + Date.now(),
      projekId,
      nama: 'Dimensi Baru (misal: Bergotong Royong)'
    };
    updateState('dimensiProjek', [...dimensiProjek, d]);
  };

  const handleDeleteDimensi = (id: string) => {
    if (confirm('Yakin ingin menghapus dimensi ini?')) {
      updateState('dimensiProjek', dimensiProjek.filter(d => d.id !== id));
    }
  };

  const handleUpdateDimensi = (id: string, value: string) => {
    updateState('dimensiProjek', dimensiProjek.map(d => d.id === id ? { ...d, nama: value } : d));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Data Projek</h2>
        <button onClick={handleAddProjek} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors">
          <Plus size={16} /> Tambah Projek
        </button>
      </div>

      <div className="space-y-6">
        {projek.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Belum ada projek. Silakan tambah objek baru.</p>
        ) : null}
        
        {projek.map((p, idx) => {
          const dims = dimensiProjek.filter(d => d.projekId === p.id);
          return (
            <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-1 text-sm shadow-sm">Projek {idx + 1}</span>
                    <input type="text" value={p.tema} onChange={(e) => handleUpdateProjek(p.id, 'tema', e.target.value)} className="font-semibold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-slate-500 outline-none p-1 flex-1 transition-colors" placeholder="Tema Projek" />
                  </div>
                  <textarea value={p.deskripsi} onChange={(e) => handleUpdateProjek(p.id, 'deskripsi', e.target.value)} className="w-full text-sm text-slate-700 bg-white border border-slate-200 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 rounded-lg outline-none p-3 resize-y min-h-[80px] shadow-sm transition-all" placeholder="Deskripsi/Judul Projek" />
                </div>
                <button onClick={() => handleDeleteProjek(p.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors mt-1">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="p-5 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Dimensi yang diukur</h4>
                  <button onClick={() => handleAddDimensi(p.id)} className="text-sm text-slate-900 hover:text-slate-700 flex items-center gap-1 font-medium bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={14} /> Tambah Dimensi
                  </button>
                </div>
                
                {dims.length === 0 ? (
                  <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">Belum ada dimensi, silakan tambah minimal 1.</p>
                ) : (
                  <ul className="space-y-2">
                    {dims.map(d => (
                      <li key={d.id} className="flex gap-3 items-center group">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <input type="text" value={d.nama} onChange={(e) => handleUpdateDimensi(d.id, e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all font-medium text-slate-700" placeholder="Misal: Bernalar Kritis" />
                        <button onClick={() => handleDeleteDimensi(d.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
