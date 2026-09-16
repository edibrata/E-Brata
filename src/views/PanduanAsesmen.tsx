import React from 'react';
import { BookOpen, FileText, CheckCircle2, Info, Check } from 'lucide-react';

export default function PanduanAsesmen() {
  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200 text-slate-800 max-w-5xl mx-auto space-y-12">
      <div className="border-b border-slate-100 pb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          Panduan Asesmen Edisi Revisi 2025
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed text-lg max-w-3xl">
          Aplikasi E-Rapor ini dikembangkan dengan merujuk langsung pada kebijakan terbaru dari Kementerian Pendidikan. Halaman ini menjelaskan landasan filosofis dan teknis bagaimana aplikasi ini memproses nilai anak-anak didik Anda.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-bold text-lg">1</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Berbagai Alternatif Pendekatan KKTP</h2>
        </div>
        <div className="pl-13 ml-12">
          <p className="text-slate-600 leading-relaxed mb-4">
            Berdasarkan <b>Panduan Pembelajaran dan Asesmen Edisi Revisi Tahun 2025</b>, pendidik diberikan keleluasaan untuk menentukan apakah seorang murid telah mencapai Tujuan Pembelajaran (TP) menggunakan beberapa pendekatan alternatif di kelas:
          </p>
          <div className="bg-slate-50 border-l-4 border-indigo-500 p-5 rounded-r-xl italic text-slate-700 font-serif mb-4">
            "Dengan demikian, kriteria yang digunakan untuk menentukan apakah murid telah mencapai tujuan pembelajaran dapat dikembangkan pendidik dengan menggunakan beberapa pendekatan, di antaranya:<br/><br/>
            1) menggunakan deskripsi kriteria;<br/>
            2) menggunakan rubrik;<br/>
            3) menggunakan skala atau interval nilai; dan<br/>
            4) menggunakan persentase, atau pendekatan lainnya sesuai dengan kebutuhan..."<br/>
            <span className="text-sm text-slate-500 font-sans font-medium mt-3 block not-italic">— Dikutip dari: Panduan Pembelajaran dan Asesmen Edisi Revisi 2025, Bab III, Halaman 40</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Meskipun di lapangan (saat praktik mengajar) Anda bebas menggunakan pendekatan Rubrik atau Deskripsi Kriteria (Checklist), namun untuk keperluan pengolahan akhir ke dalam Rapor, data kualitatif tersebut pada akhirnya tetap perlu <b>dikuantifikasi (diubah menjadi angka)</b> agar sistem dapat menghitung nilai akhir secara objektif.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 font-bold text-lg">2</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Pendekatan yang Dipilih oleh Aplikasi E-Rapor</h2>
        </div>
        <div className="pl-13 ml-12">
          <p className="text-slate-600 leading-relaxed mb-4">
            Untuk menjembatani kebebasan penilaian guru di lapangan dengan sistem pengolahan komputer yang efisien dan akurat, Aplikasi E-Rapor ini secara khusus menerapkan pendekatan <b>"Skala atau Interval Nilai"</b>.
          </p>
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6">
            <p className="text-emerald-900 leading-relaxed">
              Dengan pendekatan ini, Anda cukup mengonversi hasil pengamatan Anda (baik dari rubrik, tes tertulis, maupun praktik) ke dalam skala angka <b>0-100</b>. Sistem E-Rapor kemudian akan otomatis menerjemahkan angka tersebut menjadi kalimat deskripsi kualitatif di halaman rapor siswa, berdasarkan rentang interval yang telah disepakati.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <span className="text-amber-600 font-bold text-lg">3</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Fokus Rentang Interval dan Contoh Sesuai Panduan</h2>
        </div>
        <div className="pl-13 ml-12">
          <p className="text-slate-600 leading-relaxed mb-6">
            Aplikasi ini memungkinkan Anda untuk mengatur batas rentang interval secara mandiri untuk setiap mata pelajaran (melalui menu Tujuan Pembelajaran). Namun, sebagai rujukan dan inspirasi, pemerintah telah memberikan pedoman baku mengenai rentang interval beserta maknanya terhadap pencapaian siswa. Berikut adalah contoh pedoman rentang interval beserta tindak lanjutnya yang secara langsung dikutip dari buku panduan:
          </p>

          <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm mb-4">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Tabel 3.7: Contoh Kriteria Ketuntasan Tujuan Pembelajaran Menggunakan Interval</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold w-40 text-center">Interval Nilai</th>
                  <th className="px-6 py-4 font-bold border-l border-slate-200">Ketercapaian dan Tindak Lanjut (Status di Aplikasi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-bold text-rose-600 bg-rose-50/30">0 - 20</td>
                  <td className="px-6 py-4 border-l border-slate-100 text-slate-600">Belum mencapai tujuan pembelajaran. Pendidik menanyakan tantangan yang dihadapi <b>(perlu remedial seluruh kriteria)</b>.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-bold text-orange-600 bg-orange-50/30">21 - 40</td>
                  <td className="px-6 py-4 border-l border-slate-100 text-slate-600">Belum mencapai tujuan pembelajaran. <b>Perlu remedial</b> dengan mempelajari kembali sebagian besar kriteria.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-bold text-amber-600 bg-amber-50/30">41 - 60</td>
                  <td className="px-6 py-4 border-l border-slate-100 text-slate-600"><b>Hampir mencapai</b> tujuan pembelajaran. Perlu remedial dengan mempelajari kembali kriteria yang diperlukan.</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-bold text-emerald-600 bg-emerald-50/30">61 - 80</td>
                  <td className="px-6 py-4 border-l border-slate-100 text-slate-600"><b>Sudah mencapai tujuan pembelajaran. (Tuntas)</b></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-center font-bold text-teal-600 bg-teal-50/30">81 - 100</td>
                  <td className="px-6 py-4 border-l border-slate-100 text-slate-600">Sudah mencapai tujuan pembelajaran. <b>Perlu tantangan lebih (pengayaan)</b>.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 font-medium italic">
            (Diadaptasi dari Tabel 3.7 & Penjelasan Interval, Panduan Pembelajaran dan Asesmen Edisi Revisi 2025, Halaman 44-45)
          </p>
        </div>
      </section>

      <section className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 mt-8 flex gap-4 items-start">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-indigo-900 text-lg mb-2">Langkah Selanjutnya:</h3>
          <p className="text-indigo-800/80 leading-relaxed">
            Anda dapat menyesuaikan rentang nilai interval untuk mata pelajaran Anda (menggeser titik batas 20, 40, 60, dst) melalui menu <b>Tujuan Pembelajaran</b>. Anda juga dapat menggunakan pengaturan default yang persis sama dengan contoh tabel pedoman kementerian di atas jika ingin cara yang paling praktis dan aman secara regulasi.
          </p>
        </div>
      </section>
    </div>
  );
}
