import { useAppStore } from '@/store';
import { TrashItem } from '@/types';
import { RefreshCcw, Trash2, History, AlertCircle } from 'lucide-react';
import Tooltip from '@/components/Tooltip';

export default function KotakSampah() {
  const { state, updateState } = useAppStore();
  const trash = state.trash || [];

  const handleRestore = (item: TrashItem) => {
    if (item.type === 'mapel') {
      updateState('mapel', [...(state.mapel || []), item.data]);
    } else if (item.type === 'siswa') {
      updateState('siswa', [...(state.siswa || []), item.data]);
    } else if (item.type === 'tp') {
      updateState('tujuanPembelajaran', [...(state.tujuanPembelajaran || []), item.data]);
    } else if (item.type === 'ekskul') {
      updateState('ekstrakurikuler', [...(state.ekstrakurikuler || []), item.data]);
    } else if (item.type === 'tp-ekskul') {
      updateState('tpEkskul', [...(state.tpEkskul || []), item.data]);
    }
    updateState('trash', trash.filter(t => t.id !== item.id));
  };

  const handlePermanentDelete = (id: string) => {
    updateState('trash', trash.filter(t => t.id !== id));
  };

  const handleEmptyTrash = () => {
    updateState('trash', []);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full animate-in fade-in duration-200">
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            Kotak Sampah
            {trash.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                {trash.length} item
              </span>
            )}
          </h2>
          <Tooltip content="Segera pulihkan data di sini sebelum dihapus permanen. Memulihkan Mapel/Siswa akan mengembalikannya langsung ke tab terkait." position="right">
            <span className="p-1 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer transition-colors">
              <AlertCircle size={14} />
            </span>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {trash.length > 0 && (
            <Tooltip content="Hapus semua item di kotak sampah secara permanen" position="left">
              <button 
                onClick={handleEmptyTrash}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Sampah</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-b-xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="px-4 py-2.5 w-28 text-center text-[10px] uppercase tracking-wider">Tipe Data</th>
              <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider">Keterangan / Label</th>
              <th className="px-4 py-2.5 w-44 text-center text-[10px] uppercase tracking-wider">Dihapus Pada</th>
              <th className="px-4 py-2.5 w-24 text-center text-[10px] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trash.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <History className="w-8 h-8 mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-xs">Kotak Sampah Kosong</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Data yang Anda hapus akan muncul di sini.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {trash.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    item.type === 'mapel' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'siswa' ? 'bg-emerald-100 text-emerald-700' : 
                    item.type === 'tp' ? 'bg-purple-100 text-purple-700' : 
                    item.type === 'tp-ekskul' ? 'bg-fuchsia-100 text-fuchsia-700' :
                    item.type === 'ekskul' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-2 font-bold text-slate-700 text-xs">
                  {item.label}
                </td>
                <td className="px-4 py-2 text-center text-slate-500 text-[11px] font-mono">
                  {formatDate(item.deletedAt)}
                </td>
                <td className="px-4 py-2 text-center flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <Tooltip content="Pulihkan data ini kembali" position="top">
                    <button 
                      onClick={() => handleRestore(item)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      aria-label="Pulihkan"
                    >
                      <RefreshCcw size={15} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Hapus data ini secara permanen" position="top">
                    <button 
                      onClick={() => handlePermanentDelete(item.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      aria-label="Hapus Permanen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
