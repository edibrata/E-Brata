import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sekolah, Siswa, Mapel, NilaiMapelSiswa, TujuanPembelajaran, Ekstrakurikuler, NilaiEkskul } from '@/types';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { hitungNilaiMapel } from '@/lib/penilaianUtils';

export type PaperSize = 'a4' | 'f4';
export type BundleDocType = 'jilid' | 'biodata' | 'rapor' | 'buku-induk' | 'pindah';
export type PdfFontOption = 'arial' | 'times';

export const getFontConfig = (pdfFont: PdfFontOption = 'arial') => {
  if (pdfFont === 'times') {
    return {
      fontName: 'times' as const,
      baseBodySize: 12,
      smallSize: 9.5,
      headerSize: 14,
      subHeaderSize: 11
    };
  }
  return {
    fontName: 'helvetica' as const,
    baseBodySize: 11,
    smallSize: 9.5,
    headerSize: 13,
    subHeaderSize: 10
  };
};

export const getPaperDimensions = (size: PaperSize): { width: number; height: number; format: [number, number] | string } => {
  if (size === 'f4') {
    return { width: 215, height: 330, format: [215, 330] };
  }
  return { width: 210, height: 297, format: 'a4' };
};

// Helper formatting nama sekolah untuk footer: SD uppercase, lainnya propercase
export const formatNamaSekolahFooter = (rawName: string): string => {
  if (!rawName) return 'Satuan Pendidikan';
  const words = rawName.trim().split(/\s+/);
  return words
    .map(w => {
      const upper = w.toUpperCase();
      if (['SD', 'SDN', 'SMP', 'SMPN', 'SMA', 'SMAN', 'SMK', 'SMKN', 'MI', 'MTS', 'MA'].includes(upper)) {
        return upper;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
};

// Helper formatting kelas dan rombel
export const formatKelasRombel = (sekolah: Sekolah): string => {
  const k = (sekolah.kelas || '').trim();
  const r = (sekolah.ruangRombel || '').trim();
  if (!k) return 'Kelas';
  if (r && r.toLowerCase() !== k.toLowerCase()) {
    return `Kelas ${k} ${r}`;
  }
  return `Kelas ${k}`;
};

// Helper filename standar
export const getStandardPdfFilename = (
  jenisDoc: string,
  siswa: Siswa,
  sekolah: Sekolah,
  paperSize: PaperSize = 'a4'
): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}${mm}${dd} ${hh}.${min}.${ss}`;

  const kelasStr = formatKelasRombel(sekolah);
  const smtStr = sekolah.semester ? `Semester ${sekolah.semester}` : 'Semester 1';
  const taStr = (sekolah.tahunAjaran || '2024-2025').replace(/[\/\\]/g, '-');
  const cleanNama = (siswa.nama || 'Murid').trim().replace(/[/\\?%*:|"<>]/g, '');
  const sizeTag = paperSize === 'f4' ? '[F4]' : '[A4]';

  return `E-Rapor Edi Brata ${jenisDoc} ${cleanNama} ${kelasStr} ${smtStr} ${taStr} ${sizeTag} ${timestamp}.pdf`;
};

// Helper menambahkan footer resmi pada Rapor dan Buku Induk (Font 9.5pt, Warna Lembut)
const addDocumentFooter = (
  doc: jsPDF,
  sekolah: Sekolah,
  student: Siswa,
  startPage: number,
  endPage: number,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName } = getFontConfig(pdfFont);
  const totalPagesInDoc = endPage - startPage + 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 10;
  const namaSekolahFormatted = formatNamaSekolahFooter(sekolah.nama || '');

  for (let p = startPage; p <= endPage; p++) {
    doc.setPage(p);
    const currentPageNum = p - startPage + 1;

    // Garis tipis pembatas footer (abu-abu halus)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(9.5);
    // Warna abu-abu netral lembut (tidak seterang font utama di luar footer)
    doc.setTextColor(100, 116, 139);

    // KIRI (Sebelumnya di kanan): [Nama Murid] | NISN
    const leftText = `${student.nama || 'Murid'} | ${student.nisn || '-'}`;
    doc.text(leftText, 15, footerY, { align: 'left' });

    // TENGAH: Tetap (Hal. x dari y)
    doc.text(`Hal. ${currentPageNum} dari ${totalPagesInDoc}`, pageWidth / 2, footerY, { align: 'center' });

    // KANAN (Sebelumnya di kiri): [Nama Sekolah]
    doc.text(namaSekolahFormatted, pageWidth - 15, footerY, { align: 'right' });
  }
};

// 1. GENERATE JILID & COVER PDF
export const buildJilidPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName, baseBodySize, headerSize, subHeaderSize } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize);

  // --- HALAMAN 1: COVER LUAR ---
  // Outer Border Double (Native Vector)
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1.2);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
  doc.setLineWidth(0.4);
  doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

  // Logo Sekolah jika ada
  let y = paperSize === 'f4' ? 45 : 35;
  if (sekolah.logoKiri && sekolah.logoKiri.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.logoKiri, 'PNG', pageWidth / 2 - 15, y, 30, 30);
      y += 38;
    } catch {
      y += 12;
    }
  } else {
    y += 12;
  }

  // Judul Cover Luar
  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize + 3);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN HASIL BELAJAR', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(subHeaderSize + 3);
  doc.text('PESERTA DIDIK', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(headerSize + 1);
  doc.setTextColor(30, 58, 138);
  doc.text((sekolah.nama || 'SEKOLAH DASAR').toUpperCase(), pageWidth / 2, y, { align: 'center' });

  // Kotak Identitas Nama Siswa di Tengah
  y = paperSize === 'f4' ? 155 : 135;
  const boxWidth = 145;
  const boxHeight = 48;
  const boxX = (pageWidth - boxWidth) / 2;

  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.6);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 1);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMA PESERTA DIDIK', pageWidth / 2, y + 11, { align: 'center' });

  doc.setFontSize(headerSize + 1);
  doc.setTextColor(15, 23, 42);
  doc.text((student.nama || '').toUpperCase(), pageWidth / 2, y + 21, { align: 'center' });

  // Garis pemisah dalam box
  doc.setDrawColor(203, 213, 225);
  doc.line(boxX + 15, y + 26, boxX + boxWidth - 15, y + 26);

  doc.setFontSize(baseBodySize);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`NIS: ${student.nis || '-'}`, boxX + 25, y + 38);
  doc.text(`NISN: ${student.nisn || '-'}`, boxX + boxWidth - 25, y + 38, { align: 'right' });

  // Footer Cover
  const footY = paperSize === 'f4' ? 275 : 245;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize);
  doc.setTextColor(51, 65, 85);
  doc.text('KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH', pageWidth / 2, footY, { align: 'center' });
  doc.text('REPUBLIK INDONESIA', pageWidth / 2, footY + 6, { align: 'center' });
  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.text(`${(sekolah.kabupatenKotaNama || 'KABUPATEN/KOTA').toUpperCase()} - ${(sekolah.provinsi || 'PROVINSI').toUpperCase()}`, pageWidth / 2, footY + 12, { align: 'center' });

  // --- HALAMAN 2: IDENTITAS SATUAN PENDIDIKAN ---
  doc.addPage();
  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize + 1);
  doc.setTextColor(15, 23, 42);
  doc.text('IDENTITAS SATUAN PENDIDIKAN', pageWidth / 2, 28, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(30, 32, pageWidth - 30, 32);

  const identitasData = [
    ['Nama Satuan Pendidikan', ':', sekolah.nama || '-'],
    ['NPSN', ':', sekolah.npsn || '-'],
    ['NSS / NIS', ':', sekolah.nss || sekolah.nis || '-'],
    ['Alamat Lengkap', ':', sekolah.alamat || '-'],
    ['Kelurahan / Desa', ':', sekolah.desaKelurahanNama || '-'],
    ['Kecamatan', ':', sekolah.kecamatan || '-'],
    ['Kabupaten / Kota', ':', sekolah.kabupatenKotaNama || '-'],
    ['Provinsi', ':', sekolah.provinsi || '-'],
    ['Kode Pos', ':', sekolah.kodePos || '-'],
    ['Telepon', ':', sekolah.telepon || '-'],
    ['Alamat Email', ':', sekolah.email || '-'],
    ['Situs Web', ':', sekolah.website || '-'],
    ['Nama Kepala Sekolah', ':', sekolah.kepsek || '-'],
    ['NIP Kepala Sekolah', ':', sekolah.nipKepsek || '-']
  ];

  autoTable(doc, {
    startY: 42,
    margin: { left: 25, right: 25 },
    body: identitasData,
    theme: 'plain',
    styles: {
      fontSize: baseBodySize,
      cellPadding: 4,
      textColor: [30, 41, 59],
      font: fontName
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 58 },
      1: { cellWidth: 6 },
      2: { fontStyle: 'normal' }
    }
  });
};

// 2. GENERATE BIODATA MURID PDF
export const buildBiodataPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName, baseBodySize, headerSize, subHeaderSize } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize);
  doc.setTextColor(15, 23, 42);
  doc.text('KETERANGAN TENTANG DIRI PESERTA DIDIK', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(subHeaderSize + 0.5);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('(BIODATA PESERTA DIDIK)', pageWidth / 2, 28, { align: 'center' });

  const bioData = [
    ['1.', 'Nama Lengkap Peserta Didik', ':', (student.nama || '-').toUpperCase()],
    ['2.', 'Nomor Induk Siswa (NIS)', ':', student.nis || '-'],
    ['3.', 'Nomor Induk Siswa Nasional (NISN)', ':', student.nisn || '-'],
    ['4.', 'Tempat, Tanggal Lahir', ':', `${student.tempatLahir || '-'}, ${student.tanggalLahir || '-'}`],
    ['5.', 'Jenis Kelamin', ':', student.jk === 'L' || student.jk === 'Laki-Laki' ? 'Laki-laki' : 'Perempuan'],
    ['6.', 'Agama', ':', student.agama || 'Islam'],
    ['7.', 'Alamat Peserta Didik', ':', student.alamat || '-'],
    ['8.', 'Nama Orang Tua', ':', ''],
    ['', '  a. Ayah', ':', student.namaAyah || '-'],
    ['', '  b. Ibu', ':', student.namaIbu || '-'],
    ['9.', 'Pekerjaan Orang Tua', ':', ''],
    ['', '  a. Ayah', ':', student.pekerjaanAyah || '-'],
    ['', '  b. Ibu', ':', student.pekerjaanIbu || '-'],
    ['10.', 'Alamat Rumah Orang Tua', ':', student.jalanOrtu || student.alamat || '-'],
    ['11.', 'Nama Wali Peserta Didik (jika ada)', ':', student.namaWali || '-'],
    ['12.', 'Pekerjaan Wali Peserta Didik', ':', student.pekerjaanWali || '-'],
    ['13.', 'Alamat Rumah Wali', ':', student.alamatWali || '-']
  ];

  autoTable(doc, {
    startY: 36,
    margin: { left: 20, right: 20 },
    body: bioData,
    theme: 'plain',
    styles: {
      fontSize: baseBodySize,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 8, fontStyle: 'bold' },
      1: { cellWidth: 68, fontStyle: 'bold' },
      2: { cellWidth: 5 },
      3: { fontStyle: 'normal' }
    }
  });

  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 210;

  // Pas Foto Box
  const photoX = 30;
  const photoY = Math.min(lastY + 2, pageHeight - 75);
  const photoW = 28;
  const photoH = 36;

  if (student.fotoBase64 && student.fotoBase64.startsWith('data:image')) {
    try {
      doc.addImage(student.fotoBase64, 'JPEG', photoX, photoY, photoW, photoH);
    } catch {
      doc.setDrawColor(148, 163, 184);
      doc.rect(photoX, photoY, photoW, photoH);
      doc.setFontSize(9);
      doc.text('Pas Foto\n3 x 4 cm', photoX + 14, photoY + 16, { align: 'center' });
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Pas Foto\n3 x 4 cm', photoX + 14, photoY + 16, { align: 'center' });
  }

  // Tanda Tangan Kepala Sekolah
  const ttdX = pageWidth - 80;
  const ttdY = photoY;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize);
  doc.setTextColor(30, 41, 59);
  doc.text(`${sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Kota'}, ${sekolah.tanggalBiodata || sekolah.tanggalRapor || '15 Juli 2024'}`, ttdX, ttdY);
  doc.text(`Kepala ${sekolah.nama || 'Sekolah'}`, ttdX, ttdY + 5);

  if (sekolah.useDigitalSignature && sekolah.ttdKepsek && sekolah.ttdKepsek.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.ttdKepsek, 'PNG', ttdX, ttdY + 8, 30, 18);
    } catch {}
  }

  doc.setFont(fontName, 'bold');
  doc.text((sekolah.kepsek || '........................').toUpperCase(), ttdX, ttdY + 30);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9.5);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, ttdX, ttdY + 35);
};

// 3. GENERATE RAPOR LENGKAP PDF (Font 11pt Arial / 12pt Times, Tanpa Kata "Tercapai:" dan "Perlu Bimbingan:", Footer 9.5pt)
export const buildRaporPDF = (
  doc: jsPDF,
  sekolah: Sekolah,
  student: Siswa,
  mapelList: Mapel[],
  nilaiMap: Record<string, Record<string, NilaiMapelSiswa>>,
  tpList: TujuanPembelajaran[],
  ekskulList: Ekstrakurikuler[],
  nilaiEkskulMap: Record<string, Record<string, NilaiEkskul>> | undefined,
  isTanpaAngka = false,
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  customDeskripsiMapel?: Record<string, Record<string, string>>,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName, baseBodySize, headerSize, subHeaderSize } = getFontConfig(pdfFont);
  const startPage = doc.getNumberOfPages() + (isContinuation ? 1 : 0);

  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth } = getPaperDimensions(paperSize);

  // Header Rapor
  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN HASIL BELAJAR (RAPOR)', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(subHeaderSize);
  doc.setTextColor(71, 85, 105);
  doc.text('KURIKULUM MERDEKA', pageWidth / 2, 23, { align: 'center' });

  // Grid Identitas Rapor (Header Table)
  const headerData = [
    [
      { content: 'Nama Peserta Didik', styles: { fontStyle: 'bold' as const } },
      { content: `: ${(student.nama || '').toUpperCase()}` },
      { content: 'Kelas / Rombel', styles: { fontStyle: 'bold' as const } },
      { content: `: ${formatKelasRombel(sekolah)}` }
    ],
    [
      { content: 'NISN / NIS', styles: { fontStyle: 'bold' as const } },
      { content: `: ${student.nisn || '-'} / ${student.nis || '-'}` },
      { content: 'Fase', styles: { fontStyle: 'bold' as const } },
      { content: `: ${sekolah.fase || 'A'}` }
    ],
    [
      { content: 'Nama Sekolah', styles: { fontStyle: 'bold' as const } },
      { content: `: ${sekolah.nama || '-'}` },
      { content: 'Semester', styles: { fontStyle: 'bold' as const } },
      { content: `: ${sekolah.semester ? `Semester ${sekolah.semester}` : '1 (Ganjil)'}` }
    ],
    [
      { content: 'Alamat Sekolah', styles: { fontStyle: 'bold' as const } },
      { content: `: ${sekolah.alamat || '-'}` },
      { content: 'Tahun Ajaran', styles: { fontStyle: 'bold' as const } },
      { content: `: ${sekolah.tahunAjaran || '2024-2025'}` }
    ]
  ];

  autoTable(doc, {
    startY: 28,
    margin: { left: 15, right: 15 },
    body: headerData,
    theme: 'plain',
    styles: {
      fontSize: baseBodySize - 1,
      cellPadding: 1.2,
      textColor: [30, 41, 59],
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 62 },
      2: { cellWidth: 28 },
      3: { cellWidth: 55 }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // Garis Pembatas
  doc.setDrawColor(203, 213, 225);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 4;

  // Bagian A: Nilai dan Capaian Kompetensi Intrakurikuler
  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize);
  doc.setTextColor(15, 23, 42);
  doc.text('A. Nilai dan Capaian Kompetensi', 15, currentY);
  currentY += 2;

  const displayedMapel = mapelList.filter(m => m.tampilRapor !== false);

  const tableHead = isTanpaAngka
    ? [['No', 'Muatan Pelajaran', 'Capaian Kompetensi']]
    : [['No', 'Muatan Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi']];

  const tableBody = displayedMapel.map((m, idx) => {
    const isPabp = isPabpMapel(m.nama, m.kode);
    const allMapelTps = tpList.filter(tp => tp.mapelId === m.id);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student.agama, true)
      : allMapelTps;

    const n = nilaiMap[student.id]?.[m.id];
    const res = hitungNilaiMapel(m, mapelTps, n, student.id);

    // Cek apakah ada teks deskripsi khusus hasil penyesuaian di Ruang Transit
    const customText = customDeskripsiMapel?.[student.id]?.[m.id];
    let deskripsiText = customText && customText.trim() ? customText.trim() : '';

    if (!deskripsiText) {
      if (res.deskripsiTertinggi) {
        deskripsiText += res.deskripsiTertinggi;
      }
      if (res.deskripsiTerendah) {
        if (deskripsiText) deskripsiText += '\n\n';
        deskripsiText += res.deskripsiTerendah;
      }
      if (!deskripsiText) {
        deskripsiText = 'Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran.';
      }
    }

    if (isTanpaAngka) {
      return [
        (idx + 1).toString(),
        m.nama,
        deskripsiText
      ];
    } else {
      return [
        (idx + 1).toString(),
        m.nama,
        res.finalScore !== null ? res.finalScore.toString() : '-',
        deskripsiText
      ];
    }
  });

  const availableTableWidth = pageWidth - 30;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      textColor: [30, 41, 59],
      valign: 'top',
      cellPadding: 2.8,
      font: fontName
    },
    columnStyles: isTanpaAngka
      ? {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50, fontStyle: 'bold' },
          2: { cellWidth: availableTableWidth - 60 }
        }
      : {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 46, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: availableTableWidth - 76 }
        }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Bagian B: Ekstrakurikuler
  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize);
  doc.text('B. Ekstrakurikuler', 15, currentY);
  currentY += 2;

  const displayedEkskul = ekskulList.filter(e => e.tampilRapor !== false);
  const ekskulRows = displayedEkskul.length > 0
    ? displayedEkskul.map((e, idx) => {
        const ne = nilaiEkskulMap?.[student.id]?.[e.id];
        return [
          (idx + 1).toString(),
          e.nama,
          ne?.predikat || 'Baik (B)',
          ne?.deskripsi || `Aktif dan berpartisipasi baik dalam kegiatan ${e.nama}.`
        ];
      })
    : [['1', 'Kegiatan Ekstrakurikuler', 'Baik (B)', 'Mengikuti kegiatan ekstrakurikuler dengan baik.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: [['No', 'Kegiatan Ekstrakurikuler', 'Predikat', 'Keterangan']],
    body: ekskulRows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      cellPadding: 2.2,
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: availableTableWidth - 85 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // C & D: Kehadiran & Catatan Wali Kelas
  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: [['C. Ketidakhadiran', 'D. Catatan Wali Kelas']],
    body: [
      [
        'Sakit : 0 hari\nIzin : 0 hari\nTanpa Keterangan : 0 hari',
        'Pertahankan semangat belajarmu, tingkatkan terus prestasi dan akhlak mulia dalam segala kegiatan pembelajaran.'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      cellPadding: 3,
      valign: 'top',
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: availableTableWidth - 70, fontStyle: 'italic' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Titimangsa & 3 Kolom TTD
  const ttdColWidth = (pageWidth - 30) / 3;
  const col1X = 15;
  const col2X = 15 + ttdColWidth;
  const col3X = 15 + ttdColWidth * 2;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.setTextColor(30, 41, 59);
  doc.text(`${sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Kota'}, ${sekolah.tanggalRapor || '20 Desember 2024'}`, col3X + ttdColWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.text('Mengetahui,', col1X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text('Mengetahui,', col2X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text('Guru / Wali Kelas,', col3X + ttdColWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  doc.text('Orang Tua / Wali Siswa', col1X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text('Kepala Sekolah', col2X + ttdColWidth / 2, currentY, { align: 'center' });

  // Digital Signature
  if (sekolah.useDigitalSignature && sekolah.ttdKepsek && sekolah.ttdKepsek.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.ttdKepsek, 'PNG', col2X + ttdColWidth / 2 - 12, currentY + 1, 24, 14);
    } catch {}
  }
  if (sekolah.useDigitalSignature && sekolah.ttdWaliKelas && sekolah.ttdWaliKelas.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.ttdWaliKelas, 'PNG', col3X + ttdColWidth / 2 - 12, currentY + 1, 24, 14);
    } catch {}
  }

  currentY += 18;

  // Nama & NIP
  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 0.5);
  doc.text(student.namaAyah || student.namaIbu || '....................................', col1X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text((sekolah.kepsek || '....................................').toUpperCase(), col2X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text((sekolah.waliKelas || '....................................').toUpperCase(), col3X + ttdColWidth / 2, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, col2X + ttdColWidth / 2, currentY, { align: 'center' });
  doc.text(`NIP. ${sekolah.nipWaliKelas || '-'}`, col3X + ttdColWidth / 2, currentY, { align: 'center' });

  const endPage = doc.getNumberOfPages();
  // Tambahkan Footer Resmi (Font 9.5pt)
  addDocumentFooter(doc, sekolah, student, startPage, endPage, pdfFont);
};

// 4. GENERATE LAMPIRAN BUKU INDUK PDF (Font 11pt Arial / 12pt Times, Footer 9.5pt)
export const buildBukuIndukPDF = (
  doc: jsPDF,
  sekolah: Sekolah,
  student: Siswa,
  mapelList: Mapel[],
  nilaiMap: Record<string, Record<string, NilaiMapelSiswa>>,
  tpList: TujuanPembelajaran[],
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  customDeskripsiMapel?: Record<string, Record<string, string>>,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName, baseBodySize, headerSize, subHeaderSize } = getFontConfig(pdfFont);
  const startPage = doc.getNumberOfPages() + (isContinuation ? 1 : 0);

  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth } = getPaperDimensions(paperSize);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize);
  doc.setTextColor(15, 23, 42);
  doc.text('LAMPIRAN BUKU INDUK PESERTA DIDIK', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(subHeaderSize);
  doc.setTextColor(71, 85, 105);
  doc.text((sekolah.nama || 'SEKOLAH DASAR').toUpperCase(), pageWidth / 2, 25, { align: 'center' });

  const infoData = [
    ['Nama Peserta Didik', ':', (student.nama || '').toUpperCase(), 'Tahun Ajaran', ':', sekolah.tahunAjaran || '-'],
    ['NIS / NISN', ':', `${student.nis || '-'} / ${student.nisn || '-'}`, 'Semester', ':', sekolah.semester ? `Semester ${sekolah.semester}` : '1'],
    ['Kelas / Fase', ':', `${sekolah.kelas || '-'} / ${sekolah.fase || '-'}`, 'Status Murid', ':', 'Aktif']
  ];

  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    body: infoData,
    theme: 'plain',
    styles: { fontSize: baseBodySize - 1, cellPadding: 1.5, font: fontName },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 5 },
      2: { cellWidth: 60 },
      3: { cellWidth: 26, fontStyle: 'bold' },
      4: { cellWidth: 5 },
      5: { cellWidth: 40 }
    }
  });

  const availableTableWidth = pageWidth - 30;
  const displayedMapel = mapelList.filter(m => m.tampilRapor !== false);
  const rows = displayedMapel.map((m, idx) => {
    const isPabp = isPabpMapel(m.nama, m.kode);
    const allMapelTps = tpList.filter(tp => tp.mapelId === m.id);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student.agama, true)
      : allMapelTps;

    const n = nilaiMap[student.id]?.[m.id];
    const res = hitungNilaiMapel(m, mapelTps, n, student.id);
    const score = res.finalScore;
    const predikat = score !== null ? (score >= 85 ? 'Sangat Baik (A)' : score >= 70 ? 'Baik (B)' : 'Cukup (C)') : '-';

    const customText = customDeskripsiMapel?.[student.id]?.[m.id];
    const catatan = (customText && customText.trim()) || res.deskripsiTertinggi || 'Mengikuti proses pembelajaran dengan baik.';

    return [
      (idx + 1).toString(),
      m.nama,
      score !== null ? score.toString() : '-',
      predikat,
      catatan
    ];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    margin: { left: 15, right: 15, bottom: 20 },
    head: [['No', 'Mata Pelajaran', 'Nilai Akhir', 'Predikat', 'Catatan Kemajuan Belajar']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      cellPadding: 2.8,
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: availableTableWidth - 106 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const ttdX = pageWidth - 75;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.text(`${sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Kota'}, ${sekolah.tanggalRapor || '20 Desember 2024'}`, ttdX, finalY);
  doc.text(`Kepala ${sekolah.nama}`, ttdX, finalY + 4.5);

  if (sekolah.useDigitalSignature && sekolah.ttdKepsek && sekolah.ttdKepsek.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.ttdKepsek, 'PNG', ttdX, finalY + 7, 24, 14);
    } catch {}
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 0.5);
  doc.text((sekolah.kepsek || '........................').toUpperCase(), ttdX, finalY + 25);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, ttdX, finalY + 29.5);

  const endPage = doc.getNumberOfPages();
  addDocumentFooter(doc, sekolah, student, startPage, endPage, pdfFont);
};

// 5. GENERATE SURAT PINDAH PDF
export const buildPindahPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName, baseBodySize, headerSize, subHeaderSize } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth } = getPaperDimensions(paperSize);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize);
  doc.setTextColor(15, 23, 42);
  doc.text('KETERANGAN PINDAH SEKOLAH', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(subHeaderSize);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text((sekolah.nama || 'SEKOLAH DASAR').toUpperCase(), pageWidth / 2, 27, { align: 'center' });
  doc.line(25, 30, pageWidth - 25, 30);

  doc.setFontSize(baseBodySize);
  doc.setTextColor(30, 41, 59);
  doc.text(`Yang bertanda tangan di bawah ini, Kepala ${sekolah.nama} menerangkan bahwa:`, 25, 40);

  const studentInfo = [
    ['Nama Peserta Didik', ':', (student.nama || '-').toUpperCase()],
    ['Nomor Induk / NISN', ':', `${student.nis || '-'} / ${student.nisn || '-'}`],
    ['Jenis Kelamin', ':', student.jk === 'L' || student.jk === 'Laki-Laki' ? 'Laki-laki' : 'Perempuan'],
    ['Tingkat / Kelas', ':', `Kelas ${sekolah.kelas || '-'} (${sekolah.fase || 'Fase'})`],
    ['Nama Orang Tua / Wali', ':', student.namaAyah || student.namaIbu || student.namaWali || '-'],
    ['Alamat Orang Tua', ':', student.jalanOrtu || student.alamat || '-']
  ];

  autoTable(doc, {
    startY: 45,
    margin: { left: 25, right: 25 },
    body: studentInfo,
    theme: 'plain',
    styles: { fontSize: baseBodySize, cellPadding: 2.5, font: fontName },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 6 },
      2: { fontStyle: 'normal' }
    }
  });

  let curY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(baseBodySize);
  doc.text('Sesuai dengan surat permohonan pindah sekolah dari orang tua/wali peserta didik tanggal ................................,', 25, curY);
  curY += 5.5;
  doc.text('yang bersangkutan mengajukan pindah ke sekolah tujuan:', 25, curY);
  curY += 7;

  // Box Sekolah Tujuan
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(25, curY, pageWidth - 50, 36, 2, 2, 'FD');
  doc.setLineDashPattern([], 0);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 0.5);
  doc.text('Nama Sekolah Tujuan :', 30, curY + 10);
  doc.text('Alamat Sekolah Tujuan :', 30, curY + 19);
  doc.text('Alasan Kepindahan :', 30, curY + 28);

  doc.setFont(fontName, 'normal');
  doc.text('....................................................................................................................', 75, curY + 10);
  doc.text('....................................................................................................................', 75, curY + 19);
  doc.text('Mengikuti domisili orang tua / Lainnya.', 75, curY + 28);

  curY += 50;
  const ttdX = pageWidth - 75;

  doc.setFontSize(baseBodySize - 0.5);
  doc.text(`${sekolah.lokasiTitimangsa || sekolah.kabupatenKotaNama || 'Kota'}, ............................. 202...`, ttdX, curY);
  doc.text(`Kepala ${sekolah.nama}`, ttdX, curY + 5);

  if (sekolah.useDigitalSignature && sekolah.ttdKepsek && sekolah.ttdKepsek.startsWith('data:image')) {
    try {
      doc.addImage(sekolah.ttdKepsek, 'PNG', ttdX, curY + 8, 24, 14);
    } catch {}
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize);
  doc.text((sekolah.kepsek || '........................').toUpperCase(), ttdX, curY + 30);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, ttdX, curY + 35);
};

// 6. GENERATE BUNDEL KUSTOM (Berdasarkan Pilihan Centang Dokumen)
export const buildCustomBundelPDF = (
  docTypes: BundleDocType[],
  sekolah: Sekolah,
  student: Siswa,
  mapelList: Mapel[],
  nilaiMap: Record<string, Record<string, NilaiMapelSiswa>>,
  tpList: TujuanPembelajaran[],
  ekskulList: Ekstrakurikuler[],
  nilaiEkskulMap: Record<string, Record<string, NilaiEkskul>> | undefined,
  isTanpaAngka = false,
  paperSize: PaperSize = 'a4',
  customDeskripsiMapel?: Record<string, Record<string, string>>,
  pdfFont: PdfFontOption = 'arial'
): jsPDF => {
  const { format } = getPaperDimensions(paperSize);
  const doc = new jsPDF('p', 'mm', format as any);

  let isFirstDoc = true;

  docTypes.forEach(type => {
    const isContinuation = !isFirstDoc;

    if (type === 'jilid') {
      buildJilidPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    } else if (type === 'biodata') {
      buildBiodataPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    } else if (type === 'rapor') {
      buildRaporPDF(doc, sekolah, student, mapelList, nilaiMap, tpList, ekskulList, nilaiEkskulMap, isTanpaAngka, paperSize, isContinuation, customDeskripsiMapel, pdfFont);
      isFirstDoc = false;
    } else if (type === 'buku-induk') {
      buildBukuIndukPDF(doc, sekolah, student, mapelList, nilaiMap, tpList, paperSize, isContinuation, customDeskripsiMapel, pdfFont);
      isFirstDoc = false;
    } else if (type === 'pindah') {
      buildPindahPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    }
  });

  return doc;
};

// 7. GENERATE BUNDEL LENGKAP SEMUA 5 DOKUMEN
export const buildBundelLengkapPDF = (
  sekolah: Sekolah,
  student: Siswa,
  mapelList: Mapel[],
  nilaiMap: Record<string, Record<string, NilaiMapelSiswa>>,
  tpList: TujuanPembelajaran[],
  ekskulList: Ekstrakurikuler[],
  nilaiEkskulMap: Record<string, Record<string, NilaiEkskul>> | undefined,
  isTanpaAngka = false,
  paperSize: PaperSize = 'a4',
  pdfFont: PdfFontOption = 'arial'
): jsPDF => {
  return buildCustomBundelPDF(
    ['jilid', 'biodata', 'rapor', 'buku-induk', 'pindah'],
    sekolah,
    student,
    mapelList,
    nilaiMap,
    tpList,
    ekskulList,
    nilaiEkskulMap,
    isTanpaAngka,
    paperSize,
    undefined,
    pdfFont
  );
};
