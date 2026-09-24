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
  Building2,
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
  buildJilidCoverOnlyPDF,
  buildIdentitasSekolahOnlyPDF,
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
  formatNamaSekolahFooter,
  formatLokasiTitimangsa,
  formatKabupatenKota,
  formatTanggalIndonesia,
  formatSemesterTerbilang,
  formatAlamatBaris2
} from '@/lib/pdfGenerator';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { hitungNilaiMapel } from '@/lib/penilaianUtils';

type DocumentType = 'jilid' | 'identitas-sekolah' | 'identitas-murid' | 'biodata' | 'rapor' | 'buku-induk' | 'pindah' | 'semua';

export default function CetakRapor() {
  const { state } = useAppStore();
  const { sekolah, siswa, nilai, tujuanPembelajaran, mapel, ekstrakurikuler, nilaiEkskul, customDeskripsiMapel, projek, customDeskripsiKokurikuler } = state;
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
    'identitas-sekolah',
    'identitas-murid',
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
      case 'jilid': return 'Jilid (Cover)';
      case 'identitas-sekolah': return 'Identitas Sekolah';
      case 'identitas-murid':
      case 'biodata': return 'Identitas Murid';
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
        buildJilidCoverOnlyPDF(doc, sekolah, student, paperSize, false, pdfFont);
        break;
      case 'identitas-sekolah':
        buildIdentitasSekolahOnlyPDF(doc, sekolah, student, paperSize, false, pdfFont);
        break;
      case 'identitas-murid':
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
          pdfFont,
          projek,
          customDeskripsiKokurikuler
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

    // Halaman 1: Cover Luar (Jilid Sampul)
    const renderJilidCover = () => {
      const nisnText = currentStudent.nisn?.trim() || '';
      const nisText = currentStudent.nis?.trim() || '';
      let combinedNis = '-';
      if (nisnText && nisText) {
        combinedNis = `${nisnText} / ${nisText}`;
      } else if (nisnText) {
        combinedNis = nisnText;
      } else if (nisText) {
        combinedNis = nisText;
      }

      const namaUpper = (currentStudent.nama || '').trim().toUpperCase() || '-';
      const namaLen = namaUpper.length;
      const namaFontSizeClass = namaLen > 36 ? 'text-[11px]' : namaLen > 28 ? 'text-xs' : namaLen > 20 ? 'text-sm' : 'text-base sm:text-[17px]';
      const nisLen = combinedNis.length;
      const nisFontSizeClass = nisLen > 26 ? 'text-xs' : 'text-sm sm:text-[16px]';

      return (
        <div 
          className="p-10 flex flex-col justify-between items-center text-center bg-white shadow-md rounded-sm border border-slate-200"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          {/* Logo Tut Wuri Handayani / Sekolah */}
          <div className="space-y-4 pt-6 flex flex-col items-center">
            <div className="w-24 h-24 mb-1 flex items-center justify-center overflow-hidden">
              {(sekolah.logo || sekolah.logoKiri || sekolah.logoKanan) ? (
                <img 
                  src={sekolah.logo || sekolah.logoKiri || sekolah.logoKanan} 
                  alt="Logo" 
                  style={{
                    transform: `translate(${sekolah.logoOffsetX || 0}px, ${sekolah.logoOffsetY || 0}px) rotate(${sekolah.logoRotation || 0}deg) scale(${(sekolah.logoScale || 100) / 100})`,
                    transformOrigin: 'center center'
                  }}
                  className="max-h-full max-w-full object-contain transition-transform" 
                />
              ) : (
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                  alt="Logo Tut Wuri Handayani" 
                  className="w-20 h-20 object-contain"
                />
              )}
            </div>

            <div className="space-y-1 text-black font-extrabold uppercase">
              <h1 className="text-xl tracking-wider">RAPOR</h1>
              <h2 className="text-base tracking-widest">PESERTA DIDIK</h2>
              <h3 className="text-base tracking-widest">SEKOLAH DASAR</h3>
            </div>
          </div>

          {/* Kotak Identitas Nama Peserta Didik & NISN/NIS (Lebar Ramping, Font 15pt & Box 13mm) */}
          <div className="w-full max-w-[320px] sm:max-w-[340px] space-y-4 my-6 mx-auto">
            <div className="space-y-1 text-center">
              <p className="text-xs text-black font-normal">Nama Peserta Didik:</p>
              <div className={`w-full border border-black min-h-[46px] py-2 px-2.5 bg-white flex items-center justify-center text-center font-bold text-black uppercase tracking-wide leading-tight truncate ${namaFontSizeClass}`}>
                <span className="truncate w-full">{namaUpper}</span>
              </div>
            </div>

            <div className="space-y-1 text-center">
              <p className="text-xs text-black font-normal">NISN/NIS:</p>
              <div className={`w-full border border-black min-h-[46px] py-2 px-2.5 bg-white flex items-center justify-center text-center font-bold text-black font-mono leading-tight truncate ${nisFontSizeClass}`}>
                <span className="truncate w-full">{combinedNis}</span>
              </div>
            </div>
          </div>

          {/* Footer Resmi Kementerian (13pt, Jarak Margin Bawah Proporsional) */}
          <div className="space-y-1 text-xs sm:text-[13px] md:text-[13px] uppercase font-extrabold text-black pb-6 sm:pb-8 leading-relaxed">
            <p>KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</p>
            <p>REPUBLIK INDONESIA</p>
          </div>
        </div>
      );
    };

    // Halaman 2: Identitas Satuan Pendidikan (Sekolah)
    const renderIdentitasSekolah = () => {
      const nssVal = sekolah.nss ? (sekolah.nis ? `${sekolah.nss}/${sekolah.nis}` : `${sekolah.nss}/`) : (sekolah.nis ? `/${sekolah.nis}` : '');
      const kabJenis = (sekolah.kabupatenKotaJenis || '').toLowerCase();
      const kabLabel = kabJenis === 'kota' ? 'Kota' : kabJenis === 'kabupaten' ? 'Kabupaten' : 'Kabupaten/Kota';
      const kabClean = (sekolah.kabupatenKotaNama || '').replace(/^kabupaten\s+/i, '').replace(/^kab\.\s+/i, '').replace(/^kota\s+/i, '').trim() || 'Pandeglang';
      
      const desaJenis = (sekolah.desaKelurahanJenis || '').toLowerCase();
      const desaLabel = desaJenis === 'kelurahan' ? 'Kelurahan' : desaJenis === 'desa' ? 'Desa' : 'Desa/Kelurahan';

      const rows: { label: string; value: string; isBoldVal?: boolean }[] = [
        { label: 'Nama Sekolah', value: (sekolah.nama || '').toUpperCase(), isBoldVal: true },
        { label: 'NPSN', value: sekolah.npsn || '' },
        { label: 'NSS/NIS', value: nssVal },
        { label: 'Alamat Sekolah', value: sekolah.alamat || '' },
        { label: 'Kode Pos', value: sekolah.kodePos || '' },
        { label: desaLabel, value: sekolah.desaKelurahanNama || '' },
        { label: 'Kecamatan', value: sekolah.kecamatan || '' },
        { label: kabLabel, value: kabClean },
        { label: 'Provinsi', value: sekolah.provinsi || '' },
        { label: 'Website', value: sekolah.website || '' },
        { label: 'E-Mail', value: sekolah.email || '' },
      ];

      return (
        <div 
          className="p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed flex flex-col justify-start"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          {/* Header 3 Baris Rata Tengah */}
          <div className="text-center font-bold text-black uppercase space-y-1 mb-10 pt-4">
            <h1 className="text-lg tracking-wider">RAPOR</h1>
            <h2 className="text-base tracking-widest">PESERTA DIDIK</h2>
            <h3 className="text-base tracking-widest">SEKOLAH DASAR (SD)</h3>
          </div>

          <div className="w-full max-w-2xl mx-auto space-y-3 px-4">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center text-black text-sm sm:text-[14px]">
                <div className="w-44 shrink-0 font-normal">
                  {row.label}
                </div>
                <div className="w-4 text-center shrink-0">:</div>
                <div className="flex-1 min-w-0 pb-1 border-b border-slate-300">
                  <span className={`block truncate ${row.isBoldVal ? 'font-bold uppercase' : 'font-normal'}`}>
                    {row.value || '\u00A0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Halaman 3: Identitas Diri Peserta Didik (Biodata Murid)
    const renderBiodataMurid = () => {
      const formatAlamatOrtu = (std: typeof currentStudent) => {
        const parts: string[] = [];
        if (std.jalanOrtu) parts.push(std.jalanOrtu);
        if (std.desaKelurahanOrtu) parts.push(`Desa/Kel. ${std.desaKelurahanOrtu}`);
        if (std.kecamatanOrtu) parts.push(`Kec. ${std.kecamatanOrtu}`);
        if (std.kabupatenKotaOrtu) {
          const kab = std.kabupatenKotaOrtu.trim();
          if (/^kab/i.test(kab) || /^kota/i.test(kab)) {
            parts.push(kab);
          } else {
            parts.push(`Kab./Kota ${kab}`);
          }
        }
        if (std.provinsiOrtu) parts.push(`Prov. ${std.provinsiOrtu}`);
        if (parts.length > 0) return parts.join(', ');
        return std.alamat || '-';
      };

      const tglLahirFormatted = currentStudent.tanggalLahir
        ? (formatTanggalIndonesia(currentStudent.tanggalLahir) || currentStudent.tanggalLahir)
        : '-';
      const ttl = currentStudent.tempatLahir
        ? (tglLahirFormatted !== '-' ? `${currentStudent.tempatLahir}, ${tglLahirFormatted}` : currentStudent.tempatLahir)
        : tglLahirFormatted;

      const nisNisnStr = currentStudent.nis && currentStudent.nisn
        ? `${currentStudent.nis} / ${currentStudent.nisn}`
        : currentStudent.nisn || currentStudent.nis || '-';

      interface BiodataRowItem {
        no?: string;
        subNo?: string;
        label: string;
        value?: string;
        isHeader?: boolean;
        isBoldVal?: boolean;
      }

      const kabJenis = (sekolah.kabupatenKotaJenis || '').toLowerCase();
      const kabLabel = kabJenis === 'kota' ? 'Kota' : kabJenis === 'kabupaten' ? 'Kabupaten' : 'Kabupaten/Kota';

      const desaJenis = (sekolah.desaKelurahanJenis || '').toLowerCase();
      const desaLabel = desaJenis === 'kelurahan' ? 'Kelurahan' : desaJenis === 'desa' ? 'Desa' : 'Desa/Kelurahan';

      const bioRows: BiodataRowItem[] = [
        { no: '1.', label: 'Nama Peserta Didik', value: (currentStudent.nama || '-').toUpperCase(), isBoldVal: true },
        { no: '2.', label: 'Nomor Induk/NISN', value: nisNisnStr },
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: ttl },
        { no: '4.', label: 'Jenis Kelamin', value: currentStudent.jk === 'L' || currentStudent.jk === 'Laki-Laki' ? 'Laki-laki' : (currentStudent.jk ? 'Perempuan' : '-') },
        { no: '5.', label: 'Agama', value: currentStudent.agama || 'Islam' },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: currentStudent.pendidikanSebelumnya || '-' },
        { no: '7.', label: 'Alamat Peserta Didik', value: currentStudent.alamat || '-' },
        { no: '8.', label: 'Nama Orang Tua', isHeader: true },
        { subNo: 'a.', label: 'Ayah', value: currentStudent.namaAyah || '-' },
        { subNo: 'b.', label: 'Ibu', value: currentStudent.namaIbu || '-' },
        { no: '9.', label: 'Pekerjaan Orang Tua', isHeader: true },
        { subNo: 'a.', label: 'Ayah', value: currentStudent.pekerjaanAyah || '-' },
        { subNo: 'b.', label: 'Ibu', value: currentStudent.pekerjaanIbu || '-' },
        { no: '10.', label: 'Alamat Orang Tua', isHeader: true },
        { subNo: 'a.', label: 'Jalan', value: currentStudent.jalanOrtu || currentStudent.alamat || '-' },
        { subNo: 'b.', label: desaLabel, value: currentStudent.desaKelurahanOrtu || sekolah.desaKelurahanNama || '-' },
        { subNo: 'c.', label: 'Kecamatan', value: currentStudent.kecamatanOrtu || sekolah.kecamatan || '-' },
        { subNo: 'd.', label: kabLabel, value: currentStudent.kabupatenKotaOrtu || sekolah.kabupatenKotaNama || '-' },
        { subNo: 'e.', label: 'Provinsi', value: currentStudent.provinsiOrtu || sekolah.provinsi || '-' },
        { no: '11.', label: 'Wali Peserta Didik', isHeader: true },
        { subNo: 'a.', label: 'Nama', value: currentStudent.namaWali || '-' },
        { subNo: 'b.', label: 'Pekerjaan', value: currentStudent.pekerjaanWali || '-' },
        { subNo: 'c.', label: 'Alamat', value: currentStudent.alamatWali || '-' },
      ];

      const lokasiStrBiodata = formatLokasiTitimangsa(sekolah);
      const tanggalBiodataFormatted = formatTanggalIndonesia(sekolah.tanggalBiodata || sekolah.tanggalRapor);
      const titimangsaBiodataStr = tanggalBiodataFormatted ? `${lokasiStrBiodata}, ${tanggalBiodataFormatted}` : `${lokasiStrBiodata}, ............................. 202...`;

      return (
        <div 
          className="p-8 sm:p-10 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-normal flex flex-col justify-between"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div>
            {/* Judul Atas 1 Baris Rata Tengah */}
            <div className="text-center mb-7 pt-1">
              <h1 className="font-bold text-base sm:text-[17px] tracking-wider text-black uppercase">IDENTITAS PESERTA DIDIK</h1>
            </div>

            {/* Form Isian Biodata */}
            <div className="w-full space-y-1 sm:space-y-1.5 px-1 text-[11pt]">
              {bioRows.map((row, idx) => {
                if (row.isHeader) {
                  return (
                    <div key={idx} className="flex items-center text-black font-normal">
                      <div className="w-7 shrink-0">{row.no}</div>
                      <div>{row.label}</div>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="flex items-center text-black">
                    <div className="w-7 shrink-0 font-normal">{row.no || ''}</div>
                    <div className="w-56 sm:w-64 shrink-0 font-normal flex items-center">
                      {row.subNo ? (
                        <>
                          <span className="w-6 shrink-0">{row.subNo}</span>
                          <span>{row.label}</span>
                        </>
                      ) : (
                        <span>{row.label}</span>
                      )}
                    </div>
                    <div className="w-4 text-center shrink-0 font-normal">:</div>
                    <div className="flex-1 min-w-0 pb-0.5 border-b border-slate-300">
                      <span className={`block truncate ${row.isBoldVal ? 'font-bold text-black' : 'font-normal'}`}>
                        {row.value || '\u00A0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Pas Foto & Tanda Tangan Kepala Sekolah */}
          <div className="mt-6 pt-2 flex justify-end items-end gap-12 sm:gap-16 px-2 text-[11pt]">
            <div className="w-[26mm] h-[35mm] shrink-0">
              {currentStudent.fotoBase64 ? (
                <img src={currentStudent.fotoBase64} alt="Pas Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full border border-slate-400 rounded-sm flex flex-col items-center justify-center text-center p-1 text-slate-400 bg-slate-50/50">
                  <div className="text-[10px] font-medium leading-tight text-slate-400">
                    Pas Foto<br/>3 x 4 cm
                  </div>
                </div>
              )}
            </div>

            <div className="text-left text-[11pt] min-w-[210px] h-[35mm] flex flex-col justify-between">
              <div>
                <p className="text-black leading-tight">{titimangsaBiodataStr}</p>
                <p className="text-black leading-tight mt-1">Kepala Sekolah,</p>
              </div>
              <div className="flex-1 flex items-center justify-start relative my-0.5">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek ? (
                  <img 
                    src={sekolah.ttdKepsek} 
                    alt="TTD" 
                    className="h-12 object-contain" 
                    style={{
                      transform: `scale(${(sekolah.ttdKepsekScale || 100) / 100}) rotate(${sekolah.ttdKepsekRotation || 0}deg) translate(${sekolah.ttdKepsekOffsetX || 0}px, ${sekolah.ttdKepsekOffsetY || 0}px)`
                    }}
                  />
                ) : (
                  <div className="h-10" />
                )}
              </div>
              <div>
                <p className="font-bold text-[11pt] text-black leading-tight">{sekolah.kepsek || '................................'}</p>
                <p className="text-[11pt] text-black leading-tight mt-1">NIP. {sekolah.nipKepsek || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (type === 'jilid') {
      return renderJilidCover();
    }

    if (type === 'identitas-sekolah') {
      return renderIdentitasSekolah();
    }

    if (type === 'identitas-murid' || type === 'biodata') {
      return renderBiodataMurid();
    }

    if (type === 'rapor') {
      const alamatBaris1 = sekolah.alamat || '-';
      const alamatBaris2 = formatAlamatBaris2(sekolah);

      let kokurikulerText = '';
      if (projek && projek.length > 0) {
        kokurikulerText = projek.map(p => {
          const customK = customDeskripsiKokurikuler?.[currentStudent.id]?.[p.id];
          const desc = customK || p.deskripsi || 'Berpartisipasi aktif dalam kegiatan projek kokurikuler dengan menunjukkan penguatan karakter profil pelajar yang positif.';
          return `${p.tema ? `Projek: ${p.tema}. ` : ''}${desc}`;
        }).join('\n\n');
      } else {
        kokurikulerText = 'Berpartisipasi aktif dalam kegiatan projek kokurikuler penguatan profil pelajar dengan menunjukkan kepedulian, kreativitas, dan kerja sama yang baik.';
      }

      const lokasiStr = formatLokasiTitimangsa(sekolah);
      const tanggalStr = formatTanggalIndonesia(sekolah.tanggalRapor);
      const titimangsaStr = tanggalStr ? `${lokasiStr}, ${tanggalStr}` : `${lokasiStr}, ............................. 202...`;

      return (
        <div 
          className="p-8 border border-slate-200 bg-white shadow-md rounded-sm text-[11pt] leading-relaxed space-y-3.5"
          style={{ minHeight: minPageHeight, fontFamily: fontFamilyStyle }}
        >
          <div className="text-center mb-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">LAPORAN HASIL BELAJAR (RAPOR)</h2>
          </div>

          {/* Grid Identitas Rapor (Header 6 Kolom Sejajar - Titik Dua Lurus Sempurna, Blok Kanan Menjorok Kanan Penuh, Spasi Rapat, Shrink to Fit) */}
          <div className="grid grid-cols-[135px_16px_1fr_95px_16px_110px] gap-y-0.5 text-[11px] pb-1 items-baseline">
            <span className="font-bold text-slate-900 whitespace-nowrap">Nama Peserta Didik</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className={`font-bold uppercase text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis pr-2 ${
              (currentStudent.nama || '').length > 32 ? 'text-[9.5px]' : (currentStudent.nama || '').length > 24 ? 'text-[10px]' : 'text-[11px]'
            }`}>
              {currentStudent.nama}
            </span>
            <span className="font-bold text-slate-900 whitespace-nowrap">Kelas</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className="font-semibold text-slate-900 whitespace-nowrap">{formatKelasRombel(sekolah)}</span>

            <span className="font-bold text-slate-900 whitespace-nowrap">NISN/NIS</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className="font-mono font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis pr-2">{currentStudent.nisn || '-'} / {currentStudent.nis || '-'}</span>
            <span className="font-bold text-slate-900 whitespace-nowrap">Fase</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className="font-semibold text-slate-900 whitespace-nowrap">{sekolah.fase || 'A'}</span>

            <span className="font-bold text-slate-900 whitespace-nowrap">Nama Sekolah</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className={`font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis pr-2 ${
              (sekolah.nama || '').length > 30 ? 'text-[9.5px]' : (sekolah.nama || '').length > 22 ? 'text-[10px]' : 'text-[11px]'
            }`}>
              {sekolah.nama || '-'}
            </span>
            <span className="font-bold text-slate-900 whitespace-nowrap">Semester</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className="font-semibold text-slate-900 whitespace-nowrap">{formatSemesterTerbilang(sekolah.semester)}</span>

            <span className="font-bold text-slate-900 whitespace-nowrap">Alamat Sekolah</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className={`font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis pr-2 ${
              alamatBaris1.length > 35 ? 'text-[9.5px]' : alamatBaris1.length > 25 ? 'text-[10px]' : 'text-[11px]'
            }`}>
              {alamatBaris1}
            </span>
            <span className="font-bold text-slate-900 whitespace-nowrap">Tahun Ajaran</span>
            <span className="text-center font-bold text-slate-900">:</span>
            <span className="font-semibold text-slate-900 whitespace-nowrap">{sekolah.tahunAjaran || '2025/2026'}</span>

            {alamatBaris2 && (
              <>
                <span></span>
                <span></span>
                <span className={`col-span-4 font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis leading-tight pt-0.5 ${
                  alamatBaris2.length > 70 ? 'text-[9px]' : alamatBaris2.length > 55 ? 'text-[9.5px]' : 'text-[10.5px]'
                }`}>
                  {alamatBaris2}
                </span>
              </>
            )}
          </div>

          {/* 1. Tabel Mata Pelajaran */}
          <div>
            <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 text-center font-bold border-b border-slate-900">
                  <th className="border border-slate-900 px-2 py-1.5 w-8">No</th>
                  <th className="border border-slate-900 px-3 py-1.5 w-44 text-left">Mata Pelajaran</th>
                  {!isTanpaAngka && <th className="border border-slate-900 px-2 py-1.5 w-16 leading-tight">Nilai<br/>Akhir</th>}
                  <th className="border border-slate-900 px-3 py-1.5 text-center">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {displayedMapel.map((m, idx) => {
                  const { finalScore, deskripsiTertinggi, deskripsiTerendah } = getNilaiDanDeskripsi(currentStudent.id, m.id);
                  const customText = customDeskripsiMapel?.[currentStudent.id]?.[m.id];
                  const fullDeskripsi = customText && customText.trim() ? customText.trim() : ([deskripsiTertinggi, deskripsiTerendah].filter(Boolean).join(' ') || 'Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran.');
                  return (
                    <tr key={m.id} className="border-b border-slate-900">
                      <td className="border border-slate-900 px-2 py-1.5 text-center font-mono align-middle">{idx + 1}</td>
                      <td className="border border-slate-900 px-3 py-1.5 font-bold align-middle">{m.nama}</td>
                      {!isTanpaAngka && (
                        <td className="border border-slate-900 px-2 py-1.5 text-center font-mono font-bold text-slate-900 align-middle">
                          {finalScore !== null ? finalScore : '-'}
                        </td>
                      )}
                      <td className="border border-slate-900 px-3 py-1.5 text-slate-900 text-[10.5px] text-justify leading-relaxed align-middle">
                        {fullDeskripsi}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Kokurikuler */}
          <div>
            <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-900 px-3 py-1.5 text-center">Kokurikuler</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 px-3 py-2 text-slate-900 text-[10.5px] text-justify leading-relaxed">
                    {kokurikulerText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Ekstrakurikuler */}
          <div>
            {(() => {
              const activeEkskuls = ekstrakurikuler ? ekstrakurikuler.filter(e => e.tampilRapor !== false) : [];
              const isSingle = activeEkskuls.length <= 1;
              return (
                <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                      {!isSingle && <th className="border border-slate-900 px-2 py-1 w-8 text-center">No</th>}
                      <th className="border border-slate-900 px-3 py-1 w-48">Ekstrakurikuler</th>
                      <th className="border border-slate-900 px-3 py-1">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEkskuls.length > 0 ? (
                      activeEkskuls.map((e, idx) => {
                        const ne = nilaiEkskul?.[currentStudent.id]?.[e.id];
                        return (
                          <tr key={e.id} className="border-b border-slate-900">
                            {!isSingle && (
                              <td className="border border-slate-900 px-2 py-1 text-center font-mono align-middle">{idx + 1}</td>
                            )}
                            <td className="border border-slate-900 px-3 py-1 font-bold align-middle">{e.nama}</td>
                            <td className="border border-slate-900 px-3 py-1 text-[10.5px] text-justify align-middle">{ne?.deskripsi || `Aktif dan berpartisipasi baik dalam kegiatan ${e.nama}.`}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isSingle ? 2 : 3} className="border border-slate-900 px-3 py-1 text-center text-slate-400 italic">- Tidak ada data ekstrakurikuler -</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* 4. Kehadiran & Catatan Wali Kelas (2 Kotak Terpisah Berdampingan dengan Celah) */}
          <div className="grid grid-cols-[210px_1fr] gap-3 text-[11px]">
            {/* Kotak Kiri: Ketidakhadiran */}
            <div className="border border-slate-900 flex flex-col bg-white">
              <div className="bg-slate-100 text-slate-900 font-bold px-3 py-1.5 text-center border-b border-slate-900">
                Ketidakhadiran
              </div>
              <div className="flex-1 flex flex-col divide-y divide-slate-300">
                <div className="flex items-center justify-between px-3 py-1.5 font-semibold">
                  <span className="font-bold text-slate-900">Sakit</span>
                  <span className="font-mono text-slate-900">: 0 hari</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 font-semibold">
                  <span className="font-bold text-slate-900">Izin</span>
                  <span className="font-mono text-slate-900">: 0 hari</span>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 font-semibold">
                  <span className="font-bold text-slate-900">Tanpa Keterangan</span>
                  <span className="font-mono text-slate-900">: 0 hari</span>
                </div>
              </div>
            </div>

            {/* Kotak Kanan: Catatan Wali Kelas (Reguler, Auto Fit / Shrink to Fit) */}
            {(() => {
              const catatanText = 'Pertahankan semangat belajarmu, tingkatkan terus prestasi dan akhlak mulia dalam segala kegiatan pembelajaran.';
              const len = catatanText.length;
              const fontSizeClass = len > 260 ? 'text-[8px] leading-snug' : len > 190 ? 'text-[8.5px] leading-tight' : len > 130 ? 'text-[9.5px] leading-normal' : 'text-[10.5px] leading-relaxed';
              return (
                <div className="border border-slate-900 flex flex-col bg-white">
                  <div className="bg-slate-100 text-slate-900 font-bold px-3 py-1.5 text-center border-b border-slate-900">
                    Catatan Wali Kelas
                  </div>
                  <div className={`p-3 text-slate-900 font-normal text-justify flex-1 flex items-center overflow-hidden ${fontSizeClass}`}>
                    {catatanText}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 5. Tanggapan Orang Tua/ Wali Murid */}
          <div>
            <table className="w-full border-collapse border border-slate-900 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-900 px-3 py-1.5 text-center">Tanggapan Orang Tua/ Wali Murid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 p-4 h-24 text-slate-400 italic">
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. Titimangsa & Tanda Tangan Segitiga Baku (Transparan, Proporsional, In Front of Text) */}
          <div className="pt-2 space-y-4">
            <div className="grid grid-cols-2 text-center text-xs">
              <div>
                <p className="font-semibold text-slate-900">Orang Tua/ Wali,</p>
                <div className="h-16" />
                <p className="font-bold border-b border-dotted border-slate-900 inline-block px-6 pb-0.5 text-slate-900">
                  {currentStudent.namaAyah || currentStudent.namaIbu || '.......................................'}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1 font-normal text-slate-900">
                  {titimangsaStr}
                </p>
                <p className="font-semibold text-slate-900">Guru Kelas,</p>
                <div className="relative h-16 flex items-center justify-center">
                  {sekolah.useDigitalSignature && sekolah.ttdWaliKelas && (
                    <img 
                      src={sekolah.ttdWaliKelas} 
                      alt="TTD Guru Kelas" 
                      style={{
                        transform: `translate(${sekolah.ttdWaliKelasOffsetX || 0}px, ${sekolah.ttdWaliKelasOffsetY || 0}px) rotate(${sekolah.ttdWaliKelasRotation || 0}deg) scale(${(sekolah.ttdWaliKelasScale || 100) / 100})`,
                        transformOrigin: 'center center'
                      }}
                      className="absolute max-h-16 max-w-[130px] object-contain mix-blend-multiply pointer-events-none z-10 transition-transform" 
                    />
                  )}
                </div>
                <p className="font-bold uppercase underline text-slate-900">{sekolah.waliKelas || '.......................................'}</p>
                <p className="text-[10px] font-mono text-slate-700">NIP. {sekolah.nipWaliKelas || '-'}</p>
              </div>
            </div>

            <div className="text-center text-xs">
              <p className="font-semibold text-slate-900">Mengetahui:</p>
              <p className="font-semibold text-slate-900">Kepala Sekolah,</p>
              <div className="relative h-16 flex items-center justify-center">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img 
                    src={sekolah.ttdKepsek} 
                    alt="TTD Kepala Sekolah" 
                    style={{
                      transform: `translate(${sekolah.ttdKepsekOffsetX || 0}px, ${sekolah.ttdKepsekOffsetY || 0}px) rotate(${sekolah.ttdKepsekRotation || 0}deg) scale(${(sekolah.ttdKepsekScale || 100) / 100})`,
                      transformOrigin: 'center center'
                    }}
                    className="absolute max-h-16 max-w-[140px] object-contain mix-blend-multiply pointer-events-none z-10 transition-transform" 
                  />
                )}
              </div>
              <p className="font-bold uppercase underline text-slate-900">{sekolah.kepsek || '.......................................'}</p>
              <p className="text-[10px] font-mono text-slate-700">NIP. {sekolah.nipKepsek || '-'}</p>
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
                      <td className="border border-slate-400 p-2 text-[10.5px] text-slate-700 text-justify">{deskripsiTertinggi || 'Mengikuti pembelajaran dengan baik.'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-6 flex justify-end">
            <div className="text-center w-64 space-y-1 text-xs">
              <p>{formatLokasiTitimangsa(sekolah)}, {formatTanggalIndonesia(sekolah.tanggalRapor) || '20 Desember 2024'}</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="relative h-14 flex items-center justify-center">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img 
                    src={sekolah.ttdKepsek} 
                    alt="TTD Kepala Sekolah" 
                    style={{
                      transform: `translate(${sekolah.ttdKepsekOffsetX || 0}px, ${sekolah.ttdKepsekOffsetY || 0}px) rotate(${sekolah.ttdKepsekRotation || 0}deg) scale(${(sekolah.ttdKepsekScale || 100) / 100})`,
                      transformOrigin: 'center center'
                    }}
                    className="absolute max-h-16 max-w-[140px] object-contain mix-blend-multiply pointer-events-none z-10 transition-transform" 
                  />
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
              <p>{formatLokasiTitimangsa(sekolah)}, ............................. 202...</p>
              <p className="font-bold">Kepala {sekolah.nama}</p>
              <div className="relative h-14 flex items-center justify-center">
                {sekolah.useDigitalSignature && sekolah.ttdKepsek && (
                  <img 
                    src={sekolah.ttdKepsek} 
                    alt="TTD Kepala Sekolah" 
                    style={{
                      transform: `translate(${sekolah.ttdKepsekOffsetX || 0}px, ${sekolah.ttdKepsekOffsetY || 0}px) rotate(${sekolah.ttdKepsekRotation || 0}deg) scale(${(sekolah.ttdKepsekScale || 100) / 100})`,
                      transformOrigin: 'center center'
                    }}
                    className="absolute max-h-16 max-w-[140px] object-contain mix-blend-multiply pointer-events-none z-10 transition-transform" 
                  />
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
              <span className="inline-block mb-2 bg-blue-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                1. Jilid (Sampul Depan)
              </span>
              {renderJilidCover()}
            </div>
          )}
          {selectedBundleDocs.includes('identitas-sekolah') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                2. Identitas Satuan Pendidikan (Sekolah)
              </span>
              {renderIdentitasSekolah()}
            </div>
          )}
          {(selectedBundleDocs.includes('identitas-murid') || selectedBundleDocs.includes('biodata')) && (
            <div className="relative">
              <span className="inline-block mb-2 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                3. Keterangan Tentang Diri Peserta Didik (Biodata)
              </span>
              {renderBiodataMurid()}
            </div>
          )}
          {selectedBundleDocs.includes('rapor') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                4. Laporan Hasil Belajar (Rapor)
              </span>
              {renderVisualPreview('rapor', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('buku-induk') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                5. Lampiran Buku Induk Siswa
              </span>
              {renderVisualPreview('buku-induk', currentStudent)}
            </div>
          )}
          {selectedBundleDocs.includes('pindah') && (
            <div className="relative">
              <span className="inline-block mb-2 bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                6. Surat Keterangan Pindah Sekolah
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
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50 text-xs"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Unduh Bundel ({selectedIds.length})</span>
              </button>
            </Tooltip>

            {/* BULK PER KOLOM */}
            <button
              onClick={() => handleBulkColumnDownload('jilid')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <Book className="w-3 h-3" />
              <span>Jilid</span>
            </button>
            <button
              onClick={() => handleBulkColumnDownload('identitas-sekolah')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <Building2 className="w-3 h-3" />
              <span>Id. Sekolah</span>
            </button>
            <button
              onClick={() => handleBulkColumnDownload('identitas-murid')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <Contact className="w-3 h-3" />
              <span>Id. Murid</span>
            </button>
            <button
              onClick={() => handleBulkColumnDownload('rapor')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <Download className="w-3 h-3" />
              <span>Rapor</span>
            </button>
            <button
              onClick={() => handleBulkColumnDownload('buku-induk')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <Archive className="w-3 h-3" />
              <span>Buku Induk</span>
            </button>
            <button
              onClick={() => handleBulkColumnDownload('pindah')}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm disabled:opacity-50 text-xs"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Pindah</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer text-xs"
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
                <th className="px-2.5 py-3 w-8 text-center text-[10px] uppercase tracking-wider">
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
                <th className="px-2 py-3 w-9 text-center text-[10px] uppercase tracking-wider">No</th>
                <th className="px-3 py-3 min-w-[160px] text-left text-[10px] uppercase tracking-wider">Nama Peserta Didik</th>
                <th className="px-3 py-3 w-24 text-left text-[10px] uppercase tracking-wider">NISN</th>
                
                {/* Jilid (Sampul) + Tombol Bulk Header */}
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>Jilid</span>
                    <Tooltip content="Unduh massal PDF Jilid (Sampul Depan) untuk seluruh murid" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('jilid')}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Identitas Satuan Pendidikan (Sekolah) + Tombol Bulk Header */}
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>Id. Sekolah</span>
                    <Tooltip content="Unduh massal PDF Identitas Satuan Pendidikan untuk seluruh murid" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('identitas-sekolah')}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Identitas Murid (Biodata) + Tombol Bulk Header */}
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>Id. Murid</span>
                    <Tooltip content="Unduh massal PDF Identitas Murid (Biodata) untuk seluruh murid" position="bottom">
                      <button
                        onClick={() => handleBulkColumnDownload('identitas-murid')}
                        className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </th>

                {/* Rapor + Tombol Bulk Header */}
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
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
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>Buku Induk</span>
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
                <th className="px-2 py-3 text-center text-[10px] uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">
                    <span>Pindah</span>
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
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider bg-indigo-50/70 text-indigo-900 border-l border-indigo-100">
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
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
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
                    <td className="px-2.5 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleSelect(student.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                      />
                    </td>

                    {/* No */}
                    <td className="px-2 py-2 text-center font-mono text-[11px] text-slate-400">{i + 1}</td>

                    {/* Nama */}
                    <td className="px-3 py-2 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[160px] sm:max-w-none">{student.nama}</span>
                        {student.jk && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${student.jk === 'L' || student.jk === 'Laki-Laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                            {student.jk === 'L' || student.jk === 'Laki-Laki' ? 'L' : 'P'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* NISN */}
                    <td className="px-3 py-2 font-mono text-slate-600 font-semibold">{student.nisn || '-'}</td>

                    {/* Jilid (Sampul Depan) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Jilid (Sampul) - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'jilid', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Jilid (Sampul) - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('jilid', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Identitas Satuan Pendidikan (Sekolah) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Identitas Satuan Pendidikan - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'identitas-sekolah', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Identitas Satuan Pendidikan - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('identitas-sekolah', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Identitas Murid (Biodata) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Identitas Murid (Biodata) - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'identitas-murid', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Identitas Murid (Biodata) - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('identitas-murid', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Rapor */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Rapor - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'rapor', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Rapor - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('rapor', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Lampiran Buku Induk */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Lampiran Buku Induk - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'buku-induk', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Lampiran Buku Induk - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('buku-induk', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* Keterangan Pindah */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content={`Lihat Pratinjau Keterangan Pindah - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'pindah', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content={`Unduh PDF Keterangan Pindah - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePdf('pindah', student)}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>

                    {/* BULK HORIZONTAL ACTION: BUNDEL DOKUMEN PER MURID */}
                    <td className="px-3 py-2 text-center bg-indigo-50/30 border-l border-indigo-100">
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip content={`Lihat Pratinjau Bundel Dokumen - ${student.nama}`} position="top">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ type: 'semua', siswa: student })}
                            className="w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300 transition duration-150 cursor-pointer hover:scale-105 active:scale-95 shadow-xs font-bold"
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-700">Total Murid: <b>{filteredSiswa.length}</b></span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-600">Ukuran Kertas: <b>{paperSize.toUpperCase()}</b></span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-600">Font: <b>{pdfFont === 'arial' ? 'Arial (11pt)' : 'Times New Roman (12pt)'}</b></span>
          </div>

          <p className="text-[11px] text-slate-400">
            Gunakan tombol <DownloadCloud className="w-3 h-3 inline text-slate-500" /> pada header kolom untuk unduh per format dokumen.
          </p>
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
                  { id: 'jilid' as BundleDocType, label: '1. Jilid (Sampul Depan)', desc: 'Cover luar halaman judul laporan rapor' },
                  { id: 'identitas-sekolah' as BundleDocType, label: '2. Identitas Satuan Pendidikan', desc: 'Identitas resmi sekolah / profil satuan pendidikan' },
                  { id: 'identitas-murid' as BundleDocType, label: '3. Identitas Peserta Didik (Biodata)', desc: 'Identitas diri, orang tua/wali, & pas foto' },
                  { id: 'rapor' as BundleDocType, label: '4. Laporan Hasil Belajar (Rapor)', desc: 'Nilai, capaian kompetensi, ekskul & presensi' },
                  { id: 'buku-induk' as BundleDocType, label: '5. Lampiran Buku Induk', desc: 'Rekapitulasi nilai & catatan kemajuan belajar' },
                  { id: 'pindah' as BundleDocType, label: '6. Keterangan Pindah Sekolah', desc: 'Format surat mutasi/pindah sekolah' },
                ].map(item => {
                  const isChecked = selectedBundleDocs.includes(item.id) || (item.id === 'identitas-murid' && selectedBundleDocs.includes('biodata' as any));
                  return (
                    <label 
                      key={item.id}
                      onClick={() => toggleBundleDoc(item.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
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
