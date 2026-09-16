import { useState } from 'react';
import { Users, FileText } from 'lucide-react';
import TabDataDasarMurid from './TabDataDasarMurid';
import { useAppStore } from '@/store';

export default function DataSiswa() {
  const [activeTab, setActiveTab] = useState<'dasar' | 'surat'>('dasar');
  const { state } = useAppStore();
  const studentCount = state.siswa?.length || 0;

  return (
    <div className="animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-sm border border-slate-200 w-full overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('dasar')}
            className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'dasar'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            DATA MURID ({studentCount})
          </button>
          <button
            onClick={() => setActiveTab('surat')}
            className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'surat'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            NOMOR SURAT
          </button>
        </div>

        <div>
          {activeTab === 'dasar' && <TabDataDasarMurid />}
          {activeTab === 'surat' && (
            <div className="p-12 text-center text-slate-400 font-medium">
              Fitur Nomor Surat dalam pengembangan...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
