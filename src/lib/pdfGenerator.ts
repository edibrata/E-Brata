import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sekolah, Siswa, Mapel, NilaiMapelSiswa, TujuanPembelajaran, Ekstrakurikuler, NilaiEkskul, DataPendukungSiswa } from '@/types';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { hitungNilaiMapel } from '@/lib/penilaianUtils';

export type PaperSize = 'a4' | 'f4';
export type BundleDocType = 'jilid' | 'identitas-sekolah' | 'identitas-murid' | 'biodata' | 'rapor' | 'buku-induk' | 'pindah';
export type PdfFontOption = 'arial' | 'times';

export const getFontConfig = (pdfFont: PdfFontOption = 'arial') => {
  if (pdfFont === 'times') {
    return {
      fontName: 'times' as const,
      baseBodySize: 11,
      smallSize: 9,
      headerSize: 13,
      subHeaderSize: 10.5
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

// Helper format tanggal Indonesia baku (misal: '2024-12-20' -> '20 Desember 2024')
export const formatTanggalIndonesia = (rawDate?: string): string => {
  if (!rawDate) return '';
  const clean = rawDate.trim();
  if (!clean) return '';
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${parseInt(d, 10)} ${months[monthIdx]} ${y}`;
    }
  }
  return clean;
};

// Cache rotated/scaled images to avoid re-rendering
const imageTransformCache = new Map<string, string>();

export function getTransformedImageSync(
  dataUrl: string,
  rotationDeg: number = 0
): string {
  if (!dataUrl || !dataUrl.startsWith('data:image') || ((rotationDeg % 360) === 0)) {
    return dataUrl;
  }
  const cleanRotation = ((rotationDeg % 360) + 360) % 360;
  if (cleanRotation === 0) return dataUrl;

  const cacheKey = `${dataUrl.slice(0, 80)}_${dataUrl.length}_${cleanRotation}`;
  if (imageTransformCache.has(cacheKey)) {
    return imageTransformCache.get(cacheKey)!;
  }

  try {
    const img = document.createElement('img');
    img.src = dataUrl;
    if (img.complete && img.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      const rad = (cleanRotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const newW = Math.round(w * cos + h * sin);
      const newH = Math.round(w * sin + h * cos);
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(newW / 2, newH / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2);
        const transformed = canvas.toDataURL('image/png');
        imageTransformCache.set(cacheKey, transformed);
        return transformed;
      }
    }
  } catch (e) {
    console.error('Error transforming image:', e);
  }
  return dataUrl;
}

// Helper kalkulasi ukuran font agar teks pas dalam 1 baris (Shrink to Fit)
export const calculateShrinkFontSize = (
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  baseFontSizePt: number,
  fontName: string,
  fontStyle: string = 'normal',
  minFontSizePt: number = 6.0
): number => {
  if (!text) return baseFontSizePt;
  doc.setFont(fontName, fontStyle);
  doc.setFontSize(baseFontSizePt);
  const textWidthMm = doc.getTextWidth(text);
  if (textWidthMm <= maxWidthMm) {
    return baseFontSizePt;
  }
  const ratio = maxWidthMm / textWidthMm;
  const targetSize = baseFontSizePt * ratio;
  return Math.max(minFontSizePt, Number(targetSize.toFixed(2)));
};

// Helper render tanda tangan digital proporsional (Preserve Aspect Ratio 1:1, Transparan, In Front of Text)
export const addProportionalSignature = (
  doc: jsPDF,
  rawImageData: string,
  centerX: number,
  centerY: number,
  maxWidthMm: number = 32,
  maxHeightMm: number = 18,
  scalePct: number = 100,
  rotationDeg: number = 0,
  offsetX: number = 0,
  offsetY: number = 0
) => {
  if (!rawImageData || !rawImageData.startsWith('data:image')) return;
  try {
    const imageData = getTransformedImageSync(rawImageData, rotationDeg);
    const imgProps = doc.getImageProperties(imageData);
    const imgWidth = imgProps.width;
    const imgHeight = imgProps.height;
    
    const scale = (scalePct || 100) / 100;
    const effectiveMaxWidth = maxWidthMm * scale;
    const effectiveMaxHeight = maxHeightMm * scale;
    const shiftedCenterX = centerX + (offsetX * 0.2645);
    const shiftedCenterY = centerY + (offsetY * 0.2645);

    if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
      doc.addImage(imageData, 'PNG', shiftedCenterX - effectiveMaxWidth / 2, shiftedCenterY - effectiveMaxHeight / 2, effectiveMaxWidth, effectiveMaxHeight);
      return;
    }

    const ratio = Math.min(effectiveMaxWidth / imgWidth, effectiveMaxHeight / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    const finalX = shiftedCenterX - finalWidth / 2;
    const finalY = shiftedCenterY - finalHeight / 2;

    doc.addImage(imageData, 'PNG', finalX, finalY, finalWidth, finalHeight);
  } catch (err) {
    try {
      const scale = (scalePct || 100) / 100;
      const shiftedCenterX = centerX + (offsetX * 0.2645);
      const shiftedCenterY = centerY + (offsetY * 0.2645);
      doc.addImage(rawImageData, 'PNG', shiftedCenterX - (maxWidthMm * scale) / 2, shiftedCenterY - (maxHeightMm * scale) / 2, maxWidthMm * scale, maxHeightMm * scale);
    } catch {}
  }
};

// Helper format Kabupaten/Kota baku (singkat Kabupaten menjadi Kab.)
export const formatKabupatenKota = (sekolah: Sekolah): string => {
  let kab = (sekolah.kabupatenKotaNama || '').trim().replace(/_/g, ' ');
  if (!kab || kab.toLowerCase().includes('kabupaten_kota') || kab.toLowerCase().includes('pilih')) {
    return 'Kab. Pandeglang';
  }
  
  // Jika diawali "Kabupaten ", ubah jadi "Kab. "
  if (/^kabupaten\s+/i.test(kab)) {
    return kab.replace(/^kabupaten\s+/i, 'Kab. ');
  }
  if (/^kab\.\s+/i.test(kab) || /^kota\s+/i.test(kab)) {
    return kab;
  }

  const jenis = (sekolah.kabupatenKotaJenis || '').toLowerCase() === 'kota' ? 'Kota' : 'Kab.';
  return `${jenis} ${kab}`;
};

// Helper format lokasi titimangsa cerdas (mengambil data wilayah riil sesuai opsi yang dipilih di Pengaturan Output)
export const formatLokasiTitimangsa = (sekolah: Sekolah): string => {
  const mode = (sekolah.lokasiTitimangsa || '').trim().toLowerCase();

  if (mode === 'desa_kelurahan') {
    const desa = (sekolah.desaKelurahanNama || '').trim();
    if (desa) return desa;
  } else if (mode === 'kecamatan') {
    const kec = (sekolah.kecamatan || '').trim();
    if (kec) return kec;
  } else if (mode === 'kabupaten_kota') {
    return formatKabupatenKota(sekolah);
  } else if (mode && mode !== 'pilih' && !mode.includes('kabupaten_kota') && !mode.includes('desa_kelurahan') && !mode.includes('kecamatan')) {
    // Custom string input jika ada isian teks manual
    let custom = (sekolah.lokasiTitimangsa || '').trim().replace(/_/g, ' ');
    if (/^kabupaten\s+/i.test(custom)) {
      custom = custom.replace(/^kabupaten\s+/i, 'Kab. ');
    }
    return custom;
  }

  // Default fallback otomatis jika belum dipilih secara spesifik:
  if (sekolah.kabupatenKotaNama) {
    return formatKabupatenKota(sekolah);
  }
  if (sekolah.kecamatan) {
    return (sekolah.kecamatan || '').trim();
  }
  if (sekolah.desaKelurahanNama) {
    return (sekolah.desaKelurahanNama || '').trim();
  }

  return 'Kab. Pandeglang';
};

// Helper format semester terbilang baku
export const formatSemesterTerbilang = (semester?: string | number): string => {
  if (!semester) return '1 (Satu)';
  const s = String(semester).trim();
  if (s === '1' || s.toLowerCase() === 'ganjil' || s.toLowerCase().includes('1')) {
    return '1 (Satu)';
  }
  if (s === '2' || s.toLowerCase() === 'genap' || s.toLowerCase().includes('2')) {
    return '2 (Dua)';
  }
  return s;
};

// Helper format alamat baris kedua: [Desa/Kelurahan] [Nama Desa/Kelurahan] Kec. [Kecamatan] [Kabupaten/Kota] [Nama Kabupaten/Kota] - [Provinsi]
export const formatAlamatBaris2 = (sekolah: Sekolah): string => {
  const parts: string[] = [];

  // 1. [Desa/Kelurahan] [Nama Desa/Kelurahan]
  if (sekolah.desaKelurahanNama) {
    const desa = sekolah.desaKelurahanNama.trim();
    if (desa) {
      if (/^(desa|kelurahan|kel\.)/i.test(desa)) {
        parts.push(desa);
      } else {
        const jenis = (sekolah.desaKelurahanJenis || '').toLowerCase() === 'kelurahan' ? 'Kelurahan' : 'Desa';
        parts.push(`${jenis} ${desa}`);
      }
    }
  }

  // 2. Kec. [Kecamatan]
  if (sekolah.kecamatan) {
    const kec = sekolah.kecamatan.trim();
    if (kec) {
      if (/^(kecamatan|kec\.)/i.test(kec)) {
        parts.push(kec);
      } else {
        parts.push(`Kec. ${kec}`);
      }
    }
  }

  // 3. [Kabupaten/Kota] [Nama Kabupaten/Kota] (Singkat Kab.)
  if (sekolah.kabupatenKotaNama) {
    const formattedKab = formatKabupatenKota(sekolah);
    if (formattedKab) {
      parts.push(formattedKab);
    }
  }

  const baseAlamat = parts.join(' ');

  // 4. - [Provinsi]
  if (sekolah.provinsi) {
    const prov = sekolah.provinsi.trim();
    if (prov && !prov.toLowerCase().includes('pilih')) {
      return baseAlamat ? `${baseAlamat} - ${prov}` : prov;
    }
  }

  return baseAlamat;
};

// Helper formatting kelas dan rombel baku (misal: 6 (Enam) atau 6 (Enam) A)
export const formatKelasRombel = (sekolah: Sekolah): string => {
  let k = (sekolah.kelas || '').trim();
  let r = (sekolah.ruangRombel || (sekolah as any).rombel || '').trim();

  // Ambil angka kelas
  const numMatch = k.match(/\d+/);
  const num = numMatch ? numMatch[0] : k;

  const angkaKeKata: Record<string, string> = {
    '1': '1 (Satu)',
    '2': '2 (Dua)',
    '3': '3 (Tiga)',
    '4': '4 (Empat)',
    '5': '5 (Lima)',
    '6': '6 (Enam)'
  };

  const kelasFormatted = angkaKeKata[num] || (k.toLowerCase().startsWith('kelas') ? k : `Kelas ${k}`);

  if (!r) return kelasFormatted;

  // Bersihkan teks redundan dari rombel
  const cleanR = r.replace(/kelas/gi, '').replace(/\d+/g, '').replace(/satu|dua|tiga|empat|lima|enam/gi, '').trim();
  
  if (cleanR && cleanR.length > 0) {
    return `${kelasFormatted} ${cleanR}`;
  }

  const rNum = r.match(/\d+/)?.[0];
  if (rNum && rNum !== num && rNum !== '1') {
    return `${kelasFormatted} ${rNum}`;
  }

  return kelasFormatted;
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

// 1A. GENERATE JILID / COVER LUAR SAJA (Sampul Depan)
export const buildJilidCoverOnlyPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth } = getPaperDimensions(paperSize);

  // Logo Sekolah / Tut Wuri Handayani di Bagian Atas
  const logoY = paperSize === 'f4' ? 42 : 36;
  const rawLogo = sekolah.logo || sekolah.logoKiri || sekolah.logoKanan;
  
  if (rawLogo && rawLogo.startsWith('data:image')) {
    try {
      const logoScale = (sekolah.logoScale || 100) / 100;
      const logoRotation = sekolah.logoRotation || 0;
      const logoOffsetX = (sekolah.logoOffsetX || 0) * 0.2645;
      const logoOffsetY = (sekolah.logoOffsetY || 0) * 0.2645;
      const maxBoxSize = 36 * logoScale;
      const transformedLogo = getTransformedImageSync(rawLogo, logoRotation);
      
      const imgProps = doc.getImageProperties(transformedLogo);
      const imgWidth = imgProps.width || 1;
      const imgHeight = imgProps.height || 1;
      const ratio = Math.min(maxBoxSize / imgWidth, maxBoxSize / imgHeight);
      const finalW = imgWidth * ratio;
      const finalH = imgHeight * ratio;

      doc.addImage(transformedLogo, 'PNG', pageWidth / 2 - finalW / 2 + logoOffsetX, logoY + (36 - finalH) / 2 + logoOffsetY, finalW, finalH);
    } catch (e) {
      console.warn('Could not render logo on cover', e);
    }
  }

  // Judul Rapor di Bawah Logo
  let titleY = paperSize === 'f4' ? 98 : 88;
  doc.setFont(fontName, 'bold');
  doc.setTextColor(0, 0, 0);
  
  doc.setFontSize(16);
  doc.text('RAPOR', pageWidth / 2, titleY, { align: 'center' });
  
  titleY += 7.5;
  doc.setFontSize(13.5);
  doc.text('PESERTA DIDIK', pageWidth / 2, titleY, { align: 'center' });
  
  titleY += 7.5;
  doc.setFontSize(13.5);
  doc.text('SEKOLAH DASAR', pageWidth / 2, titleY, { align: 'center' });

  // Kotak Identitas Murid di Tengah (Lebar lebih ramping & proporsional)
  const boxWidth = paperSize === 'f4' ? 105 : 100;
  const boxHeight = paperSize === 'f4' ? 13.5 : 13;
  const boxX = (pageWidth - boxWidth) / 2;
  
  const midY = paperSize === 'f4' ? 168 : 148;

  // Label 1: Nama Peserta Didik:
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Nama Peserta Didik:', pageWidth / 2, midY, { align: 'center' });

  // Kotak 1: Nama (UPPERCASE, 15pt & Shrink to fit)
  const yBoxNama = midY + 3.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.setFillColor(255, 255, 255);
  doc.rect(boxX, yBoxNama, boxWidth, boxHeight);

  const namaSiswaUpper = (student.nama || '').trim().toUpperCase() || '-';
  const namaFontSize = calculateShrinkFontSize(doc, namaSiswaUpper, boxWidth - 6, 15, fontName, 'bold', 8);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(namaFontSize);
  doc.text(namaSiswaUpper, pageWidth / 2, yBoxNama + (boxHeight / 2) + (namaFontSize * 0.12), { align: 'center' });

  // Label 2: NISN/NIS:
  const yLabelNisn = yBoxNama + boxHeight + 7;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(10.5);
  doc.text('NISN/NIS:', pageWidth / 2, yLabelNisn, { align: 'center' });

  // Kotak 2: NISN/NIS (15pt & Shrink to fit)
  const yBoxNisn = yLabelNisn + 3.5;
  doc.rect(boxX, yBoxNisn, boxWidth, boxHeight);

  const nisnText = student.nisn?.trim() || '';
  const nisText = student.nis?.trim() || '';
  let combinedNis = '-';
  if (nisnText && nisText) {
    combinedNis = `${nisnText} / ${nisText}`;
  } else if (nisnText) {
    combinedNis = nisnText;
  } else if (nisText) {
    combinedNis = nisText;
  }

  const nisFontSize = calculateShrinkFontSize(doc, combinedNis, boxWidth - 6, 15, fontName, 'bold', 8);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(nisFontSize);
  doc.text(combinedNis, pageWidth / 2, yBoxNisn + (boxHeight / 2) + (nisFontSize * 0.12), { align: 'center' });

  // Footer: KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH / REPUBLIK INDONESIA (13pt, margin proporsional)
  const footY = paperSize === 'f4' ? 290 : 260;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH', pageWidth / 2, footY, { align: 'center' });
  doc.text('REPUBLIK INDONESIA', pageWidth / 2, footY + 6.5, { align: 'center' });
};

// 1B. GENERATE IDENTITAS SATUAN PENDIDIKAN SAJA (Identitas Sekolah)
export const buildIdentitasSekolahOnlyPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth } = getPaperDimensions(paperSize);

  // Header Judul 3 Baris Rata Tengah
  let titleY = paperSize === 'f4' ? 44 : 38;
  doc.setFont(fontName, 'bold');
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(15);
  doc.text('RAPOR', pageWidth / 2, titleY, { align: 'center' });

  titleY += 6.5;
  doc.setFontSize(13);
  doc.text('PESERTA DIDIK', pageWidth / 2, titleY, { align: 'center' });

  titleY += 6.5;
  doc.setFontSize(13);
  doc.text('SEKOLAH DASAR (SD)', pageWidth / 2, titleY, { align: 'center' });

  // Data Form Isian
  const marginX = 26;
  const colonX = 68;
  const valX = 72;
  const rightX = pageWidth - marginX;
  const rowSpacing = paperSize === 'f4' ? 9.2 : 8.4;
  const startY = titleY + (paperSize === 'f4' ? 24 : 20);

  const nssVal = sekolah.nss ? (sekolah.nis ? `${sekolah.nss}/${sekolah.nis}` : `${sekolah.nss}/`) : (sekolah.nis ? `/${sekolah.nis}` : '');
  const kabJenis = (sekolah.kabupatenKotaJenis || '').toLowerCase();
  const kabLabel = kabJenis === 'kota' ? 'Kota' : kabJenis === 'kabupaten' ? 'Kabupaten' : 'Kabupaten/Kota';
  const kabClean = (sekolah.kabupatenKotaNama || '').replace(/^kabupaten\s+/i, '').replace(/^kab\.\s+/i, '').replace(/^kota\s+/i, '').trim();
  
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

  doc.setFontSize(11);

  rows.forEach((row, idx) => {
    const y = startY + (idx * rowSpacing);

    // Label Rata Kiri Sejajar Lurus
    doc.setFont(fontName, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(row.label, marginX, y);

    // Titik Dua & Value
    doc.text(':', colonX, y);
    if (row.value) {
      doc.setFont(fontName, row.isBoldVal ? 'bold' : 'normal');
      doc.text(row.value, valX, y);
    }

    // Garis bawah pembatas (underline)
    doc.setDrawColor(218, 222, 228);
    doc.setLineWidth(0.2);
    doc.line(colonX, y + 2, rightX, y + 2);
  });
};

// 1. GENERATE JILID & IDENTITAS SEKOLAH GABUNGAN
export const buildJilidPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  buildJilidCoverOnlyPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
  buildIdentitasSekolahOnlyPDF(doc, sekolah, student, paperSize, true, pdfFont);
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
  const { fontName } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize);

  // Header Judul 1 Baris Rata Tengah
  const titleY = paperSize === 'f4' ? 24 : 20;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('IDENTITAS PESERTA DIDIK', pageWidth / 2, titleY, { align: 'center' });

  const tglLahirFormatted = student.tanggalLahir
    ? (formatTanggalIndonesia(student.tanggalLahir) || student.tanggalLahir)
    : '-';
  const ttl = student.tempatLahir
    ? (tglLahirFormatted !== '-' ? `${student.tempatLahir}, ${tglLahirFormatted}` : student.tempatLahir)
    : tglLahirFormatted;

  const nisNisnStr = student.nis && student.nisn
    ? `${student.nis} / ${student.nisn}`
    : student.nisn || student.nis || '-';

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

  const rows: BiodataRowItem[] = [
    { no: '1.', label: 'Nama Peserta Didik', value: (student.nama || '-').toUpperCase(), isBoldVal: true },
    { no: '2.', label: 'Nomor Induk/NISN', value: nisNisnStr },
    { no: '3.', label: 'Tempat, Tanggal Lahir', value: ttl },
    { no: '4.', label: 'Jenis Kelamin', value: student.jk === 'L' || student.jk === 'Laki-Laki' ? 'Laki-laki' : (student.jk ? 'Perempuan' : '-') },
    { no: '5.', label: 'Agama', value: student.agama || 'Islam' },
    { no: '6.', label: 'Pendidikan Sebelumnya', value: student.pendidikanSebelumnya || '-' },
    { no: '7.', label: 'Alamat Peserta Didik', value: student.alamat || '-' },
    { no: '8.', label: 'Nama Orang Tua', isHeader: true },
    { subNo: 'a.', label: 'Ayah', value: student.namaAyah || '-' },
    { subNo: 'b.', label: 'Ibu', value: student.namaIbu || '-' },
    { no: '9.', label: 'Pekerjaan Orang Tua', isHeader: true },
    { subNo: 'a.', label: 'Ayah', value: student.pekerjaanAyah || '-' },
    { subNo: 'b.', label: 'Ibu', value: student.pekerjaanIbu || '-' },
    { no: '10.', label: 'Alamat Orang Tua', isHeader: true },
    { subNo: 'a.', label: 'Jalan', value: student.jalanOrtu || student.alamat || '-' },
    { subNo: 'b.', label: desaLabel, value: student.desaKelurahanOrtu || sekolah.desaKelurahanNama || '-' },
    { subNo: 'c.', label: 'Kecamatan', value: student.kecamatanOrtu || sekolah.kecamatan || '-' },
    { subNo: 'd.', label: kabLabel, value: student.kabupatenKotaOrtu || sekolah.kabupatenKotaNama || '-' },
    { subNo: 'e.', label: 'Provinsi', value: student.provinsiOrtu || sekolah.provinsi || '-' },
    { no: '11.', label: 'Wali Peserta Didik', isHeader: true },
    { subNo: 'a.', label: 'Nama', value: student.namaWali || '-' },
    { subNo: 'b.', label: 'Pekerjaan', value: student.pekerjaanWali || '-' },
    { subNo: 'c.', label: 'Alamat', value: student.alamatWali || '-' },
  ];

  const marginX = 22;
  const mainLabelX = marginX + 7;
  const subNoX = marginX + 7;
  const subLabelX = marginX + 13;
  const colonX = 78;
  const valX = 82;
  const rightX = pageWidth - marginX;
  const rowSpacing = paperSize === 'f4' ? 7.6 : 6.9;
  const startY = titleY + (paperSize === 'f4' ? 14 : 12);
  const baseFontSize = 11; // Arial 11pt

  rows.forEach((row, idx) => {
    const y = startY + (idx * rowSpacing);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(baseFontSize);
    doc.setTextColor(0, 0, 0);

    if (row.isHeader) {
      // Baris Header Kelompok (No dan Label, Tanpa Titik Dua & Garis Bawah)
      if (row.no) {
        doc.text(row.no, marginX, y);
      }
      doc.text(row.label, mainLabelX, y);
    } else {
      // Baris Utama atau Sub-baris
      if (row.no) {
        doc.text(row.no, marginX, y);
        doc.text(row.label, mainLabelX, y);
      } else if (row.subNo) {
        doc.text(row.subNo, subNoX, y);
        doc.text(row.label, subLabelX, y);
      }

      // Tanda Titik Dua
      doc.text(':', colonX, y);

      // Nilai Isian (Shrink to fit jika panjang)
      const valStr = row.value || '-';
      const maxValWidth = rightX - valX - 1;
      const fitFontSize = calculateShrinkFontSize(doc, valStr, maxValWidth, baseFontSize, fontName, row.isBoldVal ? 'bold' : 'normal', 7.5);
      
      doc.setFont(fontName, row.isBoldVal ? 'bold' : 'normal');
      doc.setFontSize(fitFontSize);
      doc.text(valStr, valX, y);

      // Garis Bawah Pembatas (Underline)
      doc.setDrawColor(218, 222, 228);
      doc.setLineWidth(0.2);
      doc.line(colonX, y + 1.8, rightX, y + 1.8);
    }
  });

  const lastRowY = startY + (rows.length * rowSpacing);

  // Tanda Tangan Kepala Sekolah di kanan bawah
  const ttdX = pageWidth - 80;
  const ttdY = lastRowY + (paperSize === 'f4' ? 8 : 6);

  // Pas Foto Box (ukuran 26mm x 35mm, digeser ke kiri agar ruang stempel proporsional)
  const photoW = 26;
  const photoH = 35;
  const photoX = ttdX - photoW - 27; // Digeser ke kiri agar tidak terlalu menimpa foto saat distempel
  const photoY = ttdY;

  if (student.fotoBase64 && student.fotoBase64.startsWith('data:image')) {
    try {
      doc.addImage(student.fotoBase64, 'JPEG', photoX, photoY, photoW, photoH);
      // Ketika ada foto, kotak placeholder langsung diganti foto tanpa border tambahan
    } catch {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.rect(photoX, photoY, photoW, photoH);
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Pas Foto\n3 x 4 cm', photoX + (photoW / 2), photoY + (photoH / 2) - 1, { align: 'center' });
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoW, photoH);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Pas Foto\n3 x 4 cm', photoX + (photoW / 2), photoY + (photoH / 2) - 1, { align: 'center' });
  }

  const lokasiStrBiodata = formatLokasiTitimangsa(sekolah);
  const tanggalBiodataFormatted = formatTanggalIndonesia(sekolah.tanggalBiodata || sekolah.tanggalRapor);
  const titimangsaBiodataStr = tanggalBiodataFormatted ? `${lokasiStrBiodata}, ${tanggalBiodataFormatted}` : `${lokasiStrBiodata}, ............................. 202...`;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseFontSize); // 11pt
  doc.setTextColor(0, 0, 0);
  doc.text(titimangsaBiodataStr, ttdX, ttdY);
  doc.text('Kepala Sekolah,', ttdX, ttdY + 5.2);

  if (sekolah.useDigitalSignature && sekolah.ttdKepsek && sekolah.ttdKepsek.startsWith('data:image')) {
    addProportionalSignature(
      doc,
      sekolah.ttdKepsek,
      ttdX + 15,
      ttdY + 20,
      30,
      16,
      sekolah.ttdKepsekScale || 100,
      sekolah.ttdKepsekRotation || 0,
      sekolah.ttdKepsekOffsetX || 0,
      sekolah.ttdKepsekOffsetY || 0
    );
  }

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseFontSize); // 11pt
  const kepsekName = sekolah.kepsek || '........................'; // Tidak dipaksa uppercase & tanpa garis bawah
  doc.text(kepsekName, ttdX, ttdY + 30.5);
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseFontSize); // 11pt
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
  pdfFont: PdfFontOption = 'arial',
  projekList?: { id: string; tema: string; deskripsi: string }[],
  customDeskripsiKokurikuler?: Record<string, Record<string, string>>,
  dataPendukungMap?: Record<string, DataPendukungSiswa>
) => {
  const { fontName, baseBodySize, headerSize } = getFontConfig(pdfFont);
  const startPage = doc.getNumberOfPages() + (isContinuation ? 1 : 0);

  if (isContinuation) {
    doc.addPage();
  }

  const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize);
  const maxUsableY = pageHeight - 18; // Batas aman bawah sebelum footer dokumen

  // Header Rapor
  doc.setFont(fontName, 'bold');
  doc.setFontSize(headerSize);
  doc.setTextColor(0, 0, 0);
  doc.text('LAPORAN HASIL BELAJAR (RAPOR)', pageWidth / 2, 18, { align: 'center' });

  // Grid Identitas Rapor (Header Table 6 Kolom Sejajar - Titik Dua Rata Lurus Sempurna)
  const alamatBaris1 = sekolah.alamat || '-';
  const alamatBaris2 = formatAlamatBaris2(sekolah);

  const baseHeaderFontSize = baseBodySize - 1;

  // Shrink to fit masing-masing bagian teks agar selalu muat tepat 1 baris
  const namaFontSize = calculateShrinkFontSize(doc, (student.nama || '').toUpperCase(), 80, baseHeaderFontSize, fontName, 'bold', 6.0);
  const nisnFontSize = calculateShrinkFontSize(doc, `${student.nisn || '-'} / ${student.nis || '-'}`, 80, baseHeaderFontSize, fontName, 'normal', 6.0);
  const sekolahFontSize = calculateShrinkFontSize(doc, sekolah.nama || '-', 80, baseHeaderFontSize, fontName, 'normal', 6.0);
  const alamat1FontSize = calculateShrinkFontSize(doc, alamatBaris1, 80, baseHeaderFontSize, fontName, 'normal', 6.0);
  const alamat2FontSize = alamatBaris2 ? calculateShrinkFontSize(doc, alamatBaris2, 138, baseHeaderFontSize - 0.5, fontName, 'normal', 6.0) : baseHeaderFontSize;

  const kelasFontSize = calculateShrinkFontSize(doc, formatKelasRombel(sekolah), 27, baseHeaderFontSize, fontName, 'normal', 6.0);
  const smtFontSize = calculateShrinkFontSize(doc, formatSemesterTerbilang(sekolah.semester), 27, baseHeaderFontSize, fontName, 'normal', 6.0);
  const taFontSize = calculateShrinkFontSize(doc, sekolah.tahunAjaran || '2025/2026', 27, baseHeaderFontSize, fontName, 'normal', 6.0);

  const headerData = [
    [
      { content: 'Nama Peserta Didik', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: (student.nama || '').toUpperCase(), styles: { fontStyle: 'bold' as const, fontSize: namaFontSize } },
      { content: 'Kelas', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: formatKelasRombel(sekolah), styles: { fontSize: kelasFontSize } }
    ],
    [
      { content: 'NISN/NIS', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: `${student.nisn || '-'} / ${student.nis || '-'}`, styles: { fontSize: nisnFontSize } },
      { content: 'Fase', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: sekolah.fase || 'A' }
    ],
    [
      { content: 'Nama Sekolah', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: sekolah.nama || '-', styles: { fontSize: sekolahFontSize } },
      { content: 'Semester', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: formatSemesterTerbilang(sekolah.semester), styles: { fontSize: smtFontSize } }
    ],
    [
      { content: 'Alamat Sekolah', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: alamatBaris1, styles: { fontSize: alamat1FontSize } },
      { content: 'Tahun Ajaran', styles: { fontStyle: 'bold' as const } },
      { content: ':', styles: { halign: 'center' as const } },
      { content: sekolah.tahunAjaran || '2025/2026', styles: { fontSize: taFontSize } }
    ]
  ];

  if (alamatBaris2) {
    headerData.push([
      { content: '', styles: { cellPadding: 0.2 } },
      { content: '', styles: { cellPadding: 0.2 } },
      { content: alamatBaris2, colSpan: 4, styles: { cellPadding: 0.2, fontSize: alamat2FontSize } }
    ] as any);
  }

  autoTable(doc, {
    startY: 22,
    margin: { left: 15, right: 15 },
    body: headerData,
    theme: 'plain',
    styles: {
      fontSize: baseBodySize - 1,
      cellPadding: 0.6,
      textColor: [0, 0, 0],
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 4, halign: 'center' },
      2: { cellWidth: 82 },
      3: { cellWidth: 26 },
      4: { cellWidth: 4, halign: 'center' },
      5: { cellWidth: 29 }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 3;

  const displayedMapel = mapelList.filter(m => m.tampilRapor !== false);

  const tableHead = isTanpaAngka
    ? [['No', 'Mata Pelajaran', 'Capaian Kompetensi']]
    : [['No', 'Mata Pelajaran', 'Nilai\nAkhir', 'Capaian Kompetensi']];

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
        if (deskripsiText) deskripsiText += ' ';
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

  // 1. TABEL MATA PELAJARAN
  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      textColor: [0, 0, 0],
      valign: 'middle',
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    },
    columnStyles: isTanpaAngka
      ? {
          0: { cellWidth: 10, halign: 'center', valign: 'middle' },
          1: { cellWidth: 50, fontStyle: 'bold', valign: 'middle' },
          2: { cellWidth: availableTableWidth - 60, halign: 'justify', valign: 'middle' }
        }
      : {
          0: { cellWidth: 10, halign: 'center', valign: 'middle' },
          1: { cellWidth: 46, fontStyle: 'bold', valign: 'middle' },
          2: { cellWidth: 18, halign: 'center', valign: 'middle', fontStyle: 'bold' },
          3: { cellWidth: availableTableWidth - 74, halign: 'justify', valign: 'middle' }
        }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 2. KOKURIKULER (P5)
  let kokurikulerText = '';
  if (projekList && projekList.length > 0) {
    kokurikulerText = projekList.map(p => {
      const customK = customDeskripsiKokurikuler?.[student.id]?.[p.id];
      const desc = customK || p.deskripsi || 'Berpartisipasi aktif dalam kegiatan projek kokurikuler dengan menunjukkan penguatan karakter profil pelajar yang positif.';
      return `${p.tema ? `Projek: ${p.tema}. ` : ''}${desc}`;
    }).join('\n\n');
  } else {
    kokurikulerText = 'Berpartisipasi aktif dalam kegiatan projek kokurikuler penguatan profil pelajar dengan menunjukkan kepedulian, kreativitas, dan kerja sama yang baik.';
  }

  // Cek apakah Kokurikuler muat di halaman aktif
  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  const kokurikulerLines = doc.splitTextToSize(kokurikulerText, availableTableWidth - 8);
  const estimatedKokurikulerH = 8 + (kokurikulerLines.length * 4.2) + 6;
  if (currentY + estimatedKokurikulerH > maxUsableY) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: [['Kokurikuler']],
    body: [[kokurikulerText]],
    theme: 'grid',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      textColor: [0, 0, 0],
      halign: 'justify',
      valign: 'middle',
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 3. EKSTRAKURIKULER
  const displayedEkskul = ekskulList.filter(e => e.tampilRapor !== false);
  const isSingleEkskul = displayedEkskul.length <= 1;

  const ekskulHead = isSingleEkskul
    ? [['Ekstrakurikuler', 'Keterangan']]
    : [['No', 'Ekstrakurikuler', 'Keterangan']];

  const ekskulRows = displayedEkskul.length > 0
    ? displayedEkskul.map((e, idx) => {
        const ne = nilaiEkskulMap?.[student.id]?.[e.id];
        const desc = ne?.deskripsi || `Aktif dan berpartisipasi baik dalam kegiatan ${e.nama}.`;
        return isSingleEkskul
          ? [e.nama, desc]
          : [(idx + 1).toString(), e.nama, desc];
      })
    : (isSingleEkskul
        ? [['Kegiatan Ekstrakurikuler', 'Mengikuti kegiatan ekstrakurikuler dengan baik.']]
        : [['1', 'Kegiatan Ekstrakurikuler', 'Mengikuti kegiatan ekstrakurikuler dengan baik.']]);

  const estimatedEkskulH = 8 + (Math.max(displayedEkskul.length, 1) * 7.5) + 4;
  const closingSuiteMinH = 115; // Ketidakhadiran (35) + Tanggapan (22) + TTD (55) + Gaps

  // SMART LAYOUT GUARD: Jika sisa ruang setelah Ekstrakurikuler tidak cukup untuk menampung blok penutup rapor,
  // maka pindahkan Ekstrakurikuler ke halaman baru agar menjadi satu kesatuan yang rapi dan utuh.
  const spaceAfterEkskul = maxUsableY - (currentY + estimatedEkskulH + 4);
  if (spaceAfterEkskul < closingSuiteMinH) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: ekskulHead,
    body: ekskulRows,
    theme: 'grid',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      textColor: [0, 0, 0],
      valign: 'middle',
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    },
    columnStyles: isSingleEkskul
      ? {
          0: { cellWidth: 46, fontStyle: 'bold', valign: 'middle' },
          1: { cellWidth: availableTableWidth - 46, halign: 'justify', valign: 'middle' }
        }
      : {
          0: { cellWidth: 10, halign: 'center', valign: 'middle' },
          1: { cellWidth: 46, fontStyle: 'bold', valign: 'middle' },
          2: { cellWidth: availableTableWidth - 56, halign: 'justify', valign: 'middle' }
        }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // SMART LAYOUT GUARD: Pastikan blok Ketidakhadiran & Catatan + Tanggapan + TTD selalu muat bersama
  if (currentY + closingSuiteMinH > maxUsableY) {
    doc.addPage();
    currentY = 20;
  }

  // 4. KETIDAKHADIRAN & CATATAN WALI KELAS (2 Kotak Terpisah Berdampingan dengan Celah Presisi)
  const gapWidth = 3.5;
  const widthKetidakhadiran = 65;
  const widthCatatan = availableTableWidth - widthKetidakhadiran - gapWidth;
  const startKetidakhadiranX = 15;
  const startCatatanX = 15 + widthKetidakhadiran + gapWidth;
  const blockStartY = currentY;

  const studentDp = dataPendukungMap?.[student.id] || {};
  const sakitCount = studentDp.sakit ?? 0;
  const izinCount = studentDp.izin ?? 0;
  const alpaCount = studentDp.alpa ?? 0;

  // 4A. Kotak Kiri: Ketidakhadiran (Garis Penutup Kanan Sendiri, Tanpa Garis Vertikal Pemisah di Tengah, Garis Dalam Tipis)
  autoTable(doc, {
    startY: blockStartY,
    margin: { left: startKetidakhadiranX, right: pageWidth - startKetidakhadiranX - widthKetidakhadiran, bottom: 20 },
    tableWidth: widthKetidakhadiran,
    head: [
      [
        { content: 'Ketidakhadiran', colSpan: 2, styles: { halign: 'center' as const } }
      ]
    ],
    body: [
      [
        { content: 'Sakit', styles: { fontStyle: 'bold' as const } },
        { content: `: ${sakitCount} hari` }
      ],
      [
        { content: 'Izin', styles: { fontStyle: 'bold' as const } },
        { content: `: ${izinCount} hari` }
      ],
      [
        { content: 'Tanpa Keterangan', styles: { fontStyle: 'bold' as const } },
        { content: `: ${alpaCount} hari` }
      ]
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      font: fontName,
      minCellHeight: 7.2,
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      textColor: [0, 0, 0],
      valign: 'middle',
      font: fontName,
      cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 3 }
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: widthKetidakhadiran - 38 }
    },
    didDrawCell: (data) => {
      const { cell, section, column, row } = data;

      if (section === 'head') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y); // Atas
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height); // Bawah
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height); // Kiri
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height); // Kanan
      } else if (section === 'body') {
        // Garis pembatas horizontal: baris 0 & 1 (di bawah Sakit & Izin) tipis & halus (0.12), baris terakhir (bawah kotak) 0.25
        if (row.index === 2) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.25);
        } else {
          doc.setDrawColor(180, 190, 205);
          doc.setLineWidth(0.12);
        }
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);

        // Garis batas luar kiri (hanya kolom 0)
        if (column.index === 0) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.25);
          doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        }
        // Garis batas luar kanan (hanya kolom 1)
        if (column.index === 1) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.25);
          doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
        }
      }
    }
  });

  const finalYKetidakhadiran = (doc as any).lastAutoTable.finalY;
  const totalBoxHeight = finalYKetidakhadiran - blockStartY;
  const renderedHeadH = (doc as any).lastAutoTable.table?.head?.[0]?.height || 7.2;
  const exactCatatanBodyHeight = Math.max(totalBoxHeight - renderedHeadH, 18);

  const catatanWaliKelas = studentDp.catatanWaliKelas?.trim() || 'Pertahankan semangat belajarmu, tingkatkan terus prestasi dan akhlak mulia dalam segala kegiatan pembelajaran.';

  // Kalkulasi Shrink to Fit dinamis untuk Catatan Wali Kelas agar selalu muat rapi di luas kotak
  const availableTextWidth = widthCatatan - 7;
  const availableTextHeight = exactCatatanBodyHeight - 3.5;
  let catatanFontSize = baseBodySize - 1;
  while (catatanFontSize > 5.5) {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(catatanFontSize);
    const lines = doc.splitTextToSize(catatanWaliKelas, availableTextWidth);
    const textHeight = lines.length * (catatanFontSize * 0.352777 * 1.25);
    if (textHeight <= availableTextHeight) {
      break;
    }
    catatanFontSize -= 0.25;
  }

  // 4B. Kotak Kanan: Catatan Wali Kelas (Garis Penutup Kiri Sendiri, Reguler, Shrink to Fit, Tinggi 100% Identik Presisi)
  autoTable(doc, {
    startY: blockStartY,
    margin: { left: startCatatanX, right: 15, bottom: 20 },
    tableWidth: widthCatatan,
    head: [['Catatan Wali Kelas']],
    body: [
      [catatanWaliKelas]
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      font: fontName,
      minCellHeight: renderedHeadH,
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: Number(catatanFontSize.toFixed(2)),
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      halign: 'justify',
      valign: 'middle',
      minCellHeight: Math.max(exactCatatanBodyHeight - 4.4, 10),
      cellPadding: { top: 2.2, bottom: 2.2, left: 3.5, right: 3.5 },
      font: fontName
    },
    didDrawCell: (data) => {
      const { cell, section } = data;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      if (section === 'head') {
        doc.line(cell.x, cell.y, cell.x + cell.width, cell.y); // Atas
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height); // Bawah
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height); // Kiri
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height); // Kanan
      } else if (section === 'body') {
        // Garis luar kotak kanan dikunci sejajar mutlak dengan garis bawah Ketidakhadiran (finalYKetidakhadiran)
        doc.line(cell.x, cell.y, cell.x, finalYKetidakhadiran); // Kiri
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, finalYKetidakhadiran); // Kanan
        doc.line(cell.x, finalYKetidakhadiran, cell.x + cell.width, finalYKetidakhadiran); // Bawah
      }
    }
  });

  currentY = finalYKetidakhadiran + 4;

  // 5. TANGGAPAN ORANG TUA / WALI MURID (Ruang kosong yang lebih lapang dan proporsional)
  if (currentY + 32 + 8 + 55 > maxUsableY) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15, bottom: 20 },
    head: [['Tanggapan Orang Tua/ Wali Murid']],
    body: [['']],
    theme: 'grid',
    headStyles: {
      fillColor: [248, 248, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: baseBodySize - 0.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName,
      minCellHeight: 7.2,
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: baseBodySize - 1,
      minCellHeight: 24, // Ruang kosong yang luas dan nyaman untuk tulisan tangan orang tua
      cellPadding: 3,
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
      font: fontName
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 6. FORMASI TANDA TANGAN SEGITIGA BAKU RESMI
  if (currentY + 55 > maxUsableY) {
    doc.addPage();
    currentY = 20;
  }

  const halfWidth = (pageWidth - 30) / 2;
  const leftX = 15;
  const rightX = 15 + halfWidth;

  const lokasiStr = formatLokasiTitimangsa(sekolah);
  const tanggalStr = formatTanggalIndonesia(sekolah.tanggalRapor);
  const titimangsaStr = tanggalStr ? `${lokasiStr}, ${tanggalStr}` : `${lokasiStr}, ............................. 202...`;

  // Baris 1: Orang Tua (Kiri) dan Guru Kelas (Kanan)
  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.setTextColor(0, 0, 0);

  doc.text('Orang Tua/ Wali,', leftX + halfWidth / 2, currentY + 5, { align: 'center' });

  doc.text(titimangsaStr, rightX + halfWidth / 2, currentY, { align: 'center' });
  doc.text('Guru Kelas,', rightX + halfWidth / 2, currentY + 5, { align: 'center' });

  const guruTtdY = currentY + 13;
  const ortuNamaY = currentY + 23;
  const guruNipY = ortuNamaY + 4.5;

  doc.setFont(fontName, 'bold');
  doc.text(student.namaAyah || student.namaIbu || '.......................................', leftX + halfWidth / 2, ortuNamaY, { align: 'center' });
  doc.text(sekolah.waliKelas || '.......................................', rightX + halfWidth / 2, ortuNamaY, { align: 'center' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${sekolah.nipWaliKelas || '-'}`, rightX + halfWidth / 2, guruNipY, { align: 'center' });

  // TTD Digital Guru Kelas (In front of text, rasio asli 1:1 transparan tanpa distorsi)
  if (sekolah.useDigitalSignature && sekolah.ttdWaliKelas) {
    addProportionalSignature(
      doc, 
      sekolah.ttdWaliKelas, 
      rightX + halfWidth / 2, 
      guruTtdY, 
      32, 
      16, 
      sekolah.ttdWaliKelasScale || 100, 
      sekolah.ttdWaliKelasRotation || 0,
      sekolah.ttdWaliKelasOffsetX || 0,
      sekolah.ttdWaliKelasOffsetY || 0
    );
  }

  // Baris 2: Kepala Sekolah (Tengah Bawah)
  const kepsekStartY = guruNipY + 7;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.text('Mengetahui:', pageWidth / 2, kepsekStartY, { align: 'center' });
  doc.text('Kepala Sekolah,', pageWidth / 2, kepsekStartY + 4.5, { align: 'center' });

  const kepsekNamaY = kepsekStartY + 22.5;
  const kepsekNipY = kepsekNamaY + 4.5;

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 0.5);
  doc.text(sekolah.kepsek || '.......................................', pageWidth / 2, kepsekNamaY, { align: 'center' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, pageWidth / 2, kepsekNipY, { align: 'center' });

  const kepsekTtdY = kepsekStartY + 13.5;
  // TTD Digital Kepala Sekolah (In front of text, rasio asli 1:1 transparan tanpa distorsi)
  if (sekolah.useDigitalSignature && sekolah.ttdKepsek) {
    addProportionalSignature(
      doc, 
      sekolah.ttdKepsek, 
      pageWidth / 2, 
      kepsekTtdY, 
      34, 
      18, 
      sekolah.ttdKepsekScale || 100, 
      sekolah.ttdKepsekRotation || 0,
      sekolah.ttdKepsekOffsetX || 0,
      sekolah.ttdKepsekOffsetY || 0
    );
  }

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

  const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize);
  const maxUsableY = pageHeight - 18;

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
      valign: 'middle',
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
      font: fontName
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', valign: 'middle' },
      1: { cellWidth: 46, fontStyle: 'bold', valign: 'middle' },
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold', valign: 'middle' },
      3: { cellWidth: 30, halign: 'center', valign: 'middle' },
      4: { cellWidth: availableTableWidth - 106, halign: 'justify', valign: 'middle' }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY + 35 > maxUsableY) {
    doc.addPage();
    finalY = 20;
  }
  const ttdX = pageWidth - 55;

  const lokasiStrBukuInduk = formatLokasiTitimangsa(sekolah);
  const tanggalBukuIndukFormatted = formatTanggalIndonesia(sekolah.tanggalRapor);
  const titimangsaBukuIndukStr = tanggalBukuIndukFormatted ? `${lokasiStrBukuInduk}, ${tanggalBukuIndukFormatted}` : `${lokasiStrBukuInduk}, ............................. 202...`;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(baseBodySize - 1);
  doc.text(titimangsaBukuIndukStr, ttdX, finalY, { align: 'center' });
  doc.text(`Kepala ${sekolah.nama}`, ttdX, finalY + 4.5, { align: 'center' });

  doc.setFont(fontName, 'bold');
  doc.setFontSize(baseBodySize - 0.5);
  doc.text((sekolah.kepsek || '........................').toUpperCase(), ttdX, finalY + 25, { align: 'center' });
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${sekolah.nipKepsek || '-'}`, ttdX, finalY + 29.5, { align: 'center' });

  if (sekolah.useDigitalSignature && sekolah.ttdKepsek) {
    addProportionalSignature(
      doc, 
      sekolah.ttdKepsek, 
      ttdX, 
      finalY + 14, 
      32, 
      16, 
      sekolah.ttdKepsekScale || 100, 
      sekolah.ttdKepsekRotation || 0,
      sekolah.ttdKepsekOffsetX || 0,
      sekolah.ttdKepsekOffsetY || 0
    );
  }

  const endPage = doc.getNumberOfPages();
  addDocumentFooter(doc, sekolah, student, startPage, endPage, pdfFont);
};

// 5. GENERATE SURAT / BLANKO KETERANGAN PINDAH SEKOLAH RESMI (2 HALAMAN)
export const buildPindahPDF = (
  doc: jsPDF, 
  sekolah: Sekolah, 
  student: Siswa, 
  paperSize: PaperSize = 'a4',
  isContinuation = false,
  pdfFont: PdfFontOption = 'arial'
) => {
  const { fontName } = getFontConfig(pdfFont);
  if (isContinuation) {
    doc.addPage();
  }
  const startPage = doc.getNumberOfPages();
  const { width: pageWidth } = getPaperDimensions(paperSize);

  const studentNameStr = student.nama ? student.nama.toUpperCase() : '...........................................................................................';

  // --- HALAMAN 1: KELUAR ---
  const titleY = paperSize === 'f4' ? 18 : 16;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('KETERANGAN PINDAH SEKOLAH', pageWidth / 2, titleY, { align: 'center' });

  const subY = titleY + 6.5;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.text('Nama Peserta Didik', 20, subY);
  doc.text(':', 56, subY);
  doc.setFont(fontName, 'bold');
  doc.text(studentNameStr, 60, subY);

  const table1StartY = subY + 4;
  const col3Width = (pageWidth - 40) - 24 - 26 - 42;
  const rowHeightHalaman1 = paperSize === 'f4' ? 74 : 68;

  const ttdKeluarText = 
`............................., .................................
Kepala Sekolah,




...............................................................
NIP.

Orang Tua/ Wali,




...............................................................`;

  autoTable(doc, {
    startY: table1StartY,
    margin: { top: 15, bottom: 10, left: 20, right: 20 },
    theme: 'grid',
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
    head: [
      [{ content: 'KELUAR', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 9.5, minCellHeight: 6, fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.25 } }],
      [
        { content: 'Tanggal', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 } },
        { content: 'Kelas yang\nDitinggalkan', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 } },
        { content: 'Alasan', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 } },
        { content: 'Tanda Tangan Kepala Sekolah,\nStempel Sekolah, dan\nTanda Tangan Orangtua/Wali', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 } }
      ]
    ],
    body: [
      ['', '', '', ttdKeluarText],
      ['', '', '', ttdKeluarText],
      ['', '', '', ttdKeluarText]
    ],
    styles: {
      font: fontName,
      fontSize: 7.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      minCellHeight: rowHeightHalaman1
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.25,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', valign: 'top' },
      1: { cellWidth: 26, halign: 'center', valign: 'top' },
      2: { cellWidth: 42, halign: 'left', valign: 'top' },
      3: { cellWidth: col3Width, halign: 'left', valign: 'top', cellPadding: { top: 2.5, left: 3, right: 3, bottom: 2.5 } }
    }
  });

  // --- HALAMAN 2: MASUK ---
  doc.addPage();

  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('KETERANGAN PINDAH SEKOLAH', pageWidth / 2, titleY, { align: 'center' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.text('Nama Peserta Didik', 20, subY);
  doc.text(':', 56, subY);
  doc.setFont(fontName, 'bold');
  doc.text(studentNameStr, 60, subY);

  const ttdMasukColText = 
`............................., .................................
Kepala Sekolah,




...............................................................
NIP.`;

  const dataMasukText = 
`Nama Peserta Didik  : .....................................................
Nomor Induk         : .....................................................
NISN                : .....................................................
Nama Sekolah        : .....................................................
Masuk di Sekolah Ini:
a. Tanggal          : .....................................................
b. Di Kelas         : .....................................................
c. Tahun Pelajaran  : .....................................................`;

  const rowHeightHalaman2 = paperSize === 'f4' ? 46 : 41;
  const colMasukRightWidth = 62;
  const colMasukLeftWidth = (pageWidth - 40) - 12 - colMasukRightWidth;

  autoTable(doc, {
    startY: table1StartY,
    margin: { top: 15, bottom: 10, left: 20, right: 20 },
    theme: 'grid',
    rowPageBreak: 'avoid',
    pageBreak: 'avoid',
    head: [
      [
        { content: 'NO.', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8.5 } },
        { content: 'MASUK', colSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 9 } }
      ]
    ],
    body: [
      ['1', dataMasukText, ttdMasukColText],
      ['2', dataMasukText, ttdMasukColText],
      ['3', dataMasukText, ttdMasukColText]
    ],
    styles: {
      font: fontName,
      fontSize: 7.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      minCellHeight: rowHeightHalaman2
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.25,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', valign: 'top', fontStyle: 'bold' },
      1: { cellWidth: colMasukLeftWidth, halign: 'left', valign: 'top', cellPadding: { top: 2.2, left: 3, right: 3, bottom: 2.2 } },
      2: { cellWidth: colMasukRightWidth, halign: 'left', valign: 'top', cellPadding: { top: 2.2, left: 3, right: 3, bottom: 2.2 } }
    }
  });

  // Tanda Tangan Bawah Halaman 2 (Formasi Segitiga Resmi)
  const bottomTtdStartY = (doc as any).lastAutoTable.finalY + (paperSize === 'f4' ? 6 : 5);
  doc.setFontSize(8);
  doc.setFont(fontName, 'normal');

  // Baris 1: Orang Tua/Wali (Kiri) & Guru Kelas (Kanan)
  const leftTtdX = 25;
  const rightTtdX = pageWidth - 75;

  doc.text('Mengetahui:', leftTtdX, bottomTtdStartY);
  doc.text('Orang Tua/ Wali,', leftTtdX, bottomTtdStartY + 4);
  doc.text('...............................................................', leftTtdX, bottomTtdStartY + (paperSize === 'f4' ? 20 : 17));

  doc.text('............................., .................................', rightTtdX, bottomTtdStartY);
  doc.text('Guru Kelas,', rightTtdX, bottomTtdStartY + 4);
  doc.text('...............................................................', rightTtdX, bottomTtdStartY + (paperSize === 'f4' ? 20 : 17));
  doc.text('NIP. ', rightTtdX, bottomTtdStartY + (paperSize === 'f4' ? 24 : 21));

  // Baris 2: Kepala Sekolah (Tengah)
  const centerTtdY = bottomTtdStartY + (paperSize === 'f4' ? 27 : 23);
  const centerTtdX = (pageWidth / 2) - 25;

  doc.text('Mengetahui:', centerTtdX, centerTtdY);
  doc.text('Kepala Sekolah,', centerTtdX, centerTtdY + 4);
  doc.text('...............................................................', centerTtdX, centerTtdY + (paperSize === 'f4' ? 20 : 17));
  doc.text('NIP. ', centerTtdX, centerTtdY + (paperSize === 'f4' ? 24 : 21));

  const endPage = doc.getNumberOfPages();
  addDocumentFooter(doc, sekolah, student, startPage, endPage, pdfFont);
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
  pdfFont: PdfFontOption = 'arial',
  projekList?: { id: string; tema: string; deskripsi: string }[],
  customDeskripsiKokurikuler?: Record<string, Record<string, string>>,
  dataPendukungMap?: Record<string, DataPendukungSiswa>
): jsPDF => {
  const { format } = getPaperDimensions(paperSize);
  const doc = new jsPDF('p', 'mm', format as any);

  let isFirstDoc = true;

  docTypes.forEach(type => {
    const isContinuation = !isFirstDoc;

    if (type === 'jilid') {
      buildJilidCoverOnlyPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    } else if (type === 'identitas-sekolah') {
      buildIdentitasSekolahOnlyPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    } else if (type === 'identitas-murid' || type === 'biodata') {
      buildBiodataPDF(doc, sekolah, student, paperSize, isContinuation, pdfFont);
      isFirstDoc = false;
    } else if (type === 'rapor') {
      buildRaporPDF(doc, sekolah, student, mapelList, nilaiMap, tpList, ekskulList, nilaiEkskulMap, isTanpaAngka, paperSize, isContinuation, customDeskripsiMapel, pdfFont, projekList, customDeskripsiKokurikuler, dataPendukungMap);
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

// 7. GENERATE BUNDEL LENGKAP SEMUA DOKUMEN
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
  pdfFont: PdfFontOption = 'arial',
  projekList?: { id: string; tema: string; deskripsi: string }[],
  customDeskripsiKokurikuler?: Record<string, Record<string, string>>,
  dataPendukungMap?: Record<string, DataPendukungSiswa>
): jsPDF => {
  return buildCustomBundelPDF(
    ['jilid', 'identitas-sekolah', 'identitas-murid', 'rapor', 'buku-induk', 'pindah'],
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
    pdfFont,
    projekList,
    customDeskripsiKokurikuler,
    dataPendukungMap
  );
};
