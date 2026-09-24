import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { Siswa } from '@/types';
import Tooltip from '@/components/Tooltip';
import { 
  Printer, 
  Download, 
  Eye, 
  Search, 
  FileText, 
  Book, 
  Contact, 
  Archive, 
  ArrowRightLeft, 
  CheckCircle2,
  Package,
  DownloadCloud,
  X,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import { 
  buildJilidPDF, 
  buildBiodataPDF, 
  buildRaporPDF, 
  buildBukuIndukPDF, 
  buildPindahPDF, 
  buildCustomBundelPDF,
  getStandardPdfFilename,
  getPaperDimensions,
  PaperSize,
  BundleDocType,
  PdfFontOption,
  formatKelasRombel,
  formatNamaSekolahFooter
} from '@/lib/pdfGenerator';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { hitungNilaiMapel } from '@/lib/penilaianUtils';

type DocumentType = 'jilid' | 'biodata' | 'rapor' | 'buku-induk' | 'pindah' | 'semua';

export default function CetakRapor() {
  const { state } = useAppStore();
  const { sekolah, siswa, nilai, tujuanPembelajaran, mapel, ekstrakurikuler, nilaiEkskul, customDeskripsiMapel } = state;
  const displayedMapel = mapel.filter(m => m.tampilRapor !== false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [pdfFont, setPdfFont] = useState<PdfFontOption>('arial');
  const [isTanpaAngka, setIsTanpaAngka] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ type: DocumentType; siswa: Siswa } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Pilihan Dokumen untuk Bundel
  const [selectedBundleDocs, setSelectedBundleDocs] = useState<BundleDocType[]>([
    'jilid',
    'biodata',
    'rapor',
    'buku-induk',
    'pindah'
  ]);
  const [showBundleConfigModal, setShowBundleConfigModal] = useState<{ student?: Siswa; isBulk?: boolean } | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredSiswa = useMemo(() => {
    return siswa.filter(s => 
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.nisn && s.nisn.includes(searchQuery)) ||
      (s.nis && s.nis.includes(searchQuery))
    );
  }, [siswa, searchQuery]);

  const isAllSelected = filteredSiswa.length > 0 && selectedIds.length === filteredSiswa.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSiswa.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleBundleDoc = (type: BundleDocType) => {
    setSelectedBundleDocs(prev => 
      prev.includes(type) 
        ? (prev.length > 1 ? prev.filter(t => t !== type) : prev) 
        : [...prev, type]
    );
  };

  const getDocTypeLabel = (type: DocumentType): string => {
    switch (type) {
      case 'jilid': return 'Jilid & Identitas';
      case 'biodata': return 'Biodata Murid';
      case 'rapor': return 'Rapor';
      case 'buku-induk': return 'Lampiran Buku Induk';
      case 'pindah': return 'Keterangan Pindah';
      case 'semua': return 'Bundel Dokumen';
      default: return 'Dokumen';
    }
  };

  const getNilaiDanDeskripsi = (studentId: string, mapelId: string) => {
    const n = nilai[studentId]?.[mapelId];
    const mapelObj = mapel.find(m => m.id === mapelId);
    if (!mapelObj) return { finalScore: null, deskripsiTertinggi: '', deskripsiTerendah: '' };

    const student = siswa.find(sw => sw.id === studentId);
    const isPabp = isPabpMapel(mapelObj.nama, mapelObj.kode);

    const allMapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student?.agama, true)
      : allMapelTps;

    const res = hitungNilaiMapel(mapelObj, mapelTps, n);
    return {
      finalScore: res.finalScore,
      deskripsiTertinggi: res.deskripsiTertinggi,
      deskripsiTerendah: res.deskripsiTerendah
    };
  };

  // Factory Pembuat Objek PDF
  const createPdfInstance = (type: DocumentType, student: Siswa, customDocs?: BundleDocType[]): jsPDF => {
    if (type === 'semua') {
      const docsToUse = customDocs || selectedBundleDocs;
      return buildCustomBundelPDF(
        docsToUse,
        sekolah,
        student,
        mapel,
        nilai,
        tujuanPembelajaran,
        ekstrakurikuler,
        nilaiEkskul,
        isTanpaAngka,
        paperSize,
        customDeskripsiMapel,
        pdfFont
      );
    }

    const { format } = getPaperDimensions(paperSize);
    const doc = new jsPDF('p', 'mm', format as any);
    switch (type) {
      case 'jilid':
        buildJilidPDF(doc, sekolah, student, paperSize, false, pdfFont);
        break;
      case 'biodata':
        buildBiodataPDF(doc, sekolah, student, paperSize, false, pdfFont);
        break;
      case 'rapor':
        buildRaporPDF(
          doc,
          sekolah,
          student,
          mapel,
          nilai,
          tujuanPembelajaran,
          ekstrakurikuler,
          nilaiEkskul,
          isTanpaAngka,
          paperSize,
          false,
          customDeskripsiMapel,
          pdfFont
        );
        break;
      case 'buku-induk':
        buildBukuIndukPDF(
          doc,
          sekolah,
          student,
          mapel,
          nilai,
          tujuanPembelajaran,
          paperSize,
          false,
          customDeskripsiMapel,
          pdfFont
        );
        break;
      case 'pindah':
        buildPindahPDF(doc, sekolah, student, paperSize, false, pdfFont);
        break;
    }
    return doc;
  };

  // Unduh 1 File PDF
  const handleDownloadSinglePdf = (type: DocumentType, student: Siswa) => {
    try {
      setIsGeneratingPdf(true);
      const doc = createPdfInstance(type, student);
      const filename = getStandardPdfFilename(getDocTypeLabel(type), student, sekolah, paperSize);
      doc.save(filename);
      showNotification(`PDF (${paperSize.toUpperCase()}) "${filename}" berhasil diunduh!`);
    } catch (error) {
      console.error('Gagal mengunduh PDF:', error);
      showNotification('Terjadi kesalahan saat membuat file PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Unduh Bundel untuk 1 Siswa
  const handleDownloadBundleForStudent = (student: Siswa, docs?: BundleDocType[]) => {
    try {
      setIsGeneratingPdf(true);
      const doc = createPdfInstance('semua', student, docs);
      const filename = getStandardPdfFilename('Bundel Dokumen', student, sekolah, paperSize);
      doc.save(filename);
      showNotification(`Bundel (${paperSize.toUpperCase()}) "${student.nama}" berhasil diunduh!`);
    } catch (error) {
      console.error('Gagal mengunduh bundel:', error);
      showNotification('Terjadi kesalahan saat membuat bundel PDF.');
    } finally {
      setIsGeneratingPdf(false);
      setShowBundleConfigModal(null);
    }
  };

  // BULK VERTIKAL / KOLOM (Unduh 1 Jenis Dokumen untuk Seluruh Murid Terpilih / Sekelas)
  const handleBulkColumnDownload = async (type: DocumentType) => {
    const targetStudents = selectedIds.length > 0 
      ? siswa.filter(s => selectedIds.includes(s.id))
      : filteredSiswa;

    if (targetStudents.length === 0) {
      showNotification('Tidak ada murid yang dipilih.');
      return;
    }

    setIsGeneratingPdf(true);
    showNotification(`Memulai unduh massal ${targetStudents.length} file PDF (${paperSize.toUpperCase()})...`);

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      try {
        const doc = createPdfInstance(type, student);
        const filename = getStandardPdfFilename(getDocTypeLabel(type), student, sekolah, paperSize);
        doc.save(filename);
      } catch (e) {
        console.error(`Gagal membuat PDF untuk ${student.nama}:`, e);
      }
      await new Promise(r => setTimeout(r, 120));
    }

    setIsGeneratingPdf(false);
    showNotification(`Selesai mengunduh ${targetStudents.length} berkas PDF!`);
  };

  // BULK BUNDEL DENGAN PILIHAN DOKUMEN
  const handleBulkBundleWithConfig = async (docs?: BundleDocType[]) => {
    const targetStudents = selectedIds.length > 0 
      ? siswa.filter(s => selectedIds.includes(s.id))
      : filteredSiswa;

    if (targetStudents.length === 0) return;

    setIsGeneratingPdf(true);
    showNotification(`Memulai unduh massal Bundel (${paperSize.toUpperCase()}) untuk ${targetStudents.length} murid...`);

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      try {
        const doc = createPdfInstance('semua', student, docs);
        const filename = getStandardPdfFilename('Bundel Dokumen', student, sekolah, paperSize);
        doc.save(filename);
      } catch (e) {
        console.error(`Gagal membuat bundel untuk ${student.nama}:`, e);
      }
      await new Promise(r => setTimeout(r, 180));
    }

    setIsGeneratingPdf(false);
    setShowBundleConfigModal(null);
    showNotification(`Selesai mengunduh ${targetStudents.length} bundel PDF!`);
  };

  // Render Visual Lembar Kerja Pratinjau
  const renderVisualPreview = (type: DocumentType, currentStudent: Siswa) => {
    const isF4 = paperSize === 'f4';
    const minPageHeight = isF4 ? '1200px' : '1080px';
    const namaSekolahFooter = formatNamaSekolahFooter(sekolah.nama || '');
    const isTimes = pdfFont === 'times';
    const fontFamilyStyle = isTimes ? '"Times New Roman", Times, Georgia, serif' : 'Arial, Helvetica, sans-serif';

    const renderFooter = (pageStr: string) => (
      <div 
        className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9.5pt] text-slate-500"
        style={{ fontFamily: fontFamilyStyle }}
      >
        <span className="font-semibold text-slate-600">{currentStudent.nama} | {currentStudent.nisn || '-'}</span>
        <span className="font-mono text-slate-400">{pageStr}</span>
        <span className="font-semibold text-slate-600">{namaSekolahFooter}</span>
      </div>
    );

    if (type === 'jilid') {
      return (
        <div className="space-y-8" style={{ fontFamily: fontFamilyStyle }}>
          {/* Cover Luar */}
          <div 
            className="border-4 border-double border-slate-700 p-10 flex flex-col justify-between items-center text-center bg-white shadow-md rounded-sm"
            style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
          >
            <div className="space-y-3">
              <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center">
                {sekolah.logoKiri ? (
                  <img src={sekolah.logoKiri} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-slate-600 flex items-center justify-center font-bold text-xs">
                    LOGO SEKOLAH
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-slate-900">
                LAPORAN HASIL BELAJAR
              </h1>
              <h2 className="text-base font-bold tracking-widest uppercase text-slate-700">
                PESERTA DIDIK
              </h2>
              <h3 className="text-lg font-bold tracking-wide uppercase text-blue-900">
                {sekolah.nama || 'SEKOLAH DASAR'}
              </h3>
            </div>

            <div className="w-full max-w-md py-8 px-6 border-2 border-slate-700 rounded-lg space-y-3 my-6 bg-slate-50/50">
              <p className="text-xs uppercase text-slate-500 font-bold tracking-widest">NAMA PESERTA DIDIK</p>
              <p className="text-lg font-extrabold uppercase text-slate-900 border-b-2 border-slate-300 pb-2">
                {currentStudent.nama}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 font-semibold">NIS:</span>
                  <p className="font-bold text-slate-800">{currentStudent.nis || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">NISN:</span>
                  <p className="font-bold text-slate-800 font-mono">{currentStudent.nisn || '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs uppercase font-bold text-slate-700">
              <p>KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</p>
              <p>REPUBLIK INDONESIA</p>
              <p className="text-slate-500 text-[11px] pt-0.5 font-normal">
                {sekolah.kabupatenKotaNama || 'KABUPATEN/KOTA'} - {sekolah.provinsi || 'PROVINSI'}
              </p>
            </div>
          </div>

          {/* Identitas Sekolah */}
          <div 
            className="p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed"
            style={{ minHeight: minPageHeight }}
          >
            <h3 className="text-center font-bold text-base uppercase mb-8 border-b-2 border-slate-800 pb-2">
              IDENTITAS SATUAN PENDIDIKAN
            </h3>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2.5 w-52 font-bold text-slate-700">Nama Sekolah</td><td className="w-4">:</td><td className="py-2.5 font-semibold text-slate-900">{sekolah.nama}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">NPSN</td><td>:</td><td className="py-2.5 font-mono">{sekolah.npsn || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">NSS / NIS</td><td>:</td><td className="py-2.5 font-mono">{sekolah.nss || sekolah.nis || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Alamat Sekolah</td><td>:</td><td className="py-2.5">{sekolah.alamat || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Kelurahan / Desa</td><td>:</td><td className="py-2.5">{sekolah.desaKelurahanNama || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Kecamatan</td><td>:</td><td className="py-2.5">{sekolah.kecamatan || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Kabupaten / Kota</td><td>:</td><td className="py-2.5">{sekolah.kabupatenKotaNama || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Provinsi</td><td>:</td><td className="py-2.5">{sekolah.provinsi || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Kode Pos</td><td>:</td><td className="py-2.5 font-mono">{sekolah.kodePos || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Telepon</td><td>:</td><td className="py-2.5">{sekolah.telepon || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Email</td><td>:</td><td className="py-2.5 font-mono">{sekolah.email || '-'}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">Kepala Sekolah</td><td>:</td><td className="py-2.5 font-bold">{sekolah.kepsek}</td></tr>
                <tr><td className="py-2.5 font-bold text-slate-700">NIP Kepala Sekolah</td><td>:</td><td className="py-2.5 font-mono">{sekolah.nipKepsek || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (type === 'biodata') {
      return (
        <div 
          className="p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed space-y-4"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div className="text-center mb-6">
            <h3 className="font-bold text-base uppercase">KETERANGAN TENTANG DIRI PESERTA DIDIK</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest">(BIODATA PESERTA DIDIK)</p>
          </div>

          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2 w-48 font-bold text-slate-700">1. Nama Lengkap</td><td className="w-4">:</td><td className="py-2 font-bold uppercase text-slate-900">{currentStudent.nama}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">2. Nomor Induk Siswa (NIS)</td><td>:</td><td className="py-2 font-mono">{currentStudent.nis || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">3. NISN</td><td>:</td><td className="py-2 font-mono font-bold text-indigo-950">{currentStudent.nisn || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">4. Tempat, Tanggal Lahir</td><td>:</td><td className="py-2">{currentStudent.tempatLahir || '-'}, {currentStudent.tanggalLahir || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">5. Jenis Kelamin</td><td>:</td><td className="py-2">{currentStudent.jk === 'L' || currentStudent.jk === 'Laki-Laki' ? 'Laki-laki' : 'Perempuan'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">6. Agama</td><td>:</td><td className="py-2">{currentStudent.agama || 'Islam'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">7. Alamat Peserta Didik</td><td>:</td><td className="py-2">{currentStudent.alamat || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">8. Nama Orang Tua</td><td>:</td><td className="py-2"></td></tr>
              <tr><td className="py-1.5 pl-6 text-slate-600 font-semibold">a. Ayah</td><td>:</td><td className="py-1.5 font-bold">{currentStudent.namaAyah || '-'}</td></tr>
              <tr><td className="py-1.5 pl-6 text-slate-600 font-semibold">b. Ibu</td><td>:</td><td className="py-1.5 font-bold">{currentStudent.namaIbu || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">9. Pekerjaan Orang Tua</td><td>:</td><td className="py-2"></td></tr>
              <tr><td className="py-1.5 pl-6 text-slate-600 font-semibold">a. Ayah</td><td>:</td><td className="py-1.5">{currentStudent.pekerjaanAyah || '-'}</td></tr>
              <tr><td className="py-1.5 pl-6 text-slate-600 font-semibold">b. Ibu</td><td>:</td><td className="py-1.5">{currentStudent.pekerjaanIbu || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">10. Alamat Orang Tua</td><td>:</td><td className="py-2">{currentStudent.jalanOrtu || currentStudent.alamat || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">11. Nama Wali (jika ada)</td><td>:</td><td className="py-2">{currentStudent.namaWali || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">12. Pekerjaan Wali</td><td>:</td><td className="py-2">{currentStudent.pekerjaanWali || '-'}</td></tr>
            </tbody>
          </table>

          <div className="mt-10 flex justify-between items-end pt-4">
            <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-center p-2 text-slate-400">
              {currentStudent.fotoBase64 ? (
                <img src={currentStudent.fotoBase64} alt="Foto" className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-[11px] font-bold">Pas Foto<br/>3 x 4 cm</span>
              )}
            </div>

            <div className="text-right space-y-1 text-xs">
              <p>{sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Kota'}, {sekolah.tanggalBiodata || sekolah.tanggalRapor || '15 Juli 2024'}</p>
              <p className="font-bold">Kepala {sekolah.nama}</p>
              <div className="h-16 flex items-center justify-end">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img src={sekolah.ttdKepsek} alt="TTD" className="h-14 object-contain" />
                )}
              </div>
              <p className="font-bold underline uppercase text-sm">{sekolah.kepsek}</p>
              <p className="font-mono text-[11px]">NIP. {sekolah.nipKepsek || '-'}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'rapor') {
      return (
        <div 
          className="p-8 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed space-y-5"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div className="text-center mb-3">
            <h2 className="text-base font-bold uppercase tracking-wider">LAPORAN HASIL BELAJAR (RAPOR)</h2>
            <p className="text-xs font-semibold text-slate-600 uppercase">KURIKULUM MERDEKA</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] border-b border-slate-200 pb-3">
            <div className="flex"><span className="w-32 font-bold text-slate-600">Nama Murid</span><span className="w-4">:</span><span className="font-bold uppercase text-slate-900">{currentStudent.nama}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Kelas / Rombel</span><span className="w-4">:</span><span className="font-semibold">{formatKelasRombel(sekolah)}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">NISN / NIS</span><span className="w-4">:</span><span className="font-mono font-semibold">{currentStudent.nisn || '-'} / {currentStudent.nis || '-'}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Fase</span><span className="w-4">:</span><span className="font-semibold">{sekolah.fase}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Nama Sekolah</span><span className="w-4">:</span><span className="font-semibold">{sekolah.nama}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Semester</span><span className="w-4">:</span><span className="font-semibold">{sekolah.semester || '1 (Ganjil)'}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Alamat Sekolah</span><span className="w-4">:</span><span className="font-semibold">{sekolah.alamat || '-'}</span></div>
            <div className="flex"><span className="w-32 font-bold text-slate-600">Tahun Ajaran</span><span className="w-4">:</span><span className="font-semibold">{sekolah.tahunAjaran}</span></div>
          </div>

          {/* Tabel Nilai & Capaian */}
          <div>
            <h4 className="font-bold text-xs uppercase mb-1.5 text-slate-800">A. Nilai dan Capaian Kompetensi</h4>
            <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-center font-bold">
                  <th className="border border-slate-400 px-2 py-1.5 w-8">No</th>
                  <th className="border border-slate-400 px-3 py-1.5 w-44 text-left">Muatan Pelajaran</th>
                  {!isTanpaAngka && <th className="border border-slate-400 px-2 py-1.5 w-16">Nilai Akhir</th>}
                  <th className="border border-slate-400 px-3 py-1.5 text-left">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {displayedMapel.map((m, idx) => {
                  const { finalScore, deskripsiTertinggi, deskripsiTerendah } = getNilaiDanDeskripsi(currentStudent.id, m.id);
                  return (
                    <tr key={m.id} className="align-top">
                      <td className="border border-slate-400 px-2 py-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 px-3 py-1.5 font-bold">{m.nama}</td>
                      {!isTanpaAngka && (
                        <td className="border border-slate-400 px-2 py-1.5 text-center font-mono font-bold text-slate-900">
                          {finalScore !== null ? finalScore : '-'}
                        </td>
                      )}
                      <td className="border border-slate-400 px-3 py-1.5 space-y-1.5 text-slate-700 text-[10.5px]">
                        {deskripsiTertinggi && (
                          <p>{deskripsiTertinggi}</p>
                        )}
                        {deskripsiTerendah && (
                          <p>{deskripsiTerendah}</p>
                        )}
                        {!deskripsiTertinggi && !deskripsiTerendah && (
                          <span className="text-slate-400 italic">Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Ekstrakurikuler */}
          <div>
            <h4 className="font-bold text-xs uppercase mb-1.5 text-slate-800">B. Ekstrakurikuler</h4>
            <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-center font-bold">
                  <th className="border border-slate-400 px-2 py-1 w-8">No</th>
                  <th className="border border-slate-400 px-3 py-1 w-48 text-left">Kegiatan Ekstrakurikuler</th>
                  <th className="border border-slate-400 px-2 py-1 w-20">Predikat</th>
                  <th className="border border-slate-400 px-3 py-1 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {ekstrakurikuler && ekstrakurikuler.length > 0 ? (
                  ekstrakurikuler.filter(e => e.tampilRapor !== false).map((e, idx) => {
                    const ne = nilaiEkskul?.[currentStudent.id]?.[e.id];
                    return (
                      <tr key={e.id}>
                        <td className="border border-slate-400 px-2 py-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 px-3 py-1 font-semibold">{e.nama}</td>
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold">{ne?.predikat || 'Baik (B)'}</td>
                        <td className="border border-slate-400 px-3 py-1 text-[10.5px]">{ne?.deskripsi || `Aktif dan berpartisipasi baik dalam kegiatan ${e.nama}.`}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-slate-400 px-3 py-1 text-center text-slate-400 italic">- Tidak ada data ekstrakurikuler -</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Kehadiran & Catatan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="font-bold text-xs uppercase mb-1 text-slate-800">C. Ketidakhadiran</h4>
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <tbody>
                  <tr><td className="border border-slate-400 px-3 py-1 w-40 font-semibold">Sakit</td><td className="border border-slate-400 px-3 py-1 text-center font-mono">0 hari</td></tr>
                  <tr><td className="border border-slate-400 px-3 py-1 font-semibold">Izin</td><td className="border border-slate-400 px-3 py-1 text-center font-mono">0 hari</td></tr>
                  <tr><td className="border border-slate-400 px-3 py-1 font-semibold">Tanpa Keterangan</td><td className="border border-slate-400 px-3 py-1 text-center font-mono">0 hari</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase mb-1 text-slate-800">D. Catatan Wali Kelas</h4>
              <div className="border border-slate-400 p-2.5 h-[76px] text-[11px] leading-relaxed text-slate-700 italic">
                Pertahankan semangat belajar dan terus kembangkan bakat serta prestasimu!
              </div>
            </div>
          </div>

          {/* Titimangsa & Tanda Tangan */}
          <div className="pt-3">
            <div className="text-right text-xs mb-3">
              {sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Tempat'}, {sekolah.tanggalRapor || '20 Desember 2024'}
            </div>
            <div className="grid grid-cols-3 text-center text-xs gap-3">
              <div>
                <p className="font-semibold">Mengetahui,</p>
                <p className="font-semibold">Orang Tua / Wali</p>
                <div className="h-14" />
                <p className="font-bold border-b border-dotted border-slate-600 inline-block px-6 pb-0.5">
                  {currentStudent.namaAyah || currentStudent.namaIbu || '........................'}
                </p>
              </div>
              <div>
                <p className="font-semibold">Mengetahui,</p>
                <p className="font-semibold">Kepala Sekolah</p>
                <div className="h-14 flex items-center justify-center">
                  {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                    <img src={sekolah.ttdKepsek} alt="TTD" className="h-12 object-contain" />
                  )}
                </div>
                <p className="font-bold uppercase underline">{sekolah.kepsek}</p>
                <p className="text-[10px] font-mono">NIP. {sekolah.nipKepsek || '-'}</p>
              </div>
              <div>
                <p className="font-semibold">&nbsp;</p>
                <p className="font-semibold">Guru / Wali Kelas</p>
                <div className="h-14 flex items-center justify-center">
                  {sekolah.useDigitalSignature && sekolah.ttdWaliKelas && (
                    <img src={sekolah.ttdWaliKelas} alt="TTD" className="h-12 object-contain" />
                  )}
                </div>
                <p className="font-bold uppercase underline">{sekolah.waliKelas}</p>
                <p className="text-[10px] font-mono">NIP. {sekolah.nipWaliKelas || '-'}</p>
              </div>
            </div>
          </div>

          {/* Footer Resmi */}
          {renderFooter('Hal. 1 dari 1')}
        </div>
      );
    }

    if (type === 'buku-induk') {
      return (
        <div 
          className="p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed space-y-5"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div className="text-center mb-5">
            <h2 className="text-base font-bold uppercase tracking-wider">LAMPIRAN BUKU INDUK PESERTA DIDIK</h2>
            <p className="text-xs font-semibold text-slate-600 uppercase">{sekolah.nama}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-300 pb-3">
            <div><b>Nama Murid:</b> {currentStudent.nama}</div>
            <div><b>Kelas/Fase:</b> {sekolah.kelas} / {sekolah.fase}</div>
            <div><b>NIS/NISN:</b> {currentStudent.nis || '-'} / {currentStudent.nisn || '-'}</div>
            <div><b>Tahun Ajaran:</b> {sekolah.tahunAjaran} (Semester {sekolah.semester})</div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase mb-2">Rekapitulasi Nilai Akademik & Capaian</h4>
            <table className="w-full border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-8">No</th>
                  <th className="border border-slate-400 p-2 text-left">Mata Pelajaran</th>
                  <th className="border border-slate-400 p-2 w-20">Nilai Akhir</th>
                  <th className="border border-slate-400 p-2 w-24">Predikat</th>
                  <th className="border border-slate-400 p-2 text-left">Catatan Kemajuan Belajar</th>
                </tr>
              </thead>
              <tbody>
                {displayedMapel.map((m, idx) => {
                  const { finalScore, deskripsiTertinggi } = getNilaiDanDeskripsi(currentStudent.id, m.id);
                  const predikat = finalScore !== null ? (finalScore >= 85 ? 'Sangat Baik' : finalScore >= 70 ? 'Baik' : 'Cukup') : '-';
                  return (
                    <tr key={m.id}>
                      <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 font-bold">{m.nama}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-bold">{finalScore !== null ? finalScore : '-'}</td>
                      <td className="border border-slate-400 p-2 text-center">{predikat}</td>
                      <td className="border border-slate-400 p-2 text-[10.5px] text-slate-700">{deskripsiTertinggi || 'Mengikuti pembelajaran dengan baik.'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-6 flex justify-end">
            <div className="text-center w-64 space-y-1 text-xs">
              <p>{sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Tempat'}, {sekolah.tanggalRapor || '20 Desember 2024'}</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="h-14 flex items-center justify-center">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img src={sekolah.ttdKepsek} alt="TTD" className="h-12 object-contain" />
                )}
              </div>
              <p className="font-bold uppercase underline">{sekolah.kepsek}</p>
              <p className="font-mono text-[11px]">NIP. {sekolah.nipKepsek || '-'}</p>
            </div>
          </div>

          {/* Footer Resmi */}
          {renderFooter('Hal. 1 dari 1')}
        </div>
      );
    }

    if (type === 'pindah') {
      return (
        <div 
          className="p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed space-y-5"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div className="text-center mb-5">
            <h2 className="text-base font-bold uppercase tracking-wider">KETERANGAN PINDAH SEKOLAH</h2>
            <p className="text-xs font-semibold text-slate-600 uppercase">{sekolah.nama}</p>
          </div>

          <p className="text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini, Kepala <b>{sekolah.nama}</b> menerangkan bahwa:
          </p>

          <table className="w-full text-left my-4">
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2 w-48 font-bold text-slate-700">Nama Peserta Didik</td><td className="w-4">:</td><td className="py-2 font-bold uppercase text-slate-900">{currentStudent.nama}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">Nomor Induk / NISN</td><td>:</td><td className="py-2 font-mono">{currentStudent.nis || '-'} / {currentStudent.nisn || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">Jenis Kelamin</td><td>:</td><td className="py-2">{currentStudent.jk === 'L' || currentStudent.jk === 'Laki-Laki' ? 'Laki-laki' : 'Perempuan'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">Tingkat / Kelas</td><td>:</td><td className="py-2 font-bold">Kelas {sekolah.kelas} ({sekolah.fase})</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">Nama Orang Tua/Wali</td><td>:</td><td className="py-2">{currentStudent.namaAyah || currentStudent.namaIbu || currentStudent.namaWali || '-'}</td></tr>
              <tr><td className="py-2 font-bold text-slate-700">Alamat Orang Tua</td><td>:</td><td className="py-2">{currentStudent.jalanOrtu || currentStudent.alamat || '-'}</td></tr>
            </tbody>
          </table>

          <p className="text-justify leading-relaxed">
            Sesuai dengan surat permohonan pindah sekolah dari orang tua/wali peserta didik tanggal ................................, yang bersangkutan mengajukan pindah ke sekolah tujuan:
          </p>

          <div className="border border-dashed border-slate-400 p-4 rounded bg-slate-50 space-y-2">
            <p><b>Nama Sekolah Tujuan :</b> .....................................................................................................</p>
            <p><b>Alamat Sekolah Tujuan :</b> .....................................................................................................</p>
            <p><b>Alasan Pindah :</b> Mengikuti tempat tinggal orang tua / lainnya.</p>
          </div>

          <div className="pt-8 flex justify-end">
            <div className="text-center w-64 space-y-1 text-xs">
              <p>{sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Tempat'}, ............................. 202...</p>
              <p className="font-bold">Kepala {sekolah.nama}</p>
              <div className="h-14 flex items-center justify-center">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img src={sekolah.ttdKepsek} alt="TTD" className="h-12 object-contain" />
                )}
              </div>
              <p className="font-bold uppercase underline">{sekolah.kepsek}</p>
              <p className="font-mono text-[11px]">NIP. {sekolah.nipKepsek || '-'}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'semua') {
      return (
        <div className="space-y-12">
          {selectedBundleDocs.includes('jilid') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                1. Jilid & Identitas Satuan Pendidikan
              </span>
              {renderVisualPreview('jilid', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('biodata') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                2. Keterangan Tentang Diri Peserta Didik (Biodata)
              </span>
              {renderVisualPreview('biodata', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('rapor') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                3. Laporan Hasil Belajar (Rapor)
              </span>
              {renderVisualPreview('rapor', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('buku-induk') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                4. Lampiran Buku Induk Siswa
              </span>
              {renderVisualPreview('buku-induk', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('pindah') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                5. Surat Keterangan Pindah Sekolah
              </span>
              {renderVisualPreview('pindah', currentStudent)}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header & Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Pusat Output & Cetak Dokumen Rapor</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase">
                  {pdfFont === 'arial' ? 'Arial 11pt' : 'Times New Roman 12pt'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pratinjau interaktif, cetak satuan, dan unduh massal dokumen rapor peserta didik.
              </p>
            </div>
          </div>
        </div>

        {/* Font Picker, Paper Size, Search and Options */}
        <div className="flex flex-wrap items-center gap-3">
          {/* PILIHAN KAIDAH FONT (Arial 11pt vs Times New Roman 12pt) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Tooltip content="Kaidah Font Sans-Serif Standar (Arial 11pt)" position="bottom">
              <button
                type="button"
                onClick={() => setPdfFont('arial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pdfFont === 'arial'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arial (11pt)
              </button>
            </Tooltip>
            <Tooltip content="Kaidah Font Serif Resmi (Times New Roman 12pt)" position="bottom">
              <button
                type="button"
                onClick={() => setPdfFont('times')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-serif transition cursor-pointer ${
                  pdfFont === 'times'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Times (12pt)
              </button>
            </Tooltip>
          </div>

          {/* PILIHAN UKURAN KERTAS A4 / F4 DENGAN TOOLTIPS TAILWIND */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Tooltip content="Ukuran Standar A4 (210 × 297 mm)" position="bottom">
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperSize === 'a4'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4
              </button>
            </Tooltip>
            <Tooltip content="Ukuran Standar F4 / Folio (215 × 330 mm)" position="bottom">
              <button
                type="button"
                onClick={() => setPaperSize('f4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  paperSize === 'f4'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                F4
              </button>
            </Tooltip>
          </div>

          {(sekolah.fase === 'A' || sekolah.kelas === '1' || sekolah.kelas === '2') && (
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-xs font-semibold text-slate-700">
              <input 
                type="checkbox" 
                checked={isTanpaAngka} 
                onChange={(e) => setIsTanpaAngka(e.target.checked)} 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
              />
              <span>Rapor Fase A Tanpa Angka</span>
            </label>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid / NISN..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium transition"
            />
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Vertikal & Horizontal) */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
              {selectedIds.length}
            </span>
            <span className="font-bold text-indigo-100">
              {selectedIds.length} Murid Terpilih ({paperSize.toUpperCase()}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* BULK HORIZONTAL DENGAN OPSI CENTANG */}
            <Tooltip content={`Pilih dokumen & unduh bundel (${paperSize.toUpperCase()}) untuk seluruh murid terpilih`} position="top">
              <button
                onClick={() => setShowBundleConfigModal({ isBulk: true })}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Unduh Bundel ({selectedIds.length})</span>
              </button>
            </Tooltip>

            {/* BULK PER KOLOM */}
            <button
              onClick={() => handleBulkColumnDownload('rapor')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Rapor
            </button>
            <button
              onClick={() => handleBulkColumnDownload('jilid')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Book className="w-3.5 h-3.5" />
              Jilid
            </button>
            <button
              onClick={() => handleBulkColumnDownload('biodata')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Contact className="w-3.5 h-3.5" />
              Biodata
            </button>
            <button
              onClick={() => handleBulkColumnDownload('buku-induk')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Buku Induk
            </button>
            <button
              onClick={() => handleBulkColumnDownload('pindah')}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Pindah
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main Unified Output Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 270px)' }}>
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <tr>
                {/* Kolom Centang Bulk Vertikal */}
                <th className="px-3 py-3.5 w-10 text-center text-[10px] uppercase tracking-wider">
                  <Tooltip content={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua murid (Bulk Vertikal)"} position="bottom">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                    />
                  </Tooltip>
                </th>
                <th className="px-3 py-3.5 w-12 text-center text-[10px] uppercase tracking-wider">No</th>
                <th className="px-4 py-3.5 min-w-[200px] text-left text-[10px] uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3.5 w-32 text-left text-[10px] uppercase tracking-wider">NISN</th>
                
                {/* Jilid & Identitas + Tombol Bulk Header */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Jilid & Identitas</span>
                    <Tooltip content="Unduh massal PDF Jilid untuk seluruh murid di tabel" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('jilid')}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Biodata Murid + Tombol Bulk Header */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Biodata Murid</span>
                    <Tooltip content="Unduh massal PDF Biodata untuk seluruh murid di tabel" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('biodata')}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Rapor + Tombol Bulk Header */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Rapor</span>
                    <Tooltip content="Unduh massal PDF Rapor untuk seluruh murid di tabel" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('rapor')}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Lampiran Buku Induk + Tombol Bulk Header */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Lampiran Buku Induk</span>
                    <Tooltip content="Unduh massal PDF Buku Induk untuk seluruh murid di tabel" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('buku-induk')}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Keterangan Pindah + Tombol Bulk Header */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Keterangan Pindah</span>
                    <Tooltip content="Unduh massal PDF Surat Pindah untuk seluruh murid di tabel" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('pindah')}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* BULK HORIZONTAL HEADER: BUNDEL DOKUMEN */}
                <th className="px-3 py-3.5 text-center text-[10px] uppercase tracking-wider bg-indigo-50/70 text-indigo-900 border-l border-indigo-100">
                  <div className="flex items-center justify-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bundel Dokumen</span>
                    <Tooltip content="Pilih dokumen & unduh massal bundel untuk seluruh murid" position="bottom">
                      <button
                        onClick={() => setShowBundleConfigModal({ isBulk: true })}
                        className="p-1 rounded text-indigo-500 hover:text-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                    <p className="font-semibold text-slate-600 text-xs">Tidak ada data murid yang ditemukan.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pastikan data murid telah ditambahkan pada menu Perencanaan.</p>
                  </td>
                </tr>
              ) : null}
              {filteredSiswa.map((student, i) => {
                const isSelected = selectedIds.includes(student.id);
                return (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-indigo-50/40' : ''}`}
                  >
                    {/* Centang Bulk Vertikal */}
                    <td className="px-3 py-2.5 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleSelect(student.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                      />
                    </td>

                    {/* No */}
                    <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-400">{i + 1}</td>

                    {/* Nama */}
                    <td className="px-4 py-2.5 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{student.nama}</span>
                        {student.jk && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${student.jk === 'L' || student.jk === 'Laki-Laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                            {student.jk === 'L' || student.jk === 'Laki-Laki' ? 'L' : 'P'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* NISN */}
                    <td className="px-4 py-2.5 font-mono text-slate-600 font-semibold">{student.nisn || '-'}</td>

                    {/* Jilid & Identitas */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Jilid & Identitas - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'jilid', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Jilid & Identitas - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('jilid', student)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Biodata Murid */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Biodata Murid - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'biodata', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Biodata Murid - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('biodata', student)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Rapor */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Rapor - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'rapor', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Rapor - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('rapor', student)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Lampiran Buku Induk */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Lampiran Buku Induk - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'buku-induk', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Lampiran Buku Induk - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('buku-induk', student)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Keterangan Pindah */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Keterangan Pindah - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'pindah', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Keterangan Pindah - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('pindah', student)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* BULK HORIZONTAL ACTION: BUNDEL DOKUMEN PER MURID */}
                    <td className="px-3 py-2.5 text-center bg-indigo-50/30 border-l border-indigo-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip content={`Lihat Pratinjau Bundel Dokumen - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'semua', siswa: student })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Pilih dokumen & unduh bundel PDF - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setShowBundleConfigModal({ student })}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Unduh Bundel</span>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Statistik */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-700">Total Murid: <b>{filteredSiswa.length}</b></span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-600">Ukuran Kertas Aktif: <b>{paperSize.toUpperCase()}</b></span>
          </div>
        </div>
      </div>

      {/* MODAL PILIHAN CENTANG DOKUMEN BUNDEL */}
      {showBundleConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-600 text-white">
                  <Package className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm">Pilih Dokumen untuk Bundel PDF</h3>
                  <p className="text-[11px] text-slate-400">
                    {showBundleConfigModal.isBulk 
                      ? `Unduh bundel untuk ${selectedIds.length > 0 ? selectedIds.length : filteredSiswa.length} murid`
                      : showBundleConfigModal.student?.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBundleConfigModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 font-semibold mb-2">
                Centang lembaran dokumen yang ingin digabungkan ke dalam 1 file PDF:
              </p>

              <div className="space-y-2">
                {[
                  { id: 'jilid' as BundleDocType, label: 'Jilid & Identitas Satuan Pendidikan', desc: 'Cover luar & identitas sekolah' },
                  { id: 'biodata' as BundleDocType, label: 'Biodata Peserta Didik', desc: 'Identitas diri, orang tua, & pas foto' },
                  { id: 'rapor' as BundleDocType, label: 'Laporan Hasil Belajar (Rapor)', desc: 'Nilai, capaian kompetensi, ekskul & presensi' },
                  { id: 'buku-induk' as BundleDocType, label: 'Lampiran Buku Induk', desc: 'Rekapitulasi nilai & catatan kemajuan belajar' },
                  { id: 'pindah' as BundleDocType, label: 'Keterangan Pindah Sekolah', desc: 'Format surat mutasi/pindah sekolah' },
                ].map(item => {
                  const isChecked = selectedBundleDocs.includes(item.id);
                  return (
                    <label 
                      key={item.id}
                      onClick={() => toggleBundleDoc(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        isChecked 
                          ? 'bg-indigo-50/60 border-indigo-200 text-slate-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center transition ${isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                <div className="text-[11px] text-slate-500">
                  Kertas: <span className="font-bold text-slate-800 uppercase">{paperSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBundleConfigModal(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={selectedBundleDocs.length === 0 || isGeneratingPdf}
                    onClick={() => {
                      if (showBundleConfigModal.isBulk) {
                        handleBulkBundleWithConfig(selectedBundleDocs);
                      } else if (showBundleConfigModal.student) {
                        handleDownloadBundleForStudent(showBundleConfigModal.student, selectedBundleDocs);
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Bundel PDF ({selectedBundleDocs.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU DOKUMEN (INTERAKTIF & SMOOTH VERTICAL SCROLL) */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Modal Navigation - Sticky Header */}
            <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-700/80 flex items-center justify-between gap-4 text-white shrink-0 z-20">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  {previewDoc.type === 'semua' && <Package className="w-3.5 h-3.5" />}
                  {getDocTypeLabel(previewDoc.type)}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">{previewDoc.siswa.nama}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    NISN: {previewDoc.siswa.nisn || '-'} • Kertas: {paperSize.toUpperCase()} • Font: {pdfFont === 'arial' ? 'Arial (11pt)' : 'Times (12pt)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => {
                    if (previewDoc.type === 'semua') {
                      handleDownloadBundleForStudent(previewDoc.siswa);
                    } else {
                      handleDownloadSinglePdf(previewDoc.type, previewDoc.siswa);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content - Vertically Scrollable Body Container with Smooth Top-to-Bottom Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-950/70 scroll-smooth">
              <div className="w-full max-w-[820px] mx-auto bg-white rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 mb-10">
                {renderVisualPreview(previewDoc.type, previewDoc.siswa)}
              </div>
            </div>

            {/* Bottom Modal Bar */}
            <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400 shrink-0">
              Gunakan roda mouse atau scrollbar vertikal untuk melihat dokumen lengkap. Tekan <b>Esc</b> atau klik tombol silang (X) untuk keluar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
