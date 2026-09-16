export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-slate-300 mb-4 bg-slate-50 p-6 rounded-full border border-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-slate-500 text-center max-w-md text-sm leading-relaxed">
        Modul ini sedang dalam tahap pengembangan dan akan segera hadir pada pembaruan berikutnya untuk melengkapi kebutuhan aplikasi rapor Anda.
      </p>
    </div>
  );
}
