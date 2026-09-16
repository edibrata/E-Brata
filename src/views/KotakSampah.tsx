import { useAppStore } from '@/store';
import { TrashItem } from '@/types';
import { RefreshCcw, Trash2, History, AlertCircle } from 'lucide-react';

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
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
        <div>
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-900" />
            Kotak Sampah (Recycle Bin)
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">Kelola data yang telah dihapus untuk dipulihkan kembali atau dihapus permanen.</p>
        </div>
        <div className="flex items-center gap-2">
          {trash.length > 0 && (
            <button 
              onClick={handleEmptyTrash}
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg font-bold text-[11px] shadow-sm transition flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Kosongkan Tempat Sampah
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex gap-3 text-slate-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="text-[11px]">
          <p><strong>Informasi Pemulihan:</strong> Segera pulihkan data di sini sebelum dihapus permanen. Memulihkan Mapel/Siswa akan mengembalikannya langsung ke tab terkait.</p>
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-2 w-32 text-left text-[10px] uppercase tracking-wider">Tipe Data</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Keterangan / Label</th>
              <th className="px-4 py-2 w-48 text-left text-[10px] uppercase tracking-wider">Dihapus Pada</th>
              <th className="px-4 py-2 w-24 text-center text-[10px] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trash.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <History className="w-10 h-10 mb-3 text-slate-200" />
                    <p className="font-bold text-slate-500 text-xs">Kotak Sampah Kosong</p>
                    <p className="text-[11px] mt-1">Data yang Anda hapus akan muncul di sini.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {trash.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    item.type === 'mapel' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'siswa' ? 'bg-green-100 text-green-700' : 
                    item.type === 'tp' ? 'bg-purple-100 text-purple-700' : 
                    item.type === 'tp-ekskul' ? 'bg-fuchsia-100 text-fuchsia-700' :
                    item.type === 'ekskul' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-1.5 font-bold text-slate-700 text-[11px]">
                  {item.label}
                </td>
                <td className="px-4 py-1.5 text-slate-500 text-[11px] font-mono">
                  {formatDate(item.deletedAt)}
                </td>
                <td className="px-4 py-1.5 text-center flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleRestore(item)}
                    className="p-1.5 text-indigo-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors group/tooltip relative focus:outline-none"
                  >
                    <RefreshCcw size={15} />
                    <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                      Pulihkan
                    </span>
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors group/tooltip relative focus:outline-none"
                  >
                    <Trash2 size={15} />
                    <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                      Hapus Permanen
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
