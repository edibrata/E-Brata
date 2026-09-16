import { useState } from 'react';
import { Medal, Target } from 'lucide-react';
import TabManajemenEkskul from './TabManajemenEkskul';
import TabTPEkskul from './TabTPEkskul';

export default function DataEkstrakurikuler() {
  const [activeTab, setActiveTab] = useState<'manajemen' | 'tp'>('manajemen');

  return (
    <div className="animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-sm border border-slate-200 w-full overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('manajemen')}
            className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'manajemen'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Medal className="w-4 h-4" />
            MANAJEMEN EKSTRAKURIKULER
          </button>
          <button
            onClick={() => setActiveTab('tp')}
            className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'tp'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4" />
            TUJUAN PEMBELAJARAN (TP) EKSKUL
          </button>
        </div>

        <div>
          {activeTab === 'manajemen' && <TabManajemenEkskul />}
          {activeTab === 'tp' && <TabTPEkskul />}
        </div>
      </div>
    </div>
  );
}
