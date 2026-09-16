import { useState } from 'react';
import { BookOpen, Target } from 'lucide-react';
import DataMapel from './DataMapel';
import TujuanPembelajaranView from './TujuanPembelajaran';

export default function KegiatanAkademik() {
  const [activeTab, setActiveTab] = useState<'mapel' | 'tp'>('mapel');

  return (
    <div className="animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-sm border border-slate-200 w-full overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('mapel')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'mapel'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            MATA PELAJARAN
          </button>
          <button
            onClick={() => setActiveTab('tp')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'tp'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4" />
            TUJUAN PEMBELAJARAN (TP)
          </button>
        </div>

        <div>
          {activeTab === 'mapel' && <DataMapel />}
          {activeTab === 'tp' && <TujuanPembelajaranView />}
        </div>
      </div>
    </div>
  );
}
