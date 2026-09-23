import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/store';
import { isPabpMapel, getMapelAgama, getTpAgama, doesStudentMatchTp, normalizeAgama, AGAMA_LIST } from '@/lib/agamaUtils';
import { hitungNilaiMapel, hitungDefaultBobotTp, getAmbangBatasKktp } from '@/lib/penilaianUtils';
import Tooltip from '@/components/Tooltip';
import { 
  Download, 
  Upload, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InputNilai() {
  const { state, updateState } = useAppStore();
  const { siswa, mapel, tujuanPembelajaran, nilai } = state;
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [agamaFilter, setAgamaFilter] = useState<string>('ALL');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
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

  // Otomatis deteksi dan set filter agama saat mata pelajaran berganti
  useEffect(() => {
    if (selectedMapelData) {
      const specificAgama = getMapelAgama(selectedMapelData.nama, selectedMapelData.kode);
      if (specificAgama) {
        setAgamaFilter(specificAgama);
      } else {
        setAgamaFilter('ALL');
      }
    }
  }, [selectedMapel, selectedMapelData]);

  const mapelTps = useMemo(() => {
    return tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);
  }, [tujuanPembelajaran, selectedMapel]);

  const isPabp = useMemo(() => {
    return isPabpMapel(selectedMapelData?.nama, selectedMapelData?.kode);
  }, [selectedMapelData]);

  const getStudentAgama = (s: { agama?: string }) => {
    return normalizeAgama(s?.agama) || 'Islam';
  };

  // Filter siswa jika PABP filter aktif (mengambil real-time dari Data Murid / state.siswa)
  const displayedSiswa = useMemo(() => {
    if (isPabp && agamaFilter !== 'ALL') {
      return siswa.filter(s => getStudentAgama(s) === agamaFilter);
    }
    return siswa;
  }, [siswa, isPabp, agamaFilter]);

  // Filter TP jika PABP filter aktif
  const displayedTps = useMemo(() => {
    if (isPabp && agamaFilter !== 'ALL') {
      const filtered = mapelTps.filter(tp => {
        const tpAg = getTpAgama(tp);
        return !tpAg || tpAg.toLowerCase() === agamaFilter.toLowerCase();
      });
      // Jika tidak ada TP terfilter untuk agama ini, tetap tampilkan semua TP
      return filtered.length > 0 ? filtered : mapelTps;
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

  const getAgamaBadgeColor = (ag?: string | null) => {
    const norm = normalizeAgama(ag || undefined);
    switch (norm) {
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
      const sAgama = getStudentAgama(s);
      const sNilai = nilai[s.id]?.[selectedMapel];
      const validTpsForStudent = displayedTps.filter(tp => !isPabp || doesStudentMatchTp(sAgama, tp));
      const res = hitungNilaiMapel(selectedMapelData, validTpsForStudent, sNilai);

      const rowData: (string | number)[] = [
        idx + 1,
        s.nisn || '',
        s.nama,
        sAgama
      ];

      displayedTps.forEach(tp => {
        const isMatch = !isPabp || doesStudentMatchTp(sAgama, tp);
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
  const handleConfirmReset = () => {
    const updatedNilai = { ...nilai };
    siswa.forEach(s => {
      if (updatedNilai[s.id]?.[selectedMapel]) {
        delete updatedNilai[s.id][selectedMapel];
      }
    });
    updateState('nilai', updatedNilai);
    setIsResetConfirmOpen(false);
    showNotification(`Seluruh nilai mata pelajaran ${selectedMapelData?.nama} berhasil dikosongkan.`, 'info');
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Sliders size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Input Nilai Sumatif
            </h2>
          </div>

          {/* Action Tools: Dropdown Mapel, Dropdown Filter Agama (PABP), & Ikon Aksi */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="min-w-[200px] sm:min-w-[240px]">
              <select
                value={selectedMapel}
                onChange={(e) => {
                  setSelectedMapel(e.target.value);
                  setAgamaFilter('ALL');
                }}
                className="w-full border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                {mapel.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.kode})
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Filter Agama: Muncul di samping setelah dropdown Mata Pelajaran jika PABP */}
            {isPabp && (
              <div className="min-w-[170px] sm:min-w-[200px]">
                <select
                  value={agamaFilter}
                  onChange={(e) => setAgamaFilter(e.target.value)}
                  className="w-full border border-emerald-300 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="ALL">Semua Agama ({siswa.length} Siswa)</option>
                  {AGAMA_LIST.map(ag => {
                    const countSiswa = siswa.filter(s => getStudentAgama(s) === ag).length;
                    const countTp = mapelTps.filter(tp => getTpAgama(tp) === ag).length;

                    if (countSiswa === 0 && countTp === 0) return null;

                    return (
                      <option key={ag} value={ag}>
                        {ag} ({countSiswa} Siswa{countTp > 0 ? ` • ${countTp} TP` : ''})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <Tooltip content="Ekspor Nilai ke Excel (.xlsx)" position="bottom">
              <button
                type="button"
                onClick={handleExportXLSX}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-2xs border border-slate-200 transition cursor-pointer"
              >
                <Download size={15} />
              </button>
            </Tooltip>

            <Tooltip content="Impor Nilai dari File Excel (.xlsx, .xls, .csv)" position="bottom">
              <label className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-2xs border border-emerald-200 transition cursor-pointer">
                <Upload size={15} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </Tooltip>

            <Tooltip content={`Kosongkan Nilai (${selectedMapelData?.nama})`} position="bottom">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg shadow-2xs border border-rose-200 transition cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
            </Tooltip>
          </div>
        </div>

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
                      <th rowSpan={2} className="border border-slate-200 p-3 text-left min-w-[200px] max-w-[260px] bg-slate-100 sticky left-0 z-30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        Nama Siswa
                      </th>
                      {isPabp && (
                        <th rowSpan={2} className="border border-slate-200 p-2 text-center w-28 bg-emerald-50/90 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                          Agama Murid
                        </th>
                      )}
                      
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
                      const sAgama = getStudentAgama(s);
                      const sNilai = nilai[s.id]?.[selectedMapel];
                      const validTpsForStudent = displayedTps.filter(tp => !isPabp || doesStudentMatchTp(sAgama, tp));
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
                            </div>
                          </td>

                          {/* Kolom Khusus Agama Murid (PABP) */}
                          {isPabp && (
                            <td className="border border-slate-200 p-2 text-center bg-emerald-50/20">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block ${getAgamaBadgeColor(sAgama)}`}>
                                {sAgama}
                              </span>
                            </td>
                          )}

                          {/* Input Nilai per TP */}
                          {displayedTps.map(tp => {
                            const isMatch = !isPabp || doesStudentMatchTp(sAgama, tp);
                            if (!isMatch) {
                              return (
                                <td 
                                  key={tp.id} 
                                  className="border border-slate-200 p-0 text-center bg-slate-100/70 text-slate-300 font-mono text-xs select-none"
                                >
                                  <Tooltip content={`Siswa beragama ${sAgama}, TP ini khusus untuk ${getTpAgama(tp) || 'agama lain'}`} position="top">
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
                      <td colSpan={isPabp ? 3 : 2} className="border border-slate-200 p-2.5 text-right font-extrabold sticky left-0 bg-slate-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10">
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
                      <td colSpan={isPabp ? 3 : 2} className="border border-slate-200 p-2 text-right sticky left-0 bg-emerald-50/90 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10 font-semibold">
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
                      <td colSpan={isPabp ? 3 : 2} className="border border-slate-200 p-2 text-right sticky left-0 bg-rose-50/90 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] z-10 font-semibold">
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

      {/* Modal Dialog Konfirmasi Reset Nilai (Tailwind CSS) */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Kosongkan Seluruh Nilai?
                </h3>
                <p className="text-xs text-slate-500">
                  Mata Pelajaran: <strong>{selectedMapelData?.nama}</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed mb-5">
              Seluruh nilai sumatif (TP dan SAS) untuk mata pelajaran <strong>{selectedMapelData?.nama}</strong> pada seluruh ({siswa.length}) siswa akan <strong>dikosongkan</strong>. Tindakan ini tidak dapat dibatalkan.
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ya, Kosongkan Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
