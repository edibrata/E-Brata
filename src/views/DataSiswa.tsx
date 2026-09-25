import TabDataDasarMurid from './TabDataDasarMurid';

interface DataSiswaProps {
  initialSubTab?: 'identitas' | 'ortu' | 'pendukung';
}

export default function DataSiswa({ initialSubTab = 'identitas' }: DataSiswaProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-sm border border-slate-200 w-full overflow-hidden">
        <TabDataDasarMurid initialSubTab={initialSubTab} />
      </div>
    </div>
  );
}
