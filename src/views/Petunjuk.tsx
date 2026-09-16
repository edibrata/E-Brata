export default function Petunjuk() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Petunjuk Penggunaan</h2>
      <div className="space-y-4 text-sm">
        <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-slate-500">
          <h3 className="font-semibold mb-2 text-slate-700 text-base">1. Persiapan Data</h3>
          <p className="text-slate-600 leading-relaxed">Mulai dengan mengisi <strong>Data Dasar</strong>, <strong>Kegiatan Akademik</strong>, <strong>Tujuan Pembelajaran</strong>, dan <strong>Data Murid</strong> secara lengkap pada kelompok menu Master Data. Pastikan data diisi dengan akurat sebagai dasar pembuatan rapor.</p>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-semibold mb-2 text-blue-800 text-base">2. Input Nilai Akademik & Non-Akademik</h3>
          <p className="text-slate-600 leading-relaxed">Masukkan nilai siswa pada menu <strong>Nilai Intrakurikuler</strong> per Mata Pelajaran. Jangan lupa mengisi nilai <strong>Ekstrakurikuler</strong> dan melaksanakan penilaian <strong>Projek</strong>. Gunakan tombol TAB untuk mempercepat input layaknya spreadsheet.</p>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-emerald-500">
          <h3 className="font-semibold mb-2 text-emerald-800 text-base">3. Evaluasi & Leger</h3>
          <p className="text-slate-600 leading-relaxed">Periksa kembali rekapitulasi nilai keseluruhan siswa melalui menu <strong>Leger Nilai</strong>. Anda juga dapat menggunakan menu <strong>Lihat & Sesuaikan Capaian</strong> untuk memastikan deskripsi yang di-generate sistem sudah sesuai dengan karakter siswa.</p>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-xl border-l-4 border-slate-500">
          <h3 className="font-semibold mb-2 text-slate-800 text-base">4. Cetak Dokumen & Rapor</h3>
          <p className="text-slate-600 leading-relaxed">Lanjutkan ke grup menu Output untuk mencetak <strong>Rapor</strong>, <strong>Jilid & Identitas</strong>, <strong>Biodata Murid</strong>, hingga <strong>Keterangan Pindah</strong>. Pada saat mencetak, sidebar navigasi akan otomatis disembunyikan agar hasilnya rapi di atas kertas berukuran A4.</p>
        </div>
        
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 border-l-4 border-l-purple-500 mt-6">
          <h3 className="font-semibold mb-2 text-purple-800 text-base">5. Fitur Professional (Eksperimental)</h3>
          <p className="text-slate-600 leading-relaxed">Manfaatkan <strong>AI Assistant</strong> untuk menganalisis pola belajar siswa, serta <strong>Dashboard Analitik</strong> untuk memonitor tren nilai secara keseluruhan per kelas/fase.</p>
        </div>
      </div>
    </div>
  );
}
