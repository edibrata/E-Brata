import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/store';
import { isPabpMapel, getTpAgama, doesStudentMatchTp, AGAMA_LIST } from '@/lib/agamaUtils';
import { hitungNilaiMapel, hitungDefaultBobotTp, getAmbangBatasKktp } from '@/lib/penilaianUtils';
import Tooltip from '@/components/Tooltip';
import { 
  Download, 
  Upload, 
  Settings2, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  ChevronDown,
  Equal,
  Percent
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InputNilai() {
  const { state, updateState } = useAppStore();
  const { siswa, mapel, tujuanPembelajaran, nilai } = state;
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [agamaFilter, setAgamaFilter] = useState<string>('ALL');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mapel.length > 0 && !selectedMapel) {
      setSelectedMapel(mapel[0].id);
    }
  }, [mapel, selectedMapel]);

  const selectedMapelData = useMemo(() => {
    return mapel.find(m => m.id === selectedMapel) || mapel[0];
  }, [mapel, selectedMapel]);

  const mapelTps = useMemo(() => {
    return tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);
  }, [tujuanPembelajaran, selectedMapel]);

  const isPabp = useMemo(() => {
    return isPabpMapel(selectedMapelData?.nama, selectedMapelData?.kode);
  }, [selectedMapelData]);

  // Filter siswa jika PABP filter aktif
  const displayedSiswa = useMemo(() => {
    if (isPabp && agamaFilter !== 'ALL') {
      return siswa.filter(s => (s.agama || '').toLowerCase().includes(agamaFilter.toLowerCase()));
    }
    return siswa;
  }, [siswa, isPabp, agamaFilter]);

  // Filter TP jika PABP filter aktif
  const displayedTps = useMemo(() => {
    if (isPabp && agamaFilter !== 'ALL') {
      return mapelTps.filter(tp => {
        const tpAg = getTpAgama(tp);
        return !tpAg || tpAg.toLowerCase() === agamaFilter.toLowerCase();
      });
    }
    return mapelTps;
  }, [mapelTps, isPabp, agamaFilter]);

  // Pengaturan Mapel Saat Ini
  const intervalBatas = selectedMapelData?.intervalBatas || [20, 40, 60, 80];
  const kktp = selectedMapelData ? getAmbangBatasKktp(selectedMapelData) : 60;
  const opsiPengolahan = selectedMapelData?.opsiPengolahan || 'rata-rata';
  const pakaiSas = selectedMapelData?.pakaiSas !== false;
  const bobotTp = selectedMapelData?.bobotTp || {};
  const rasioSlmSas = selectedMapelData?.rasioSlmSas || { slm: 60, sas: 40 };

  // Default bobot terbagi rata untuk seluruh TP
  const defaultBobotMap = useMemo(() => {
    return hitungDefaultBobotTp(displayedTps);
  }, [displayedTps]);

  // Total persentase bobot TP saat ini (Tingkat 1)
  const totalBobotTp = useMemo(() => {
    let sum = 0;
    displayedTps.forEach(tp => {
      const w = bobotTp[tp.id] ?? defaultBobotMap[tp.id] ?? (displayedTps.length > 0 ? Math.round(100 / displayedTps.length) : 0);
      sum += w;
    });
    return sum;
  }, [displayedTps, bobotTp, defaultBobotMap]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Update atribut pengaturan mapel
  const updateMapelSetting = (updates: Partial<typeof selectedMapelData>) => {
    if (!selectedMapelData) return;
    const newMapels = mapel.map(m => m.id === selectedMapelData.id ? { ...m, ...updates } : m);
    updateState('mapel', newMapels);
  };

  // Handler ubah bobot TP (Tingkat 1)
  const handleBobotTpChange = (tpId: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    const newBobot = { ...bobotTp, [tpId]: num };
    updateMapelSetting({ bobotTp: newBobot });
  };

  // Handler bagi rata bobot TP secara instan (Tingkat 1)
  const handleResetBobotTpToEqual = () => {
    const equalBobot = hitungDefaultBobotTp(displayedTps);
    updateMapelSetting({ bobotTp: equalBobot });
    showNotification('Bobot seluruh TP berhasil dibagi rata proporsional (Total 100%)!');
  };

  // Handler ubah rasio komposit SLM vs SAS (Tingkat 2)
  const handleRasioSlmChange = (slmVal: number) => {
    const slm = Math.max(0, Math.min(100, slmVal));
    const sas = 100 - slm;
    updateMapelSetting({ rasioSlmSas: { slm, sas } });
  };

  const handleRasioSasChange = (sasVal: number) => {
    const sas = Math.max(0, Math.min(100, sasVal));
    const slm = 100 - sas;
    updateMapelSetting({ rasioSlmSas: { slm, sas } });
  };

  const getAgamaBadgeColor = (ag?: string | null) => {
    switch (ag) {
      case 'Islam': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Kristen': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Katolik': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Hindu': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Buddha': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Khonghucu': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getScoreColorClass = (scoreStr: string | number | null | undefined) => {
    if (scoreStr === '' || scoreStr === null || scoreStr === undefined) return 'bg-white text-slate-800';
    const score = Number(scoreStr);
    if (isNaN(score)) return 'bg-white text-slate-800';
    if (score <= intervalBatas[0]) return 'bg-rose-50 text-rose-700 font-bold';
    if (score <= intervalBatas[1]) return 'bg-orange-50 text-orange-700 font-bold';
    if (score <= intervalBatas[2]) return 'bg-amber-50 text-amber-700 font-bold';
    if (score <= intervalBatas[3]) return 'bg-emerald-50 text-emerald-700 font-bold';
    return 'bg-teal-50 text-teal-700 font-bold';
  };

  const handleScoreChange = (studentId: string, type: 'tp' | 'sumatifAkhir', tpId: string | undefined, val: string) => {
    const rawVal = val.trim();
    const numVal = rawVal === '' ? null : parseFloat(rawVal);
    
    if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 100)) return;

    const studentScores = nilai[studentId] || {};
    const mapelScores = studentScores[selectedMapel] || { tpScores: {}, sumatifAkhir: null };

    if (type === 'tp' && tpId) {
      mapelScores.tpScores = { ...mapelScores.tpScores, [tpId]: numVal };
    } else if (type === 'sumatifAkhir') {
      mapelScores.sumatifAkhir = numVal;
    }

    updateState('nilai', {
      ...nilai,
      [studentId]: {
        ...studentScores,
        [selectedMapel]: mapelScores,
      }
    });
  };

  const getScore = (studentId: string, type: 'tp' | 'sumatifAkhir', tpId?: string): number | string => {
    const s = nilai[studentId]?.[selectedMapel];
    if (!s) return '';
    if (type === 'tp' && tpId) {
      const v = s.tpScores[tpId];
      return v !== null && v !== undefined ? v : '';
    }
    if (type === 'sumatifAkhir') {
      const v = s.sumatifAkhir;
      return v !== null && v !== undefined ? v : '';
    }
    return '';
  };

  // Navigasi Keyboard Cepat
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentIndex: number, colKey: string) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = `score-input-${studentIndex + 1}-${colKey}`;
      const nextInput = document.getElementById(nextId) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = `score-input-${studentIndex - 1}-${colKey}`;
      const prevInput = document.getElementById(prevId) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Ekspor Nilai ke File Excel/CSV
  const handleExportXLSX = () => {
    if (!selectedMapelData) return;
    
    const headers = ['No', 'NISN', 'Nama Siswa', 'Agama'];
    displayedTps.forEach((tp, idx) => {
      headers.push(`TP_${idx + 1}_${tp.kode}`);
    });
    headers.push('NA_SLM');
    if (pakaiSas) {
      headers.push(`SAS_${rasioSlmSas.sas}persen`);
    }
    headers.push('Nilai_Akhir_Rapor');

    const rows = displayedSiswa.map((s, idx) => {
      const sNilai = nilai[s.id]?.[selectedMapel];
      const validTpsForStudent = displayedTps.filter(tp => !isPabp || doesStudentMatchTp(s.agama, tp));
      const res = hitungNilaiMapel(selectedMapelData, validTpsForStudent, sNilai);

      const rowData: (string | number)[] = [
        idx + 1,
        s.nisn || '',
        s.nama,
        s.agama || ''
      ];

      displayedTps.forEach(tp => {
        const isMatch = !isPabp || doesStudentMatchTp(s.agama, tp);
        if (!isMatch) {
          rowData.push('-');
        } else {
          const sc = sNilai?.tpScores[tp.id];
          rowData.push(typeof sc === 'number' ? sc : '');
        }
      });

      rowData.push(res.naSlm !== null ? res.naSlm : '');

      if (pakaiSas) {
        rowData.push(typeof sNilai?.sumatifAkhir === 'number' ? sNilai.sumatifAkhir : '');
      }

      rowData.push(res.finalScore !== null ? res.finalScore : '');
      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nilai');

    const cleanMapelName = selectedMapelData.nama.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Nilai_${cleanMapelName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('File template & nilai berhasil diekspor!');
  };

  // Impor Nilai dari File Excel/CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMapelData) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!data || data.length < 2) {
          showNotification('Format file tidak sesuai atau kosong.', 'error');
          return;
        }

        const headers = data[0].map(h => String(h || '').trim());
        const updatedNilai = { ...nilai };
        let updatedCount = 0;

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const nisn = String(row[1] || '').trim();
          const nama = String(row[2] || '').trim().toLowerCase();

          const matchedStudent = siswa.find(s => 
            (nisn && s.nisn === nisn) || 
            (nama && s.nama.trim().toLowerCase() === nama)
          );

          if (!matchedStudent) continue;

          const studentScores = updatedNilai[matchedStudent.id] || {};
          const currentMapelScores = studentScores[selectedMapel] || { tpScores: {}, sumatifAkhir: null };
          const newTpScores = { ...currentMapelScores.tpScores };

          displayedTps.forEach((tp, idx) => {
            const colPrefix = `TP_${idx + 1}`;
            const colIndex = headers.findIndex(h => h.startsWith(colPrefix) || h === tp.kode);
            if (colIndex !== -1 && row[colIndex] !== undefined && row[colIndex] !== '' && row[colIndex] !== '-') {
              const num = Number(row[colIndex]);
              if (!isNaN(num) && num >= 0 && num <= 100) {
                newTpScores[tp.id] = num;
              }
            }
          });

          const sasIndex = headers.findIndex(h => h.toLowerCase().includes('sumatif_akhir') || h.toLowerCase().includes('sas'));
          let newSas = currentMapelScores.sumatifAkhir;
          if (sasIndex !== -1 && row[sasIndex] !== undefined && row[sasIndex] !== '') {
            const num = Number(row[sasIndex]);
            if (!isNaN(num) && num >= 0 && num <= 100) {
              newSas = num;
            }
          }

          updatedNilai[matchedStudent.id] = {
            ...studentScores,
            [selectedMapel]: {
              tpScores: newTpScores,
              sumatifAkhir: newSas,
            }
          };
          updatedCount++;
        }

        updateState('nilai', updatedNilai);
        showNotification(`Berhasil mengimpor nilai untuk ${updatedCount} siswa!`, 'success');
      } catch (err) {
        console.error(err);
        showNotification('Gagal membaca file spreadsheet.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Reset semua nilai pada mapel ini
  const handleResetMapelScores = () => {
    if (!window.confirm(`Yakin ingin mengosongkan seluruh nilai mata pelajaran ${selectedMapelData?.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    const updatedNilai = { ...nilai };
    siswa.forEach(s => {
      if (updatedNilai[s.id]?.[selectedMapel]) {
        delete updatedNilai[s.id][selectedMapel];
      }
    });
    updateState('nilai', updatedNilai);
    showNotification('Nilai mata pelajaran ini berhasil dikosongkan.', 'info');
  };

  // Hitung Analisis Ringkasan Kelas (Footer Table)
  const classSummary = useMemo(() => {
    const summaryPerTp: Record<string, { total: number; count: number; tuntas: number; remedial: number; avg: number | null }> = {};
    
    displayedTps.forEach(tp => {
      summaryPerTp[tp.id] = { total: 0, count: 0, tuntas: 0, remedial: 0, avg: null };
    });

    let totalNaSlm = 0;
    let countNaSlm = 0;
    let totalSas = 0;
    let countSas = 0;
    let totalNa = 0;
    let countNa = 0;
    let totalTuntasNa = 0;

    displayedSiswa.forEach(s => {
      const sNilai = nilai[s.id]?.[selectedMapel];
      const validTpsForStudent = displayedTps.filter(tp => !isPabp || doesStudentMatchTp(s.agama, tp));
      const res = hitungNilaiMapel(selectedMapelData, validTpsForStudent, sNilai);

      if (res.naSlm !== null) {
        totalNaSlm += res.naSlm;
        countNaSlm++;
      }

      if (res.finalScore !== null) {
        totalNa += res.finalScore;
        countNa++;
        if (res.finalScore >= kktp) totalTuntasNa++;
      }

      if (typeof sNilai?.sumatifAkhir === 'number') {
        totalSas += sNilai.sumatifAkhir;
        countSas++;
      }

      displayedTps.forEach(tp => {
        const isMatch = !isPabp || doesStudentMatchTp(s.agama, tp);
        if (!isMatch) return;
        const score = sNilai?.tpScores[tp.id];
        if (typeof score === 'number') {
          summaryPerTp[tp.id].total += score;
          summaryPerTp[tp.id].count++;
          if (score >= kktp) {
            summaryPerTp[tp.id].tuntas++;
          } else {
            summaryPerTp[tp.id].remedial++;
          }
        }
      });
    });

    displayedTps.forEach(tp => {
      const item = summaryPerTp[tp.id];
      item.avg = item.count > 0 ? Math.round(item.total / item.count) : null;
    });

    return {
      summaryPerTp,
      avgNaSlm: countNaSlm > 0 ? Math.round(totalNaSlm / countNaSlm) : null,
      avgSas: countSas > 0 ? Math.round(totalSas / countSas) : null,
      avgNa: countNa > 0 ? Math.round(totalNa / countNa) : null,
      totalTuntasNa,
      countNa,
      tuntasNaPersen: countNa > 0 ? Math.round((totalTuntasNa / countNa) * 100) : 0,
    };
  }, [displayedSiswa, displayedTps, nilai, selectedMapel, selectedMapelData, isPabp, kktp]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-300 text-sm font-medium ${
          notification.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : notification.type === 'info'
            ? 'bg-sky-50 text-sky-800 border-sky-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} className="text-rose-600 shrink-0" /> : <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Sliders size={20} />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Input Nilai Sumatif Lingkup Materi
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Asesmen sumatif dua tingkat: Pembobotan TP (NA-SLM) dan Pembobotan Komposit Rapor (+ SAS). Rujukan Panduan 2025 Hal. 55–58.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                showSettings 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Settings2 size={15} />
              <span>Sistem Pembobotan & KKTP</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            <Tooltip content="Unduh format spreadsheet untuk input nilai offline" position="bottom">
              <button
                type="button"
                onClick={handleExportXLSX}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download size={14} className="text-slate-500" />
                <span>Ekspor Excel</span>
              </button>
            </Tooltip>

            <Tooltip content="Unggah nilai dari file Excel / CSV" position="bottom">
              <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload size={14} className="text-slate-500" />
                <span>Impor Excel</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </Tooltip>

            <Tooltip content="Kosongkan nilai seluruh siswa untuk mata pelajaran ini" position="bottom">
              <button
                type="button"
                onClick={handleResetMapelScores}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Filter Mapel & PABP Bar */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xs w-full">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              {mapel.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nama} ({m.kode})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Agama for PABP */}
          {isPabp && (
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-500 px-2 shrink-0">Filter Agama:</span>
              <button
                type="button"
                onClick={() => setAgamaFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  agamaFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua ({siswa.length})
              </button>
              {AGAMA_LIST.map(ag => {
                const count = siswa.filter(s => (s.agama || '').toLowerCase().includes(ag.toLowerCase())).length;
                if (count === 0) return null;
                return (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => setAgamaFilter(ag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                      agamaFilter === ag
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{ag}</span>
                    <span className={`text-[10px] px-1 rounded-full ${agamaFilter === ag ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Pengaturan Dua Tingkat Pembobotan (Collapsible) */}
        {showSettings && (
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-150 animate-in fade-in duration-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Pengaturan Pengolahan Nilai Rapor: {selectedMapelData?.nama}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tersinkronisasi langsung dengan Pengaturan Mata Pelajaran
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Sinkron Perencanaan
                </span>
                <span className="text-[11px] text-indigo-700 bg-indigo-50 font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
                  Panduan 2025 Hal. 56–58
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              
              {/* TINGKAT 1: Pengolahan Nilai Lingkup Materi (Antar-TP) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Tingkat 1: Pembobotan TP → NA-SLM</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="opsiPengolahan"
                      value="rata-rata"
                      checked={opsiPengolahan === 'rata-rata'}
                      onChange={() => updateMapelSetting({ opsiPengolahan: 'rata-rata' })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Opsi 1: Rata-Rata SLM (Standar)</span>
                      <p className="text-[11px] text-slate-500">Materi bersifat lepas; bobot setiap TP sama rata.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="opsiPengolahan"
                      value="pembobotan"
                      checked={opsiPengolahan === 'pembobotan'}
                      onChange={() => updateMapelSetting({ opsiPengolahan: 'pembobotan' })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Opsi 2: Pembobotan Inter-TP</span>
                      <p className="text-[11px] text-slate-500">Materi progresif/kompleks; bobot ditentukan manual per-TP.</p>
                    </div>
                  </label>
                </div>

                {opsiPengolahan === 'pembobotan' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetBobotTpToEqual}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition"
                    >
                      <Equal size={13} />
                      <span>Bagi Rata Otomatis</span>
                    </button>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      totalBobotTp === 100 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Total: {totalBobotTp}% {totalBobotTp === 100 ? '✓' : `(${totalBobotTp < 100 ? 'Kurang' : 'Kelebihan'} ${Math.abs(100 - totalBobotTp)}%)`}
                    </span>
                  </div>
                )}
              </div>

              {/* TINGKAT 2: Komposit NA-SLM vs SAS Menuju Nilai Rapor */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Tingkat 2: Rasio Rapor (NA-SLM + SAS)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pakaiSas}
                      onChange={(e) => updateMapelSetting({ pakaiSas: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Sertakan Sumatif Akhir Semester (SAS)</span>
                  </label>

                  {pakaiSas ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                      <p className="text-[11px] text-slate-600">
                        Atur persentase bobot komposit rapor (Total wajib 100%):
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">
                            Bobot NA-SLM (%)
                          </label>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rasioSlmSas.slm}
                              onChange={(e) => handleRasioSlmChange(parseInt(e.target.value, 10) || 0)}
                              className="w-16 text-center text-lg font-black text-indigo-600 border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                            />
                            <span className="text-xs font-bold text-indigo-400">%</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">
                            Bobot SAS (%)
                          </label>
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rasioSlmSas.sas}
                              onChange={(e) => handleRasioSasChange(parseInt(e.target.value, 10) || 0)}
                              className="w-16 text-center text-lg font-black text-slate-700 border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium">Pilihan cepat:</span>
                        <div className="flex gap-1.5">
                          {[
                            { slm: 75, sas: 25, label: '75 : 25' },
                            { slm: 60, sas: 40, label: '60 : 40' },
                            { slm: 70, sas: 30, label: '70 : 30' },
                            { slm: 50, sas: 50, label: '50 : 50' }
                          ].map(preset => {
                            const isSelected = rasioSlmSas.slm === preset.slm && rasioSlmSas.sas === preset.sas;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateMapelSetting({ rasioSlmSas: { slm: preset.slm, sas: preset.sas } })}
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                      SAS dinonaktifkan. Nilai Akhir Rapor <strong>100%</strong> otomatis bersumber dari nilai sumatif lingkup materi (NA-SLM).
                    </div>
                  )}
                </div>
              </div>

              {/* KKTP & Petunjuk Regulasi */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">★</span>
                    <span>Interval Ketercapaian (KKTP)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Batas Tuntas TP:</span>
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                      &gt; {kktp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Berdasarkan <strong>Interval Ketercapaian TP</strong> di menu <em>Tujuan Pembelajaran</em> (Panduan 2025 Hal. 44–47). Skor di bawah <strong className="text-rose-600">≤ {kktp}</strong> otomatis ditandai bintang merah (<span className="text-rose-600 font-bold">*</span>) sebagai materi butuh bimbingan/remedial.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Rentang Interval:</span>
                    <span className="font-mono text-slate-600 font-semibold text-[10px]">
                      {intervalBatas.join(' • ')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Matrix Input Table */}
        <div className="mt-5">
          {displayedTps.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 text-slate-600 border border-slate-200 rounded-xl space-y-2">
              <AlertCircle size={28} className="mx-auto text-amber-500" />
              <p className="font-semibold">Belum Ada Tujuan Pembelajaran (TP) untuk Mata Pelajaran Ini</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan buat atau impor TP terlebih dahulu melalui menu <strong>Kegiatan Akademik &gt; Tujuan Pembelajaran</strong>.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto w-full max-h-[calc(100vh-20rem)] overflow-y-auto">
                <table className="w-full border-collapse text-sm whitespace-nowrap">
                  <thead className="bg-slate-100/90 backdrop-blur sticky top-0 z-20 text-slate-700 shadow-xs">
                    {/* Baris 1: Header Grup */}
                    <tr>
                      <th rowSpan={2} className="border border-slate-200 p-3 w-12 text-center bg-slate-100">
                        No
                      </th>
                      <th rowSpan={2} className="border border-slate-200 p-3 text-left min-w-[220px] max-w-[280px] bg-slate-100 sticky left-0 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        Nama Siswa
                      </th>
                      
                      {/* Grup SLM */}
                      <th 
                        colSpan={displayedTps.length} 
                        className="border border-slate-200 p-2 text-center text-xs bg-slate-50/90 font-bold uppercase tracking-wider text-slate-700"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>Sumatif Lingkup Materi (SLM / TP)</span>
                          <span className="text-[10px] font-normal normal-case px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                            {displayedTps.length} TP
                          </span>
                          {opsiPengolahan === 'pembobotan' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              totalBobotTp === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              Bobot TP: {totalBobotTp}%
                            </span>
                          )}
                        </div>
                      </th>

                      {/* Kolom NA-SLM (Tingkat 1) */}
                      <th rowSpan={2} className="border border-slate-200 p-2 text-center w-24 bg-sky-50/90 text-sky-950 text-xs font-bold uppercase tracking-wider">
                        NA-SLM
                        {pakaiSas && (
                          <div className="text-[10px] text-sky-600 font-semibold normal-case">
                            ({rasioSlmSas.slm}%)
                          </div>
                        )}
                      </th>

                      {/* Kolom SAS (Tingkat 2) */}
                      {pakaiSas && (
                        <th rowSpan={2} className="border border-slate-200 p-2 text-center w-24 bg-amber-50/90 text-amber-950 text-xs font-bold uppercase tracking-wider">
                          SAS
                          <div className="text-[10px] text-amber-600 font-semibold normal-case">
                            ({rasioSlmSas.sas}%)
                          </div>
                        </th>
                      )}

                      {/* Kolom NA Rapor Akhir */}
                      <th rowSpan={2} className="border border-slate-200 p-2 text-center w-24 bg-indigo-100/90 text-indigo-950 text-xs font-black uppercase tracking-wider">
                        Nilai Rapor<br/>(NA Akhir)
                      </th>

                      {/* Kolom Status */}
                      <th rowSpan={2} className="border border-slate-200 p-2 text-center w-28 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Status Ketercapaian
                      </th>
                    </tr>

                    {/* Baris 2: Sub-Header per TP */}
                    <tr className="text-slate-600">
                      {displayedTps.map((tp, idx) => {
                        const tpAg = getTpAgama(tp);
                        const currBobot = bobotTp[tp.id] ?? defaultBobotMap[tp.id] ?? (displayedTps.length > 0 ? Math.round(100 / displayedTps.length) : 0);

                        return (
                          <th 
                            key={tp.id} 
                            className="border border-slate-200 p-2 min-w-[90px] text-center text-xs font-medium bg-slate-50 hover:bg-slate-100/70 transition cursor-help group relative"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-700">TP {idx + 1}</span>
                                {tpAg && (
                                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${getAgamaBadgeColor(tpAg)}`}>
                                    {tpAg}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{tp.kode}</span>

                              {/* Input Bobot Manual jika mode Pembobotan (Tingkat 1) */}
                              {opsiPengolahan === 'pembobotan' && (
                                <div className="flex items-center gap-0.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <Tooltip content="Tentukan bobot persentase (%) materi ini (Total 100%)" position="top">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={currBobot}
                                      onChange={(e) => handleBobotTpChange(tp.id, e.target.value)}
                                      className="w-11 text-center text-[11px] font-bold border border-slate-300 rounded bg-white py-0.5 px-0.5 focus:border-indigo-500 outline-none shadow-2xs"
                                    />
                                  </Tooltip>
                                  <span className="text-[10px] text-slate-400 font-medium">%</span>
                                </div>
                              )}
                            </div>

                            {/* Tooltip Deskripsi TP (Muncul ke bawah agar tidak terpotong) */}
                            <div className={`absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-normal tracking-normal normal-case rounded-xl p-3 top-full mt-2 z-[100] pointer-events-none shadow-2xl border border-slate-700 min-w-[260px] max-w-[340px] whitespace-normal text-left leading-relaxed ${
                              idx === 0 
                                ? 'left-0 translate-x-0 before:left-6' 
                                : idx === displayedTps.length - 1 
                                ? 'right-0 left-auto translate-x-0 before:right-6' 
                                : 'left-1/2 -translate-x-1/2 before:left-1/2 before:-translate-x-1/2'
                            } before:content-[''] before:absolute before:-top-1.5 before:border-4 before:border-transparent before:border-b-slate-900`}>
                              <div className="font-bold text-indigo-300 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
                                <span>{tp.kode} — TP {idx + 1}</span>
                                {tpAg && <span className="text-[10px] font-semibold text-emerald-400">{tpAg}</span>}
                              </div>
                              <p className="text-slate-200">{tp.deskripsi || 'Tidak ada deskripsi'}</p>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Body Siswa & Input Nilai */}
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedSiswa.map((s, studentIndex) => {
                      const sNilai = nilai[s.id]?.[selectedMapel];
                      const validTpsForStudent = displayedTps.filter(tp => !isPabp || doesStudentMatchTp(s.agama, tp));
                      const res = hitungNilaiMapel(selectedMapelData, validTpsForStudent, sNilai);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* No */}
                          <td className="border border-slate-200 p-2.5 text-center font-mono text-slate-400 text-xs">
                            {studentIndex + 1}
                          </td>

                          {/* Nama Siswa (Sticky Left) */}
                          <td className="border border-slate-200 p-2.5 truncate font-medium sticky left-0 bg-white group-hover:bg-slate-50/80 group-focus-within:bg-slate-50 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 text-xs">{s.nama}</span>
                                {s.nisn && <span className="block text-[10px] text-slate-400 font-mono">{s.nisn}</span>}
                              </div>
                              {isPabp && s.agama && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border shrink-0 ${getAgamaBadgeColor(s.agama)}`}>
                                  {s.agama}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Input Nilai per TP */}
                          {displayedTps.map(tp => {
                            const isMatch = !isPabp || doesStudentMatchTp(s.agama, tp);
                            if (!isMatch) {
                              return (
                                <td 
                                  key={tp.id} 
                                  className="border border-slate-200 p-0 text-center bg-slate-100/70 text-slate-300 font-mono text-xs select-none"
                                >
                                  <Tooltip content={`Siswa beragama ${s.agama || 'Belum diisi'}, TP ini khusus untuk ${getTpAgama(tp) || 'agama lain'}`} position="top">
                                    <span className="cursor-not-allowed inline-block w-full py-2">
                                      —
                                    </span>
                                  </Tooltip>
                                </td>
                              );
                            }

                            const val = getScore(s.id, 'tp', tp.id);
                            const numVal = typeof val === 'number' ? val : (val === '' ? null : Number(val));
                            const isBelowKktp = numVal !== null && !isNaN(numVal) && numVal < kktp;

                            return (
                              <td key={tp.id} className="border border-slate-200 p-0 text-center relative focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-500">
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <input 
                                    id={`score-input-${studentIndex}-tp-${tp.id}`}
                                    type="number" 
                                    min="0" 
                                    max="100"
                                    value={val} 
                                    onChange={(e) => handleScoreChange(s.id, 'tp', tp.id, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, studentIndex, `tp-${tp.id}`)}
                                    placeholder="-"
                                    className={`w-full h-full py-2.5 px-1 outline-none text-center text-xs transition-colors ${getScoreColorClass(val)}`} 
                                  />
                                  {/* Tanda Bintang (*) jika belum tuntas sesuai Panduan 2025 Hal. 55 */}
                                  {isBelowKktp && (
                                    <div className="absolute right-1 top-0.5">
                                      <Tooltip content={`Nilai ${numVal} belum mencapai kriteria ketuntasan TP (${kktp}). Memerlukan bimbingan/remedial.`} position="top">
                                        <span className="text-rose-600 font-black text-sm select-none cursor-help px-0.5">
                                          *
                                        </span>
                                      </Tooltip>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* NA-SLM (Tingkat 1) */}
                          <td className="border border-slate-200 p-2 text-center bg-sky-50/50 font-bold text-xs text-sky-900">
                            {res.naSlm !== null ? res.naSlm : <span className="text-slate-300 font-mono">-</span>}
                          </td>

                          {/* Sumatif Akhir Semester (SAS) jika pakai */}
                          {pakaiSas && (
                            <td className="border border-slate-200 p-0 text-center relative bg-amber-50/30 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-500">
                              <input 
                                id={`score-input-${studentIndex}-sas`}
                                type="number" 
                                min="0" 
                                max="100"
                                value={getScore(s.id, 'sumatifAkhir')} 
                                onChange={(e) => handleScoreChange(s.id, 'sumatifAkhir', undefined, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, studentIndex, 'sas')}
                                placeholder="-"
                                className="w-full h-full py-2.5 px-1 outline-none text-center bg-transparent focus:bg-white text-slate-800 font-bold text-xs" 
                              />
                            </td>
                          )}

                          {/* Nilai Akhir Rapor (Tingkat 2 Komposit) */}
                          <td className="border border-slate-200 p-2 text-center bg-indigo-50/40 font-black text-xs">
                            {res.finalScore !== null ? (
                              <span className={`px-2 py-1 rounded-md ${
                                res.finalScore >= kktp 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {res.finalScore}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">-</span>
                            )}
                          </td>

                          {/* Status Ketercapaian */}
                          <td className="border border-slate-200 p-2 text-center text-[11px] font-medium">
                            {res.finalScore !== null ? (
                              res.tpsBelumTercapaiCount === 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                                  <CheckCircle2 size={12} />
                                  <span>Tuntas Semua</span>
                                </span>
                              ) : (
                                <Tooltip content={`${res.tpsBelumTercapaiCount} TP belum tuntas (*) dan perlu bimbingan`} position="top">
                                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold cursor-help">
                                    <span>{res.tpsBelumTercapaiCount} TP Remedial (*)</span>
                                  </span>
                                </Tooltip>
                              )
                            ) : (
                              <span className="text-slate-400 italic">Belum dinilai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Footer Analisis Statistik Kelas */}
                  <tfoot className="bg-slate-100 text-slate-700 text-xs font-bold border-t-2 border-slate-300">
                    {/* Rata-Rata Kelas */}
                    <tr>
                      <td colSpan={2} className="border border-slate-200 p-2.5 text-right font-extrabold sticky left-0 bg-slate-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10">
                        Rata-Rata Nilai Kelas:
                      </td>
                      {displayedTps.map(tp => {
                        const item = classSummary.summaryPerTp[tp.id];
                        return (
                          <td key={tp.id} className="border border-slate-200 p-2 text-center font-mono text-indigo-700">
                            {item?.avg !== null ? item.avg : '-'}
                          </td>
                        );
                      })}
                      {/* Rata-rata NA-SLM */}
                      <td className="border border-slate-200 p-2 text-center font-mono text-sky-800 bg-sky-50">
                        {classSummary.avgNaSlm !== null ? classSummary.avgNaSlm : '-'}
                      </td>
                      {/* Rata-rata SAS */}
                      {pakaiSas && (
                        <td className="border border-slate-200 p-2 text-center font-mono text-amber-800 bg-amber-50">
                          {classSummary.avgSas !== null ? classSummary.avgSas : '-'}
                        </td>
                      )}
                      {/* Rata-rata NA Rapor */}
                      <td className="border border-slate-200 p-2 text-center font-mono text-emerald-700 bg-indigo-50">
                        {classSummary.avgNa !== null ? classSummary.avgNa : '-'}
                      </td>
                      <td className="border border-slate-200 p-2 text-center text-[10px] text-slate-500 font-normal">
                        {classSummary.tuntasNaPersen}% Tuntas
                      </td>
                    </tr>

                    {/* Murid Tuntas per TP */}
                    <tr className="text-[11px] text-emerald-800 bg-emerald-50/50">
                      <td colSpan={2} className="border border-slate-200 p-2 text-right sticky left-0 bg-emerald-50/90 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10 font-semibold">
                        Siswa Tuntas (≥ {kktp}):
                      </td>
                      {displayedTps.map(tp => {
                        const item = classSummary.summaryPerTp[tp.id];
                        return (
                          <td key={tp.id} className="border border-slate-200 p-1.5 text-center font-mono">
                            {item?.tuntas || 0}
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 p-1.5 text-center font-mono">-</td>
                      {pakaiSas && <td className="border border-slate-200 p-1.5 text-center font-mono">-</td>}
                      <td className="border border-slate-200 p-1.5 text-center font-mono text-emerald-700">
                        {classSummary.totalTuntasNa}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center text-[10px] text-slate-500 font-normal">
                        -
                      </td>
                    </tr>

                    {/* Murid Perlu Remedial (*) per TP */}
                    <tr className="text-[11px] text-rose-800 bg-rose-50/50">
                      <td colSpan={2} className="border border-slate-200 p-2 text-right sticky left-0 bg-rose-50/90 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10 font-semibold">
                        Perlu Remedial / Bimbingan (*):
                      </td>
                      {displayedTps.map(tp => {
                        const item = classSummary.summaryPerTp[tp.id];
                        return (
                          <td key={tp.id} className="border border-slate-200 p-1.5 text-center font-mono text-rose-600">
                            {item?.remedial || 0}
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 p-1.5 text-center font-mono">-</td>
                      {pakaiSas && <td className="border border-slate-200 p-1.5 text-center font-mono">-</td>}
                      <td className="border border-slate-200 p-1.5 text-center font-mono text-rose-600">
                        {classSummary.countNa - classSummary.totalTuntasNa}
                      </td>
                      <td className="border border-slate-200 p-1.5 text-center text-[10px] text-slate-500 font-normal">
                        -
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Petunjuk & Keterangan Panduan 2025 */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-rose-600 text-sm">*</span>
                    <span className="text-[11px] text-slate-500">Nilai &lt; KKTP ({kktp}) — Perlu Bimbingan / Remedial.</span>
                  </div>
                  <div className="hidden sm:block text-slate-300">|</div>
                  <div className="text-[11px] text-slate-500">
                    Formula Rapor: {pakaiSas ? `(${rasioSlmSas.slm}% × NA-SLM) + (${rasioSlmSas.sas}% × SAS)` : '100% NA-SLM'}
                  </div>
                  <div className="hidden sm:block text-slate-300">|</div>
                  <div className="text-[11px] text-slate-500">
                    Navigasi: <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold">ENTER</kbd> atau <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold">↓</kbd> ke siswa berikutnya.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Rentang Warna:</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">≤{intervalBatas[0]}</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">≤{intervalBatas[1]}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">≤{intervalBatas[2]}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">≤{intervalBatas[3]}</span>
                    <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">&gt;{intervalBatas[3]}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
